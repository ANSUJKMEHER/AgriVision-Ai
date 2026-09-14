<div align="center">
  
  
  <h1>🌾 AgriVision AI</h1>
  <p><b>Intelligent Crop Disease & Foliar Pathology Scanner</b></p>

  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite">
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind">
    <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=FastAPI&logoColor=white" alt="FastAPI">
    <img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" alt="PyTorch">
  </p>
</div>

An AI-powered foliar pathology scanner that detects crop diseases from leaf photos, localizes lesions with **Grad-CAM heatmaps**, grades foliar damage, delivers instant **Treatment & Preventive Prescriptions**, and compiles a downloadable **Agronomist Field Inspection PDF Report**.

Built with a **React (Vite)** frontend, a **PyTorch MobileNetV2** model, and a **FastAPI** inference backend.

---

## ✨ Features

- **🔬 Grad-CAM visualizer** — 4 colormaps (Turbo / Jet / Inferno / Magma), 3 view modes (Overlay / Split / Side-by-side), opacity slider, lesion bounding boxes, and a quantitative severity metric.
- **🌿 PlantVillage 38-class ontology** — 14 crops, pathogen classification (Fungal / Oomycete / Bacterial / Viral / Pest / Healthy), scientific binomials, and top-3 differential diagnoses.
- **💊 Prescription suite** — chemical active ingredients & trade names, bio-organic/biocontrol options, a 14-day intervention roadmap, and a knapsack tank-mixer calculator.
- **📑 PDF report** — publication-grade agronomist field inspection certificate (jsPDF).
- **⚙️ Real ML pipeline** — MobileNetV2 transfer learning + real Grad-CAM, served via FastAPI with a graceful demo-mode fallback if no model is present.

---

## 🚀 Quick start (UI Demo Mode)

You can run the frontend instantly in **demo mode** (uses preloaded specimens + heuristic classification + client-side Grad-CAM visualization) without needing the Python backend or PyTorch model installed!

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

## 🧠 Train the Model

The full training walkthrough is documented in **[TRAINING_GUIDE.md](./TRAINING_GUIDE.md)**. 

1. Start a GPU notebook on Kaggle using the [New Plant Diseases Dataset](https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset).
2. Run `ml_pipeline/train_plantvillage_mobilenet.py` (auto-detects the dataset path).
3. Download the produced `agrivision_mobilenetv2_plantvillage.pth` into this repository (e.g., inside `ml_pipeline/agrivision_output/`).

**Expected Results:** ~96–98% validation accuracy in just 8 epochs using transfer learning.

---

## 🔌 Run Live Inference API

Once you have trained the model (or downloaded the `.pth` weights file), you can start the FastAPI backend to run real live PyTorch inference on uploaded photos.

1. Navigate to the backend directory and install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Start the Uvicorn server:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

3. Reload your React frontend (`http://localhost:5173`). The status indicator will automatically switch to **"Live MobileNetV2 inference connected"**. Uploaded photos will now be classified by the PyTorch model, complete with real Grad-CAM heatmaps returned via the API.

> Note: The frontend calls `http://localhost:8000` by default. To change it, create a `.env` file in the root directory with `VITE_API_URL=http://your-url`.

---

## 📂 Project Architecture

```
AgriVision-AI/
├── src/                                        # React Frontend Source
│   ├── components/                             # UI Components (Dashboard, Grad-CAM viewer)
│   ├── data/                                   # 38-class disease DB & Demo specimens
│   └── utils/                                  # Client-side generators (Grad-CAM, PDF)
├── public/samples/                             # Bundled PlantVillage test photos
├── backend/                                    
│   ├── app.py                                  # FastAPI inference API
│   └── requirements.txt                        # Python backend dependencies
├── ml_pipeline/                                # PyTorch Training Pipeline
│   ├── train_plantvillage_mobilenet.py         # Complete training script
│   ├── predict.py                              # CLI inference tool
│   ├── export_onnx.py                          # ONNX conversion utility
│   └── requirements.txt                        # ML specific dependencies
└── TRAINING_GUIDE.md                           # Step-by-step training instructions
```

## 🔄 How the pieces connect

```
Leaf photo ──▶ React frontend ──POST /predict──▶ FastAPI backend ──▶ MobileNetV2
     │                                                   │
     │  ◀── JSON: class_id, confidence, top_k,          │
     │        heatmap (base64), severity, lesion boxes  │
     ▼                                                   ▼
  Disease DB lookup + Grad-CAM render          real Grad-CAM (PyTorch hooks)
```

## 📜 License & Attribution

MIT License. Sample leaf photos are sourced from the [PlantVillage dataset](https://github.com/spMohanty/PlantVillage-Dataset) (Penn State, CC-BY) for academic use with attribution. Created for agricultural AI research, crop security, and precision pathology diagnostics.
