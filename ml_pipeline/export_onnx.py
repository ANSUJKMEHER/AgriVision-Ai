"""
AgriVision AI - Export trained model to ONNX (for browser / mobile deployment)
==============================================================================
Converts the MobileNetV2 checkpoint to ONNX so it can run in the browser via
onnxruntime-web or on mobile. Classification only (no Grad-CAM).

Usage:
    python export_onnx.py --model agrivision_output/agrivision_mobilenetv2_plantvillage.pth --out agrivision_output/model.onnx
"""

import argparse
from pathlib import Path

import torch
from torchvision import models

try:
    import onnx
    import onnxruntime as ort
except ImportError:
    onnx = ort = None


def build_model(num_classes: int):
    import torch.nn as nn
    model = models.mobilenet_v2(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(nn.Dropout(0.2), nn.Linear(in_features, num_classes))
    return model


def main():
    if onnx is None:
        print("onnx / onnxruntime not installed. Run: pip install onnx onnxruntime")
        return

    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="agrivision_output/agrivision_mobilenetv2_plantvillage.pth")
    ap.add_argument("--out", default="agrivision_output/model.onnx")
    args = ap.parse_args()

    ckpt = torch.load(args.model, map_location="cpu")
    model = build_model(ckpt["num_classes"])
    model.load_state_dict(ckpt["model_state_dict"])
    model.eval()

    dummy = torch.randn(1, 3, 224, 224)
    torch.onnx.export(
        model, dummy, args.out,
        input_names=["input"], output_names=["logits"],
        dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=13,
    )
    print(f"[AgriVision] ONNX model exported to {args.out}")

    # Sanity check with onnxruntime
    sess = ort.InferenceSession(args.out, providers=["CPUExecutionProvider"])
    out = sess.run(None, {"input": dummy.numpy()})[0]
    pred = int(out.argmax())
    print(f"[AgriVision] ONNX sanity check passed. Sample prediction index: {pred} "
          f"({ckpt['class_names'][pred]})")


if __name__ == "__main__":
    main()
