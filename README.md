---
title: Agrivision Api
emoji: 🌍
colorFrom: green
colorTo: blue
sdk: gradio
sdk_version: 4.44.1
app_file: app.py
pinned: false
---
# 🌾 AgriVision AI — Intelligent Crop Disease & Foliar Pathology Scanner

An AI-powered foliar pathology scanner that detects crop diseases from leaf photos, localizes lesions with **Grad-CAM heatmaps**, grades foliar damage, delivers instant **Treatment & Preventive Prescriptions**, and compiles a downloadable **Agronomist Field Inspection PDF Report**.

Built with a **React (Vite)** frontend, a **PyTorch MobileNetV2** model, and a **FastAPI** inference backend.

---

## ✨ Features

- **🔬 Grad-CAM visualizer** — 4 colormaps (Turbo / Jet / Inferno / Magma), 3 view modes (Overlay / Split / Side-by-side), opacity slider, lesion bounding boxes, and a quantitative severity metric.
- **🌿 PlantVillage 38-class ontology** — 14 crops, pathogen classification (Fungal / Oomycete / Bacterial / Viral / Pest / Healthy), scientific binomials, and top-3 differential diagnoses.
- **💊 Prescription suite** — chemical active ingredients & trade names, bio-organic/biocontrol options, a 14-day intervention roadmap, and a knapsack tank-mixer calculator.
- **📑 PDF report** — publication-grade agronomist field inspection certificate (jsPDF).
- **⚙️ Real ML pipeline** — MobileNetV2 transfer learning + real Grad-CAM, served via FastAPI with a graceful demo-mode fallback.

---

## 📂 Project structure

```
AgriVision-AI/
├── index.html, package.json, vite.config.js   # Vite + React + Tailwind
├── src/
│   ├── App.jsx                                 # Main dashboard + backend integration
│   ├── components/                             # Header, Upload, Grad-CAM viewer, Diagnostic card,
│   │                                           # Prescription, ML pipeline modal
│   ├── data/
│   │   ├── plantDiseasesData.js                # 38-class disease database (NEW)
│   │   └── sampleLeaves.js                     # Bundled demo specimens (NEW)
│   └── utils/
│       ├── gradCamEngine.js                    # Client-side Grad-CAM visualizer
│       └── pdfReportGenerator.js               # jsPDF report generator
├── public/samples/                             # 10 bundled PlantVillage leaf photos (NEW)
├── backend/
│   ├── app.py                                  # FastAPI inference API (NEW)
│   └── requirements.txt
├── ml_pipeline/
│   ├── train_plantvillage_mobilenet.py         # Complete training pipeline (NEW — fixed & runnable)
│   ├── predict.py                              # CLI inference + Grad-CAM (NEW)
│   ├── export_onnx.py                          # Optional ONNX export (NEW)
│   └── requirements.txt
├── TRAINING_GUIDE.md                           # Step-by-step training walkthrough
└── README.md
```

---

## 🚀 Quick start (frontend — works immediately in demo mode)

```bash
npm install
npm run dev        # http://localhost:5173
```

The app runs in **demo mode** out of the box (preloaded specimens + heuristic classification + client-side visualization). No model or backend required.

---

## 🧠 Train the model (later)

The full walkthrough is in **[TRAINING_GUIDE.md](./TRAINING_GUIDE.md)**. In short:

1. Open the dataset on Kaggle and start a GPU notebook:
   https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset
2. Run `ml_pipeline/train_plantvillage_mobilenet.py` (auto-detects the dataset path).
3. Download the produced `agrivision_output/agrivision_mobilenetv2_plantvillage.pth` into this repo (next to `ml_pipeline/`).

Expected: **~96–98% validation accuracy** in 8 epochs.

---

## 🔌 Run live inference (once trained)

```bash
cd backend
pip install -r requirements.txt

# place the checkpoint where the backend can find it, e.g.:
#   ml_pipeline/agrivision_output/agrivision_mobilenetv2_plantvillage.pth

uvicorn app:app --host 0.0.0.0 --port 8000
```

Then reload the frontend — the status pill switches to **"Live MobileNetV2 inference connected"** and uploaded photos are classified by the real model (real Grad-CAM included).

The frontend calls `http://localhost:8000` by default. To change it, create a `.env`:

```bash
# .env
VITE_API_URL=http://localhost:8000
```

---

## 🔄 How the pieces connect

```
Leaf photo ──▶ React frontend ──POST /predict──▶ FastAPI backend ──▶ MobileNetV2
     │                                                   │
     │  ◀── JSON: class_id, confidence, top_k,          │
     │        heatmap (base64), severity, lesion boxes  │
     ▼                                                   ▼
  Disease DB lookup + Grad-CAM render          real Grad-CAM (PyTorch hooks)
```

- **Demo mode** (no model): heuristic classification + client-side visualization — good for UI demos.
- **Live mode** (model trained + backend running): real MobileNetV2 classification + real Grad-CAM.

---

## 📜 License & attribution

MIT License. Sample leaf photos are from the [PlantVillage dataset](https://github.com/spMohanty/PlantVillage-Dataset) (Penn State, CC-BY) — for academic use with attribution. Created for agricultural AI research, crop security, and precision pathology diagnostics.

