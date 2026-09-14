"""
AgriVision AI - Single Image Inference + Grad-CAM
=================================================
Loads the trained checkpoint (agrivision_mobilenetv2_plantvillage.pth) and:

  1. Predicts the top-k diseases for one leaf image.
  2. Generates a real Grad-CAM heatmap overlay saved to disk.

Usage:
    python predict.py <image.jpg> [--model path/to/checkpoint.pth] [--outdir out]
"""

import argparse
import json
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models, transforms
from PIL import Image

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

DEVICE = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def build_model(num_classes: int):
    model = models.mobilenet_v2(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(0.2),
        nn.Linear(in_features, num_classes),
    )
    return model.to(DEVICE)


def load_checkpoint(path):
    ckpt = torch.load(path, map_location=DEVICE)
    model = build_model(ckpt["num_classes"])
    model.load_state_dict(ckpt["model_state_dict"])
    model.eval()
    return model, ckpt["class_names"]


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
        cam = F.interpolate(cam, size=x.shape[2:], mode="bilinear", align_corners=False)
        cam = cam.squeeze().cpu().numpy()
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
        return cam


def preprocess(image_path, size=224):
    img = Image.open(image_path).convert("RGB")
    tf = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(size),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ])
    return tf(img).unsqueeze(0).to(DEVICE), img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("image", help="Path to a leaf image")
    ap.add_argument("--model", default="agrivision_output/agrivision_mobilenetv2_plantvillage.pth")
    ap.add_argument("--outdir", default="agrivision_output/predictions")
    ap.add_argument("--topk", type=int, default=3)
    args = ap.parse_args()

    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    model, class_names = load_checkpoint(args.model)
    x, pil_img = preprocess(args.image)

    with torch.no_grad():
        logits = model(x)
        probs = F.softmax(logits, dim=1)[0]
        topk = torch.topk(probs, args.topk)
        pred_idx = int(topk.indices[0])

    print(f"\n[AgriVision] Predictions for {args.image}:")
    for i, idx in enumerate(topk.indices):
        print(f"  {i + 1}. {class_names[int(idx)]:40s} {float(probs[int(idx)]) * 100:.2f}%")

    # Real Grad-CAM overlay
    gradcam = GradCAM(model, model.features[-1])
    cam = gradcam.generate(x, class_idx=pred_idx)

    mean = torch.tensor(IMAGENET_MEAN).view(1, 3, 1, 1)
    std = torch.tensor(IMAGENET_STD).view(1, 3, 1, 1)
    disp = (x[0].cpu() * std + mean).clamp(0, 1).permute(1, 2, 0).numpy()

    fig, axes = plt.subplots(1, 3, figsize=(12, 4))
    axes[0].imshow(disp); axes[0].set_title("Original"); axes[0].axis("off")
    axes[1].imshow(cam, cmap="jet"); axes[1].set_title("Grad-CAM heatmap"); axes[1].axis("off")
    axes[2].imshow(disp); axes[2].imshow(cam, cmap="jet", alpha=0.5)
    axes[2].set_title(f"Overlay: {class_names[pred_idx]}"); axes[2].axis("off")
    fig.tight_layout()

    out_path = outdir / f"{Path(args.image).stem}_gradcam.png"
    fig.savefig(out_path, dpi=140)
    plt.close(fig)
    print(f"\n[AgriVision] Grad-CAM saved to: {out_path.resolve()}")


if __name__ == "__main__":
    main()
