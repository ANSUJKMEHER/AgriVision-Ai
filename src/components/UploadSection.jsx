import React, { useRef, useState } from 'react';
import { 
  Upload, 
  Camera, 
  Sparkles, 
  RefreshCw, 
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { SAMPLE_LEAVES } from '../data/sampleLeaves';

export default function UploadSection({
  onSelectSample,
  onFileUpload,
  selectedSampleId,
  isScanning
}) {
  const [dragActive, setDragActive] = useState(false);
  const [useWebcam, setUseWebcam] = useState(false);
  const [webcamError, setWebcamError] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid leaf image file (JPEG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      onFileUpload(event.target.result, file.name);
    };
    reader.readAsDataURL(file);
  };

  // Webcam Capture handling
  const startWebcam = async () => {
    setWebcamError(null);
    setUseWebcam(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: 640, height: 640 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Webcam access error:", err);
      setWebcamError("Camera access unavailable or permission denied. Please upload an image or test a sample.");
      setUseWebcam(false);
    }
  };

  const captureWebcamSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, 600, 600);
    const dataUrl = canvas.toDataURL('image/png');

    // Stop tracks
    if (videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setUseWebcam(false);
    onFileUpload(dataUrl, "Live_Field_Capture.png");
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setUseWebcam(false);
  };

  return (
    <div className="space-y-4">
      
      {/* Upload Zone & Camera Container */}
      <div 
        className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
          dragActive 
            ? 'border-emerald-400 bg-emerald-950/20 shadow-xl shadow-emerald-500/10' 
            : 'border-white/10 bg-[#0c101a]/80 hover:border-white/20'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleChange}
        />

        {useWebcam ? (
          <div className="p-4 flex flex-col items-center justify-center space-y-3">
            <div className="relative w-full max-w-sm aspect-square rounded-xl overflow-hidden bg-black border border-emerald-500/40">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 border-2 border-dashed border-emerald-400/60 rounded-xl pointer-events-none m-6" />
              <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-emerald-300 font-mono">
                Position Leaf Inside Framing Box
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={captureWebcamSnapshot}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all"
              >
                <Camera className="w-4 h-4" />
                Capture & Analyze Leaf
              </button>
              <button 
                onClick={stopWebcam}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Upload className="w-6 h-6 text-emerald-400" />
            </div>

            <h3 className="text-sm font-bold text-white mb-1 font-['Outfit']">
              Upload Foliar Specimen
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Drag & drop any high-resolution crop leaf photo, or take a direct photo from your camera.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                <ImageIcon className="w-4 h-4" />
                Browse File
              </button>

              <button
                type="button"
                onClick={startWebcam}
                className="px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                Live Camera
              </button>
            </div>

            {webcamError && (
              <div className="mt-3 text-[11px] text-amber-400 flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {webcamError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Curated Sample Leaf Chips Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Curated 1-Click Evaluation Leaves (PlantVillage)
          </label>
          <span className="text-[10px] text-slate-500 font-mono">
            {SAMPLE_LEAVES.length} Preloaded Specimens
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {SAMPLE_LEAVES.map((sample) => {
            const isSelected = selectedSampleId === sample.id;
            return (
              <button
                key={sample.id}
                onClick={() => onSelectSample(sample)}
                disabled={isScanning}
                className={`relative group text-left p-2 rounded-xl border transition-all duration-200 ${
                  isSelected 
                    ? 'border-emerald-400 bg-emerald-950/30 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-500/10' 
                    : 'border-white/5 bg-[#0c101a]/60 hover:border-white/20 hover:bg-[#111726]'
                } ${isScanning ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="aspect-square w-full rounded-lg overflow-hidden bg-black/40 mb-1.5 relative">
                  <img 
                    src={sample.imageUrl} 
                    alt={sample.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shadow-sm">
                      <CheckCircle className="w-3 h-3 text-slate-950" />
                    </div>
                  )}
                </div>
                <div className="text-[11px] font-bold text-white truncate">
                  {sample.crop}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {sample.title.replace(sample.crop, '').trim()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
