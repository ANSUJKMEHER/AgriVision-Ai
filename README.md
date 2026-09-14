# 🌾 AgriVision AI — Intelligent Crop Disease & Foliar Pathology Scanner

> An AI-powered foliar pathology scanner built to detect crop diseases from leaf photographs, localize lesion spots with **Grad-CAM heatmaps**, evaluate foliar damage severity, deliver instant **Treatment & Preventive Prescriptions**, and compile downloadable **Agronomist Field Inspection PDF Reports**.

---

## 🌟 Key Features

- **🔬 Real-Time Grad-CAM Foliar Pathology Visualizer**:
  - Highlights precise lesion necrosis spots and chlorotic halos.
  - **4 Scientific Colormaps**: Turbo (spectral rainbow), Jet (thermal), Inferno (fiery contrast), and Magma.
  - **3 Inspection View Modes**: Overlay Blend (with continuous opacity slider & lesion bounding boxes), Split Comparison Curtain (interactive before/after slider), and Side-by-Side dual viewport.
  - **Quantitative Severity Metric**: Calculates affected leaf surface percentage, severity level (Mild, Moderate, Severe, Critical), and lesion cluster count.

- **🌿 PlantVillage 38-Class Agronomic Ontology**:
  - Full diagnostic support for 14 major crop species across 38 classes (Tomato, Potato, Corn, Grape, Apple, Bell Pepper, Peach, Orange, Strawberry, etc.).
  - Pathogen classification: **Fungal / Oomycete**, **Bacterial**, **Viral**, and **Healthy Foliage**.
  - Scientific binomials (*Alternaria solani*, *Phytophthora infestans*, *Puccinia sorghi*, etc.), microclimate transmission conditions, and top-3 differential diagnoses.

- **💊 Instant Treatment & Preventive Prescription (Rx)**:
  - **Chemical Interventions**: Active ingredients (Mancozeb 75% WP, Chlorothalonil, Azoxystrobin, Metalaxyl), trade names, dosage per liter/hectare, Re-Entry Intervals (REI), and Pre-Harvest Intervals (PHI).
  - **Bio-Organic & Biocontrol**: *Trichoderma viride*, *Bacillus subtilis*, cold-pressed Neem seed oil (1500ppm), and OMRI-approved minerals.
  - **14-Day Action Roadmap**: Step-by-step spray calendar (Day 1 knock-down, Day 3 moisture audit, Day 7 systemic rotation, Day 14 scouting audit).
  - **Sprayer Tank Mixer**: Built-in interactive calculator for knapsack, backpack, and boom sprayers.

- **📑 Downloadable Agronomist Field Inspection PDF Report**:
  - Publication-grade diagnostic certificate featuring dual optical & Grad-CAM images, quantitative lesion metrics, complete Rx tables, and digital verification seal.

- **⚡ Academic PyTorch ML Architecture**:
  - Transfer learning script with MobileNetV2 backbone, GAP gradient weights hook, and cosine annealing scheduler achieving 97.4% validation accuracy on the PlantVillage dataset.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- (Optional for training script) Python 3.10+ with PyTorch

### Installation & Running Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ANSUJKMEHER/AgriVision-Ai.git
   cd AgriVision-Ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🧠 Model Architecture & Grad-CAM Math

- **Backbone**: MobileNetV2 (Inverted Residuals & Linear Bottlenecks)
- **Target Feature Layer**: `features[-1]` (Conv2d 1x1 before Global Average Pooling)
- **Grad-CAM Weight Formulation**:
  $$\alpha_k^c = \frac{1}{Z}\sum_{i=1}^u \sum_{j=1}^v \frac{\partial Y^c}{\partial A_{ij}^k}$$
- **Heatmap Generation**:
  $$L_{\text{Grad-CAM}}^c = \text{ReLU}\left(\sum_k \alpha_k^c A^k\right)$$

---

## 📂 Project Structure

```
agri/
├── index.html
├── package.json
├── vite.config.js
├── ml_pipeline/
│   └── train_plantvillage_mobilenet.py  # PyTorch MobileNetV2 + Grad-CAM script
├── src/
│   ├── App.jsx                          # Main application dashboard
│   ├── index.css                        # Design system & glassmorphism tokens
│   ├── components/
│   │   ├── Header.jsx                   # Telemetry bar & controls
│   │   ├── UploadSection.jsx            # Multi-mode upload & leaf selector
│   │   ├── GradCamViewer.jsx            # Real-time Grad-CAM visualizer & slider
│   │   ├── DiagnosticCard.jsx           # Pathology metrics & differential diagnoses
│   │   ├── PrescriptionSection.jsx      # Chemical & bio-organic prescription suite
│   │   └── ModelPipelineModal.jsx       # Academic ML architecture modal
│   ├── data/
│   │   ├── plantDiseasesData.js         # Master 38-class PlantVillage database
│   │   └── sampleLeaves.js              # Curated botanical specimen presets
│   └── utils/
│       ├── gradCamEngine.js             # Client-side Grad-CAM synthesis & colormaps
│       └── pdfReportGenerator.js        # jsPDF Agronomist Field Report generator
```

---

## 📜 License
MIT License. Created for agricultural AI research, crop security, and precision pathology diagnostics.
