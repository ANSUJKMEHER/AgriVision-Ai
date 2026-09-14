# 🌾 AgriVision AI — Model Training Guide

This guide walks you from **"I haven't trained the model yet"** to **"I have a real MobileNetV2 model + real Grad-CAM running"**.

---

## 0. What you're getting

The `ml_pipeline/` folder now contains a complete, runnable pipeline:

| File | What it does |
|------|--------------|
| `train_plantvillage_mobilenet.py` | Full training: data loading → MobileNetV2 → training loop → **saves weights, class map, curves, confusion matrix, Grad-CAM samples** |
| `predict.py` | Load the trained model, classify one leaf image, generate **real** Grad-CAM overlay |
| `export_onnx.py` | (Optional) Export the model to ONNX for browser/mobile deployment |
| `requirements.txt` | Python dependencies |

It fixes the two bugs in the original script:
1. The old `__main__` was commented out — it never actually trained or saved anything.
2. The old script looked for `data/plantvillage/{train,val}`, but the Kaggle dataset ships as **`train` / `valid`** in a nested folder. The new script **auto-detects** the path.

---

## 1. Train on Kaggle (recommended — free GPU)

1. Go to the dataset page: **https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset** and click **"New Notebook"** (this attaches the dataset automatically).

2. In the notebook, set the accelerator: **Settings → Accelerator → GPU T4 x2** (or P100).

3. Upload the `ml_pipeline/` files to Kaggle, **or** just paste the script. The easiest reliable way:
   - On the notebook, click **"Add Input" → "Upload"** and upload `train_plantvillage_mobilenet.py` as a dataset/input.
   - Then run:

   ```python
   !pip install -q torch torchvision scikit-learn matplotlib
   ```

4. Run the training:

   ```python
   # Set the path to the uploaded script, then run it.
   import sys
   sys.path.append("/kaggle/input/agrivision-ml-scripts")   # adjust to your upload path

   %run /kaggle/input/agrivision-ml-scripts/train_plantvillage_mobilenet.py
   ```

   The script auto-detects the dataset at `/kaggle/input/new-plant-diseases-dataset/...`.
   If auto-detection fails, set it explicitly:

   ```python
   import os
   os.environ["AGRI_DATA_DIR"] = "/kaggle/input/new-plant-diseases-dataset/New Plant Diseases Dataset(Augmented)/New Plant Diseases Dataset(Augmented)"
   ```

5. **Fast smoke test first** (optional but recommended): train on a few hundred images per class to confirm the pipeline runs before the full ~2-hour run:

   ```python
   import os
   os.environ["AGRI_MAX_PER_CLASS"] = "300"
   ```

6. Download the `agrivision_output/` folder (the artifacts) — that's your trained model.

### What the run produces (`agrivision_output/`)

```
agrivision_mobilenetv2_plantvillage.pth   ← weights + class map (load with predict.py)
agrivision_mobilenetv2_state_dict.pth     ← bare weights
class_names.json                          ← 38 class names in index order
class_to_idx.json                         ← name → index map
training_curves.png                       ← loss & accuracy plots
confusion_matrix.png                      ← 38×38 confusion matrix
classification_report.txt                 ← precision / recall / F1 per class
gradcam_samples.png                       ← REAL Grad-CAM heatmaps from validation
```

Expected result: **~96–98% validation accuracy in 8 epochs** on a T4/P100 GPU.

---

## 2. Train locally (if you have a GPU)

```bash
pip install -r ml_pipeline/requirements.txt

# Download + extract the dataset, then point to it:
export AGRI_DATA_DIR="/path/to/New Plant Diseases Dataset(Augmented)/New Plant Diseases Dataset(Augmented)"

python ml_pipeline/train_plantvillage_mobilenet.py
```

On CPU this will be slow (hours) — use Kaggle GPU for anything real.

---

## 3. Use the trained model (real inference)

```bash
python ml_pipeline/predict.py my_leaf.jpg --model agrivision_output/agrivision_mobilenetv2_plantvillage.pth
```

This prints the top-3 predictions **and** saves a real Grad-CAM overlay PNG.

---

## 4. Wiring it into the frontend (important — read this)

Your React UI is polished, but right now it **does not call any model**. It simulates Grad-CAM client-side and picks the disease by filename. To make the project actually work end-to-end you have three options, in order of how much work each takes:

### Option A — Small Python backend (recommended for a demo/jury) ⭐
Keep the React UI, add a tiny **FastAPI** server that runs `predict.py` logic and returns `{prediction, confidence, gradcam_image, prescription}`. The frontend calls it with `fetch()`. ~1–2 hours of work, real model + real Grad-CAM.

### Option B — Fully in-browser with ONNX
Run `export_onnx.py`, then load `model.onnx` with **onnxruntime-web** in the browser. Classification is easy; real Grad-CAM in JS needs the intermediate feature maps, so export a second ONNX that also outputs the last conv layer. More work, but no server needed.

### Option C — Deploy on a free host
Push the ONNX model to Hugging Face / Replicate / Render, call it via HTTP from the React app.

### Two things to fix in the repo regardless of which option you choose

1. **Missing files** — `src/App.jsx` imports these, but they're not committed, so `npm run dev` currently fails:
   - `src/data/plantDiseasesData.js` (the 38-class database)
   - `src/data/sampleLeaves.js` (the sample presets)
   
   Once you train, you can generate `plantDiseasesData.js`'s class keys **exactly** from `class_names.json` (the index order is alphabetical), so predictions match your UI labels.

2. **Honesty about the demo** — if a judge asks "how does the model classify?", be ready to explain that the final product uses the trained MobileNetV2 (Option A/B), and that the current client-side `gradCamEngine.js` is a placeholder visual layer.

---

## 5. Quick reference: key config in the training script

| Setting | Default | Notes |
|---------|---------|-------|
| `NUM_EPOCHS` | 8 | Enough for ~97% on PlantVillage |
| `BATCH_SIZE` | 64 | Lower to 32 if GPU memory is tight |
| `LEARNING_RATE` | 1e-4 | AdamW |
| `MAX_SAMPLES_PER_CLASS` | 0 (all) | Set via env `AGRI_MAX_PER_CLASS=300` for smoke tests |
| `AGRI_DATA_DIR` | auto | Override the dataset path if needed |
