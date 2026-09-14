"""
AgriVision AI — Inference API (FastAPI)
=======================================
Serves the trained MobileNetV2 model to the React frontend:

  GET  /health   -> model status (loaded or not)
  POST /predict  -> real classification + real Grad-CAM heatmap + metrics

Run (after training — see ../TRAINING_GUIDE.md):

  pip install -r requirements.txt
  uvicorn app:app --host 0.0.0.0 --port 8000

The frontend reads http://localhost:8000 by default (override with VITE_API_URL).
If the model file is missing, /predict returns 503 and the frontend falls back
to demo mode automatically.
"""

import io
import os
import base64
from pathlib import Path
from collections import deque

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models, transforms
from PIL import Image

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="AgriVision AI Inference API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DEVICE = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]
IMAGE_SIZE = 224
HEAT_SIZE = 450

# Look for the checkpoint in a few common locations.
CHECKPOINT_CANDIDATES = [
    os.environ.get("AGRI_MODEL", ""),
    "agrivision_output/agrivision_mobilenetv2_plantvillage.pth",
    "ml_pipeline/agrivision_output/agrivision_mobilenetv2_plantvillage.pth",
    "../ml_pipeline/agrivision_output/agrivision_mobilenetv2_plantvillage.pth",
]


# --------------------------------------------------------------------------- #
# Model
# --------------------------------------------------------------------------- #
def build_model(num_classes: int):
    model = models.mobilenet_v2(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(0.2),
        nn.Linear(in_features, num_classes),
    )
    return model.to(DEVICE)


def load_model():
    for cand in CHECKPOINT_CANDIDATES:
        if cand and Path(cand).exists():
            ckpt = torch.load(cand, map_location=DEVICE)
            model = build_model(ckpt["num_classes"])
            model.load_state_dict(ckpt["model_state_dict"])
            model.eval()
            return model, ckpt["class_names"]
    return None, []


MODEL, CLASS_NAMES = load_model()
MODEL_LOADED = MODEL is not None
print(f"[AgriVision API] Model loaded: {MODEL_LOADED} | classes: {len(CLASS_NAMES)}")


# --------------------------------------------------------------------------- #
# Grad-CAM
# --------------------------------------------------------------------------- #
class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        target_layer.register_forward_hook(self._act)
        target_layer.register_full_backward_hook(self._grad)

    def _act(self, m, i, o):
        self.activations = o.detach()

    def _grad(self, m, gi, go):
        self.gradients = go[0].detach()

    def generate(self, x, class_idx):
        self.model.eval()
        out = self.model(x)
        self.model.zero_grad()
        out[0, class_idx].backward()
        w = torch.mean(self.gradients, dim=[2, 3], keepdim=True)
        cam = torch.relu(torch.sum(w * self.activations, dim=1, keepdim=True))
        cam = F.interpolate(cam, size=(HEAT_SIZE, HEAT_SIZE), mode="bilinear", align_corners=False)
        cam = cam.squeeze().cpu().numpy()
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
        return cam


# --------------------------------------------------------------------------- #
# Analysis helpers (severity / damage / lesion boxes from the heatmap)
# --------------------------------------------------------------------------- #
def colorize_heatmap(cam, colormap="turbo"):
    """Render the normalized heatmap to a colorized RGBA PNG (base64)."""
    try:
        cmap = plt.get_cmap(colormap)
    except ValueError:
        cmap = plt.get_cmap("jet")
    rgba = cmap(cam)
    rgba[..., 3] = np.clip(cam ** 1.1 * 0.9 + 0.05, 0, 1)  # alpha by intensity
    img = Image.fromarray((rgba * 255).astype(np.uint8), "RGBA")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def analyze(cam, class_id):
    """Estimate damage %, severity, and lesion bounding boxes from the heatmap."""
    if "healthy" in class_id.lower():
        return 0.0, "None", []

    vals = cam.flatten()
    damage = float(np.clip((vals > 0.55).mean() * 100 * 1.6, 3.0, 78.0))

    if damage > 40:
        severity = "Critical"
    elif damage > 25:
        severity = "Severe"
    elif damage > 10:
        severity = "Moderate"
    else:
        severity = "Mild"

    boxes = find_boxes(cam)
    return round(damage, 1), severity, boxes


def find_boxes(cam, grid=64):
    """Connected-component labeling on a downsampled heatmap -> bounding boxes."""
    small = np.array(Image.fromarray((cam * 255).astype(np.uint8)).resize((grid, grid))) / 255.0
    mask = small > 0.5
    labels = np.zeros((grid, grid), dtype=int)
    comp = 0
    boxes = []
    for sy in range(grid):
        for sx in range(grid):
            if mask[sy, sx] and labels[sy, sx] == 0:
                comp += 1
                q = deque([(sx, sy)])
                labels[sy, sx] = comp
                minx = maxx = sx
                miny = maxy = sy
                area = 0
                while q:
                    cx, cy = q.popleft()
                    area += 1
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                        if 0 <= nx < grid and 0 <= ny < grid and mask[ny, nx] and labels[ny, nx] == 0:
                            labels[ny, nx] = comp
                            q.append((nx, ny))
                            minx, maxx = min(minx, nx), max(maxx, nx)
                            miny, maxy = min(miny, ny), max(maxy, ny)
                if area >= 3:
                    peak = float(small[miny:maxy + 1, minx:maxx + 1].max())
                    boxes.append({
                        "x": round(minx / grid, 3), "y": round(miny / grid, 3),
                        "w": round(max(0.08, (maxx - minx + 2) / grid), 3),
                        "h": round(max(0.08, (maxy - miny + 2) / grid), 3),
                        "confidence": round(float(peak), 3),
                    })
    boxes.sort(key=lambda b: b["confidence"], reverse=True)
    return boxes[:6]


# --------------------------------------------------------------------------- #
# Preprocessing
# --------------------------------------------------------------------------- #
def preprocess(img: Image.Image):
    tf = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(IMAGE_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD),
    ])
    return tf(img).unsqueeze(0).to(DEVICE)


# --------------------------------------------------------------------------- #
# Routes
# --------------------------------------------------------------------------- #
@app.get("/health")
def health():
    return {"model_loaded": MODEL_LOADED, "num_classes": len(CLASS_NAMES)}


@app.post("/predict")
async def predict(file: UploadFile = File(...), colormap: str = Form("turbo")):
    if not MODEL_LOADED:
        return JSONResponse(
            status_code=503,
            content={"detail": "Model not trained yet. Run ml_pipeline/train_plantvillage_mobilenet.py first."},
        )

    data = await file.read()
    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception:
        return JSONResponse(status_code=400, content={"detail": "Invalid image file."})

    x = preprocess(img)

    with torch.no_grad():
        logits = MODEL(x)
        probs = F.softmax(logits, dim=1)[0]
    topk = torch.topk(probs, min(3, len(CLASS_NAMES)))
    pred_idx = int(topk.indices[0])
    class_id = CLASS_NAMES[pred_idx]
    confidence = float(probs[pred_idx])
    top_k = [{"class_id": CLASS_NAMES[int(i)], "confidence": float(probs[int(i)])} for i in topk.indices]

    cam = GradCAM(MODEL, MODEL.features[-1]).generate(x, pred_idx)
    heatmap_b64 = colorize_heatmap(cam, colormap)
    damage, severity, boxes = analyze(cam, class_id)

    return {
        "class_id": class_id,
        "class_index": pred_idx,
        "confidence": confidence,
        "top_k": top_k,
        "heatmap_base64": heatmap_b64,
        "damage_percent": damage,
        "severity": severity,
        "lesion_boxes": boxes,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
