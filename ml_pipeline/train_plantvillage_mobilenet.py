"""
AgriVision AI - PlantVillage Training Pipeline (MobileNetV2 + Grad-CAM)
=======================================================================
Trains a MobileNetV2 transfer-learning classifier on the PlantVillage
"New Plant Diseases Dataset" (38 classes) and exports EVERYTHING needed
to run real inference + Grad-CAM later:

  * model weights (state_dict) + full checkpoint (weights + class map)
  * class_names.json  /  class_to_idx.json  (maps label index -> folder name)
  * training history (CSV) + loss/accuracy curves (PNG)
  * confusion matrix (PNG) + classification report (TXT)
  * sample Grad-CAM heatmaps (PNG) for your report/README

Runs on:
  * Kaggle (attach dataset `vipoooool/new-plant-diseases-dataset`; path auto-detected)
  * Any local machine with the dataset extracted (set AGRI_DATA_DIR if needed)

Expected result: ~96-98% validation accuracy in 5-8 epochs on a T4/P100 GPU.

Usage:
    python train_plantvillage_mobilenet.py
"""

import os
import json
import time
import copy
import csv
import glob
import zipfile
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim import lr_scheduler
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms
from PIL import Image

import matplotlib
matplotlib.use("Agg")          # headless: save figures to disk, never open a window
import matplotlib.pyplot as plt

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #
NUM_EPOCHS = 8
BATCH_SIZE = 64
LEARNING_RATE = 1e-4
WEIGHT_DECAY = 1e-2
IMAGE_SIZE = 224
NUM_WORKERS = 4
SEED = 42

# 0 = use every image. Set to e.g. 300 to subsample for a fast smoke test.
MAX_SAMPLES_PER_CLASS = int(os.environ.get("AGRI_MAX_PER_CLASS", "0"))

# Set this if auto-detection can't find your dataset, e.g.
#   AGRI_DATA_DIR=/kaggle/input/new-plant-diseases-dataset/New Plant Diseases Dataset(Augmented)/New Plant Diseases Dataset(Augmented)
DATA_DIR = os.environ.get("AGRI_DATA_DIR", "")

DEVICE = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

# Guard against too-old GPUs (e.g. Tesla P100 / sm_60) that newer PyTorch dropped.
if DEVICE.type == "cuda":
    _cap = torch.cuda.get_device_capability(0)
    if _cap[0] < 7:
        raise RuntimeError(
            f"[AgriVision] This GPU has compute capability {_cap[0]}.{_cap[1]} "
            f"(e.g. Tesla P100), which the installed PyTorch no longer supports "
            f"(it needs >= 7.0). Switch the Kaggle accelerator to 'T4 x2' and re-run."
        )

OUT_DIR = Path("agrivision_output")
OUT_DIR.mkdir(exist_ok=True)

torch.manual_seed(SEED)
np.random.seed(SEED)


# --------------------------------------------------------------------------- #
# Dataset discovery
# --------------------------------------------------------------------------- #
def _find_train_dir(root: Path, max_depth: int = 8) -> Path | None:
    """Bounded directory walk that finds a folder containing a `train` subdir."""
    root = Path(root)
    if not root.exists():
        return None
    stack = [(root, 0)]
    while stack:
        d, depth = stack.pop()
        if depth > max_depth:
            continue
        if (d / "train").is_dir():
            return d / "train"
        try:
            for child in d.iterdir():
                if child.is_dir():
                    stack.append((child, depth + 1))
        except (PermissionError, OSError):
            continue
    return None


def _try_extract_zips(base: Path) -> Path | None:
    """If the dataset shipped as a .zip (Kaggle does not always auto-extract),
    extract it into ./data and return the train/ folder if found."""
    base = Path(base)
    if not base.is_dir():
        return None
    zips = list(base.glob("*.zip")) + list(base.glob("*/*.zip"))
    for zp in zips:
        dest = Path("./data")
        dest.mkdir(exist_ok=True)
        try:
            with zipfile.ZipFile(zp) as z:
                z.extractall(dest)
            print(f"[AgriVision] Extracted {zp} -> {dest}")
            train = _find_train_dir(dest)
            if train is not None:
                return train
        except Exception as e:
            print(f"[AgriVision] Could not unzip {zp}: {e}")
    return None


def resolve_data_dir():
    """Locate the PlantVillage `train` folder and its `valid`/`val` sibling."""
    candidates = [DATA_DIR] if DATA_DIR else [
        "/kaggle/input/new-plant-diseases-dataset",
        "/kaggle/input",
        "./data/plantvillage",
        "./data",
        ".",
    ]
    for base in candidates:
        if not base:
            continue
        train = _find_train_dir(Path(base))
        if train is None:
            train = _try_extract_zips(Path(base))
        if train is None:
            continue
        valid = train.parent / "valid"
        if not valid.is_dir():
            valid = train.parent / "val"
        if not valid.is_dir():
            # No provided validation split -> split train ourselves below.
            valid = None
        print(f"[AgriVision] Dataset located: train={train}")
        print(f"[AgriVision] Validation split : {valid if valid else 'auto-split from train (90/10)'}")
        return train, valid

    # --- Diagnostic: show the user exactly what we can see ---
    print("\n[AgriVision] ERROR: could not locate the PlantVillage dataset.")
    print("[AgriVision] Here is what is visible on this machine:")
    for probe in ["/kaggle/input", "./data", "."]:
        p = Path(probe)
        if not p.exists():
            print(f"  {p}/  -> (does not exist)")
            continue
        try:
            entries = sorted(e.name for e in p.iterdir())[:30]
            print(f"  {p}/  -> {entries}")
        except Exception as e:
            print(f"  {p}/  -> (unreadable: {e})")
    print("\n[AgriVision] FIX — do ONE of the following:")
    print("  1. On Kaggle, click 'Add Input' -> 'Datasets' -> search 'new-plant-diseases-dataset' and add it.")
    print("  2. If the folder is named differently, set AGRI_DATA_DIR to the folder containing 'train/' and 'valid/'.")
    print("     e.g.  os.environ['AGRI_DATA_DIR'] = '/kaggle/input/new-plant-diseases-dataset/New Plant Diseases Dataset(Augmented)/New Plant Diseases Dataset(Augmented)'")
    raise FileNotFoundError("Could not locate the PlantVillage dataset (see diagnostic above).")


# --------------------------------------------------------------------------- #
# Data loading
# --------------------------------------------------------------------------- #
def build_loaders(train_dir: Path, valid_dir: Path | None, batch_size: int):
    train_tf = transforms.Compose([
        transforms.RandomResizedCrop(IMAGE_SIZE, scale=(0.8, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    val_tf = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(IMAGE_SIZE),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    full_train = datasets.ImageFolder(str(train_dir), transform=train_tf)

    if valid_dir is not None:
        # Dataset ships a validation folder -> use it directly.
        train_ds = full_train
        val_ds = datasets.ImageFolder(str(valid_dir), transform=val_tf)
        class_names = full_train.classes
    else:
        # No validation folder -> 90/10 stratified-ish split of train.
        from torch.utils.data import random_split
        n_val = max(1, int(0.1 * len(full_train)))
        n_train = len(full_train) - n_val
        g = torch.Generator().manual_seed(SEED)
        train_ds, val_ds = random_split(full_train, [n_train, n_val], generator=g)
        # Keep the original val transform by swapping val_ds transform.
        val_ds.dataset.transform = val_tf
        class_names = full_train.classes

    if MAX_SAMPLES_PER_CLASS > 0:
        train_ds = _subsample(train_ds, class_names, MAX_SAMPLES_PER_CLASS)

    dataloaders = {
        "train": DataLoader(train_ds, batch_size=batch_size, shuffle=True,
                            num_workers=NUM_WORKERS, pin_memory=True),
        "val": DataLoader(val_ds, batch_size=batch_size, shuffle=False,
                          num_workers=NUM_WORKERS, pin_memory=True),
    }
    sizes = {"train": len(train_ds), "val": len(val_ds)}
    return dataloaders, sizes, class_names


def _subsample(dataset, class_names, per_class):
    """Evenly subsample to `per_class` images per class (for fast smoke tests)."""
    import random
    random.seed(SEED)
    # Map label -> sample indices
    if isinstance(dataset, torch.utils.data.Subset):
        idx_by_class = {c: [] for c in range(len(class_names))}
        for i in dataset.indices:
            _, lab = dataset.dataset.samples[i]
            idx_by_class[lab].append(i)
        chosen = []
        for c in range(len(class_names)):
            chosen.extend(random.sample(idx_by_class[c], min(per_class, len(idx_by_class[c]))))
        return torch.utils.data.Subset(dataset.dataset, chosen)
    # Plain ImageFolder
    idx_by_class = {c: [] for c in range(len(class_names))}
    for i, (_, lab) in enumerate(dataset.samples):
        idx_by_class[lab].append(i)
    chosen = []
    for c in range(len(class_names)):
        chosen.extend(random.sample(idx_by_class[c], min(per_class, len(idx_by_class[c]))))
    return torch.utils.data.Subset(dataset, chosen)


# --------------------------------------------------------------------------- #
# Model
# --------------------------------------------------------------------------- #
def build_model(num_classes: int, freeze_backbone: bool = False):
    print(f"[AgriVision] Building MobileNetV2 backbone for {num_classes} classes ...")
    try:
        model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
    except Exception:
        model = models.mobilenet_v2(pretrained=True)  # older torchvision

    if freeze_backbone:
        for p in model.features.parameters():
            p.requires_grad = False

    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(0.2),
        nn.Linear(in_features, num_classes),
    )
    return model.to(DEVICE)


# --------------------------------------------------------------------------- #
# Grad-CAM (real, gradient-weighted)
# --------------------------------------------------------------------------- #
class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        target_layer.register_forward_hook(self._save_activation)
        target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, module, inp, out):
        self.activations = out.detach()

    def _save_gradient(self, module, grad_in, grad_out):
        self.gradients = grad_out[0].detach()

    def generate(self, input_tensor, class_idx=None):
        self.model.eval()
        output = self.model(input_tensor)
        if class_idx is None:
            class_idx = torch.argmax(output, dim=1).item()
        self.model.zero_grad()
        output[0, class_idx].backward()

        weights = torch.mean(self.gradients, dim=[2, 3], keepdim=True)  # alpha_k
        cam = torch.sum(weights * self.activations, dim=1, keepdim=True)
        cam = torch.relu(cam)
        cam = nn.functional.interpolate(cam, size=(input_tensor.shape[2], input_tensor.shape[3]),
                                        mode="bilinear", align_corners=False)
        cam = cam.squeeze().cpu().numpy()
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
        return cam


# --------------------------------------------------------------------------- #
# Training loop
# --------------------------------------------------------------------------- #
def train_model(model, dataloaders, sizes, criterion, optimizer, scheduler,
                num_epochs=NUM_EPOCHS):
    since = time.time()
    best_acc = 0.0
    best_wts = copy.deepcopy(model.state_dict())
    history = {"epoch": [], "train_loss": [], "train_acc": [],
               "val_loss": [], "val_acc": []}

    for epoch in range(num_epochs):
        print(f"\n--- Epoch {epoch + 1}/{num_epochs} ---")
        for phase in ["train", "val"]:
            model.train() if phase == "train" else model.eval()
            running_loss, running_corrects = 0.0, 0

            for inputs, labels in dataloaders[phase]:
                inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
                optimizer.zero_grad()
                with torch.set_grad_enabled(phase == "train"):
                    outputs = model(inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)
                    if phase == "train":
                        loss.backward()
                        optimizer.step()
                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)

            if phase == "train":
                scheduler.step()

            epoch_loss = running_loss / sizes[phase]
            epoch_acc = running_corrects.double() / sizes[phase]
            history[f"{phase}_loss"].append(epoch_loss)
            history[f"{phase}_acc"].append(epoch_acc.item())
            print(f"  {phase.capitalize():5s} Loss: {epoch_loss:.4f} | Acc: {epoch_acc:.4f}")

            if phase == "val" and epoch_acc > best_acc:
                best_acc = epoch_acc
                best_wts = copy.deepcopy(model.state_dict())

    history["epoch"] = list(range(1, num_epochs + 1))
    elapsed = time.time() - since
    print(f"\n[AgriVision] Training done in {elapsed // 60:.0f}m {elapsed % 60:.0f}s")
    print(f"[AgriVision] Best validation accuracy: {best_acc:.4f}")
    model.load_state_dict(best_wts)
    return model, history, best_acc


# --------------------------------------------------------------------------- #
# Evaluation + exports
# --------------------------------------------------------------------------- #
def evaluate(model, dataloader, class_names):
    model.eval()
    all_preds, all_labels = [], []
    with torch.no_grad():
        for inputs, labels in dataloader:
            inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    report_lines = []
    try:
        from sklearn.metrics import classification_report, confusion_matrix
        report_lines.append(classification_report(all_labels, all_preds,
                                                  target_names=class_names, digits=3))
        cm = confusion_matrix(all_labels, all_preds)
    except ImportError:
        cm = None
        report_lines.append("(sklearn not installed - skipping classification report/confusion matrix)")

    # Confusion matrix figure
    if cm is not None:
        fig, ax = plt.subplots(figsize=(14, 14))
        im = ax.imshow(cm, cmap="viridis")
        ax.set_xlabel("Predicted", fontsize=11)
        ax.set_ylabel("True", fontsize=11)
        ax.set_title(f"Confusion Matrix ({len(class_names)} classes)", fontsize=13)
        ticks = np.arange(len(class_names))
        ax.set_xticks(ticks); ax.set_yticks(ticks)
        ax.set_xticklabels(class_names, rotation=90, fontsize=6)
        ax.set_yticklabels(class_names, fontsize=6)
        fig.colorbar(im, fraction=0.046, pad=0.04)
        fig.tight_layout()
        fig.savefig(OUT_DIR / "confusion_matrix.png", dpi=120)
        plt.close(fig)

    with open(OUT_DIR / "classification_report.txt", "w") as f:
        f.write("\n".join(report_lines))

    return all_preds, all_labels


def save_history_plot(history):
    epochs = history["epoch"]
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
    ax1.plot(epochs, history["train_loss"], label="train")
    ax1.plot(epochs, history["val_loss"], label="val")
    ax1.set_title("Loss"); ax1.set_xlabel("Epoch"); ax1.legend()
    ax2.plot(epochs, history["train_acc"], label="train")
    ax2.plot(epochs, history["val_acc"], label="val")
    ax2.set_title("Accuracy"); ax2.set_xlabel("Epoch"); ax2.legend()
    fig.tight_layout()
    fig.savefig(OUT_DIR / "training_curves.png", dpi=120)
    plt.close(fig)

    with open(OUT_DIR / "training_history.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(history.keys())
        w.writerows(zip(*history.values()))


def save_gradcam_montage(model, dataloader, class_names, n=6):
    """Save a montage of real Grad-CAM heatmaps from the validation set."""
    model.eval()
    # target = last conv layer of MobileNetV2 features
    target_layer = model.features[-1]
    gradcam = GradCAM(model, target_layer)

    mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
    std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)

    fig, axes = plt.subplots(2, n, figsize=(3 * n, 6))
    collected = 0
    for inputs, labels in dataloader:
        for img, lab in zip(inputs, labels):
            if collected >= n:
                break
            x = img.unsqueeze(0).to(DEVICE)
            cam = gradcam.generate(x, class_idx=int(lab))
            # denormalize image for display
            disp = img * std + mean
            disp = disp.clamp(0, 1).permute(1, 2, 0).numpy()
            axes[0, collected].imshow(disp)
            axes[0, collected].set_title(class_names[int(lab)], fontsize=7)
            axes[0, collected].axis("off")
            axes[1, collected].imshow(disp)
            axes[1, collected].imshow(cam, cmap="jet", alpha=0.5)
            axes[1, collected].axis("off")
            collected += 1
        if collected >= n:
            break
    for a in axes.ravel():
        a.axis("off")
    fig.suptitle("Real Grad-CAM — PlantVillage validation samples", fontsize=13)
    fig.tight_layout()
    fig.savefig(OUT_DIR / "gradcam_samples.png", dpi=130)
    plt.close(fig)


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #
def main():
    print("[AgriVision AI] Starting training pipeline.")
    print(f"[AgriVision AI] Device: {DEVICE}")

    train_dir, valid_dir = resolve_data_dir()
    dataloaders, sizes, class_names = build_loaders(train_dir, valid_dir, BATCH_SIZE)
    num_classes = len(class_names)
    print(f"[AgriVision AI] Classes: {num_classes}")
    print(f"[AgriVision AI] Samples: train={sizes['train']}, val={sizes['val']}")

    # Save the label mapping (this is what the frontend needs to map index -> disease)
    class_to_idx = {name: i for i, name in enumerate(class_names)}
    (OUT_DIR / "class_names.json").write_text(json.dumps(class_names, indent=2))
    (OUT_DIR / "class_to_idx.json").write_text(json.dumps(class_to_idx, indent=2))
    print(f"[AgriVision AI] Saved class mapping to {OUT_DIR/'class_names.json'}")

    model = build_model(num_classes)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    scheduler = lr_scheduler.CosineAnnealingLR(optimizer, T_max=NUM_EPOCHS)

    model, history, best_acc = train_model(model, dataloaders, sizes, criterion,
                                           optimizer, scheduler, NUM_EPOCHS)

    # --- Save model (two formats) ---
    # 1) Full checkpoint: weights + class map -> everything predict.py needs.
    torch.save({
        "model_state_dict": model.state_dict(),
        "class_names": class_names,
        "class_to_idx": class_to_idx,
        "num_classes": num_classes,
        "arch": "mobilenet_v2",
        "input_size": IMAGE_SIZE,
        "best_val_acc": float(best_acc),
    }, OUT_DIR / "agrivision_mobilenetv2_plantvillage.pth")
    # 2) Bare state_dict (convenient for reuse in other frameworks).
    torch.save(model.state_dict(), OUT_DIR / "agrivision_mobilenetv2_state_dict.pth")

    # --- Evaluation artifacts ---
    evaluate(model, dataloaders["val"], class_names)
    save_history_plot(history)
    save_gradcam_montage(model, dataloaders["val"], class_names)

    print("\n[AgriVision AI] All artifacts saved to:", OUT_DIR.resolve())
    print("  - agrivision_mobilenetv2_plantvillage.pth  (load with predict.py)")
    print("  - class_names.json / class_to_idx.json")
    print("  - training_curves.png / confusion_matrix.png / classification_report.txt")
    print("  - gradcam_samples.png")


if __name__ == "__main__":
    main()
