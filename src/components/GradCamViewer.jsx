import React, { useState, useRef, useEffect } from 'react';
import { 
  Eye, 
  Sliders, 
  Layers, 
  SplitSquareVertical, 
  Maximize2, 
  Flame, 
  Target, 
  Scan,
  Sparkles
} from 'lucide-react';

export default function GradCamViewer({
  rawImageUrl,
  heatmapUrl,
  isScanning,
  lesionClusters = [],
  foliarDamagePercent = 0,
  severityLevel = "None",
  colormap = 'turbo',
  onChangeColormap,
  isHealthy = false
}) {
  const [opacity, setOpacity] = useState(0.70);
  const [viewMode, setViewMode] = useState('overlay'); // 'overlay' | 'split' | 'side'
  const [splitPos, setSplitPos] = useState(50); // percentage 0 to 100
  const [showBoxes, setShowBoxes] = useState(true);
  const containerRef = useRef(null);
  const isDraggingSplit = useRef(false);

  // Split view drag handlers
  const handleMouseDown = () => {
    isDraggingSplit.current = true;
  };

  const handleMouseUp = () => {
    isDraggingSplit.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingSplit.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    setSplitPos((x / rect.width) * 100);
  };

  const handleTouchMove = (e) => {
    if (!containerRef.current || !e.touches[0]) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.touches[0].clientX - rect.left));
    setSplitPos((x / rect.width) * 100);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c101a]/90 backdrop-blur-xl p-4 sm:p-5 flex flex-col space-y-4 shadow-xl shadow-black/40">
      
      {/* Viewer Header with Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Scan className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-1.5">
              Foliar Pathology & Grad-CAM Visualizer
              {isHealthy ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                  Healthy Leaf
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  {lesionClusters.length} Lesions Located
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Convolutional activation gradients mapping necrosis and pathogen colonization
            </p>
          </div>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setViewMode('overlay')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              viewMode === 'overlay'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Blended Heatmap Overlay"
          >
            <Layers className="w-3.5 h-3.5 inline mr-1" />
            Overlay
          </button>

          <button
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              viewMode === 'split'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Interactive Split Comparison Slider"
          >
            <SplitSquareVertical className="w-3.5 h-3.5 inline mr-1" />
            Split
          </button>

          <button
            onClick={() => setViewMode('side')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              viewMode === 'side'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Side-by-Side Dual View"
          >
            Side-by-Side
          </button>
        </div>
      </div>

      {/* Main Viewport Stage */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        className={`relative w-full rounded-xl overflow-hidden bg-black/80 border border-white/10 select-none ${
          viewMode === 'side' ? 'grid grid-cols-1 md:grid-cols-2 gap-2 p-2' : 'aspect-square max-h-[500px]'
        }`}
      >
        {/* Animated Scanning Laser Line */}
        {isScanning && (
          <>
            <div className="scan-laser-line" />
            <div className="absolute inset-0 scan-grid-overlay z-10 pointer-events-none opacity-60" />
            <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/40 backdrop-blur-xs">
              <div className="px-4 py-2 rounded-xl bg-[#0e1626]/90 border border-emerald-500/40 text-emerald-400 text-xs font-mono flex items-center gap-2 shadow-xl">
                <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Extracting Spatial Gradient Activation Maps...</span>
              </div>
            </div>
          </>
        )}

        {/* View Mode 1: Overlay Mode */}
        {viewMode === 'overlay' && (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Raw Leaf Image */}
            {rawImageUrl && (
              <img 
                src={rawImageUrl} 
                alt="Raw Leaf Specimen" 
                className="w-full h-full object-contain"
              />
            )}

            {/* Heatmap Overlay with Opacity */}
            {heatmapUrl && (
              <img 
                src={heatmapUrl} 
                alt="Grad-CAM Heatmap" 
                className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-150"
                style={{ opacity }}
              />
            )}

            {/* Lesion Bounding Boxes */}
            {showBoxes && !isHealthy && lesionClusters.map((box, idx) => (
              <div
                key={idx}
                className="absolute border-2 border-dashed border-red-500/90 rounded-md pointer-events-none transition-all duration-300 shadow-sm"
                style={{
                  left: `${box.x * 100}%`,
                  top: `${box.y * 100}%`,
                  width: `${box.width * 100}%`,
                  height: `${box.height * 100}%`,
                  backgroundColor: 'rgba(239, 68, 68, 0.12)'
                }}
              >
                <span className="absolute -top-5 left-0 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-red-600 text-white tracking-wider shadow">
                  SPOT #{idx + 1} ({box.confidence}%)
                </span>
              </div>
            ))}
          </div>
        )}

        {/* View Mode 2: Interactive Split Slider */}
        {viewMode === 'split' && (
          <div className="relative w-full h-full overflow-hidden">
            {/* Base: Raw Leaf Image */}
            {rawImageUrl && (
              <img 
                src={rawImageUrl} 
                alt="Raw Leaf Specimen" 
                className="w-full h-full object-contain"
              />
            )}

            {/* Clipped Top: Heatmap Overlay */}
            {heatmapUrl && (
              <div 
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `polygon(0 0, ${splitPos}% 0, ${splitPos}% 100%, 0 100%)` }}
              >
                <div className="relative w-full h-full">
                  <img 
                    src={rawImageUrl} 
                    alt="Raw Leaf" 
                    className="w-full h-full object-contain"
                  />
                  <img 
                    src={heatmapUrl} 
                    alt="Grad-CAM Heatmap" 
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    style={{ opacity: 0.9 }}
                  />
                </div>
              </div>
            )}

            {/* Split Divider Curtain Bar */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-emerald-400 cursor-ew-resize z-20 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.8)]"
              style={{ left: `${splitPos}%` }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
            >
              <div className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center shadow-lg text-slate-950">
                <SplitSquareVertical className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Split Labels */}
            <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold font-mono text-emerald-300 border border-emerald-500/30 pointer-events-none">
              GRAD-CAM HEATMAP
            </div>
            <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold font-mono text-slate-300 border border-white/20 pointer-events-none">
              RAW SPECIMEN
            </div>
          </div>
        )}

        {/* View Mode 3: Side-by-Side Dual View */}
        {viewMode === 'side' && (
          <>
            {/* Left: Raw Leaf */}
            <div className="relative aspect-square rounded-lg overflow-hidden bg-black/60 border border-white/5 flex items-center justify-center">
              {rawImageUrl && (
                <img 
                  src={rawImageUrl} 
                  alt="Raw Optical Leaf" 
                  className="w-full h-full object-contain"
                />
              )}
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-slate-300">
                Raw Optical Photo
              </span>
            </div>

            {/* Right: Grad-CAM Overlay */}
            <div className="relative aspect-square rounded-lg overflow-hidden bg-black/60 border border-white/5 flex items-center justify-center">
              {rawImageUrl && (
                <img 
                  src={rawImageUrl} 
                  alt="Base" 
                  className="w-full h-full object-contain"
                />
              )}
              {heatmapUrl && (
                <img 
                  src={heatmapUrl} 
                  alt="Grad-CAM" 
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={{ opacity: 0.85 }}
                />
              )}
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
                Grad-CAM Activation
              </span>
            </div>
          </>
        )}

      </div>

      {/* Interactive Controls Panel (Opacity, Colormap, Bounding Boxes) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
        
        {/* Opacity Slider */}
        <div className="sm:col-span-6 bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium whitespace-nowrap">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Opacity:</span>
            <span className="font-mono text-emerald-400 font-bold w-9 text-right">
              {Math.round(opacity * 100)}%
            </span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.02" 
            value={opacity} 
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-full" 
          />
        </div>

        {/* Colormap Selector */}
        <div className="sm:col-span-4 bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Colormap:</span>
          </div>
          <div className="flex items-center gap-1">
            {['turbo', 'jet', 'inferno', 'magma'].map((cmap) => (
              <button
                key={cmap}
                onClick={() => onChangeColormap(cmap)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-all ${
                  colormap === cmap
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cmap}
              </button>
            ))}
          </div>
        </div>

        {/* Bounding Box Toggle */}
        <div className="sm:col-span-2 bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex items-center justify-center">
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            disabled={isHealthy}
            className={`w-full py-1 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              showBoxes && !isHealthy
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            } ${isHealthy ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Boxes</span>
          </button>
        </div>

      </div>

      {/* Thermal Calibration Bar / Scale */}
      <div className="space-y-1 pt-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>0.0 Intact Leaf Matrix</span>
          <span className="text-emerald-400">Feature Activation Intensity</span>
          <span className="text-red-400">1.0 Severe Necrotic Center</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden border border-white/10 shadow-inner flex">
          {colormap === 'turbo' && (
            <div className="w-full h-full bg-gradient-to-r from-[#30123b] via-[#28bbec] via-[#a2fc3c] via-[#fb8022] to-[#7a0403]" />
          )}
          {colormap === 'jet' && (
            <div className="w-full h-full bg-gradient-to-r from-[#000080] via-[#00ffff] via-[#ffff00] to-[#800000]" />
          )}
          {colormap === 'inferno' && (
            <div className="w-full h-full bg-gradient-to-r from-[#000004] via-[#721f81] via-[#cd4071] via-[#fd9668] to-[#fcffa4]" />
          )}
          {colormap === 'magma' && (
            <div className="w-full h-full bg-gradient-to-r from-[#000004] via-[#51127c] via-[#b73779] via-[#fc8961] to-[#fcfdbf]" />
          )}
        </div>
      </div>

    </div>
  );
}
