import React from 'react';
import { 
  Sprout, 
  Activity, 
  MapPin, 
  Thermometer, 
  Droplets, 
  FileText, 
  Cpu, 
  CheckCircle2 
} from 'lucide-react';

export default function Header({ onOpenPipelineModal, onDownloadReport, hasResult }) {
  return (
    <header className="border-b border-white/10 bg-[#080b12]/90 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-950/60 border border-emerald-500/40 shadow-lg shadow-emerald-900/30">
              <Sprout className="w-6 h-6 text-emerald-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 pulse-beacon" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-['Outfit']">
                  AgriVision <span className="text-emerald-400">AI</span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  v2.4 PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Intelligent Crop Disease & Foliar Pathology Scanner
              </p>
            </div>
          </div>

          {/* Microclimate & Telemetry Pill (Desktop) */}
          <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-semibold text-emerald-400">PlantVillage Model:</span>
              <span className="text-slate-200">38 Classes</span>
            </div>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sector 4-B</span>
            </div>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              <span>26.4°C</span>
            </div>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>82% RH</span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Academic ML Pipeline Button */}
            <button
              onClick={onOpenPipelineModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-slate-200 border border-white/10 transition-all hover:border-emerald-500/40"
              title="View MobileNetV2 Architecture & PyTorch Training Code"
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">PyTorch ML Code</span>
            </button>

            {/* Agronomist Field Report PDF Button */}
            <button
              onClick={onDownloadReport}
              disabled={!hasResult}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${
                hasResult
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-emerald-500/20 hover:shadow-emerald-500/30'
                  : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
              }`}
              title={hasResult ? "Download publication-ready Agronomist Field Inspection PDF" : "Analyze a leaf first"}
            >
              <FileText className="w-4 h-4" />
              <span>Download Field PDF</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
