import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  AlertCircle, 
  Microscope, 
  TrendingUp, 
  Biohazard,
  Bug,
  Dna
} from 'lucide-react';

export default function DiagnosticCard({
  diseaseData,
  confidence = 0.95,
  foliarDamagePercent = 0,
  severityLevel = "None"
}) {
  const isHealthy = diseaseData.pathogenType === 'Healthy';

  // Badge styling per pathogen category
  const getCategoryBadge = (type) => {
    switch (type) {
      case 'Fungal':
      case 'Oomycete / Fungal':
        return {
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
          icon: <Biohazard className="w-3.5 h-3.5" />,
          label: 'FUNGAL PATHOGEN'
        };
      case 'Bacterial':
        return {
          bg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
          icon: <Bug className="w-3.5 h-3.5" />,
          label: 'BACTERIAL PATHOGEN'
        };
      case 'Viral':
        return {
          bg: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
          icon: <Dna className="w-3.5 h-3.5" />,
          label: 'VIRAL INFECTION'
        };
      case 'Pest (Arthropod)':
        return {
          bg: 'bg-orange-500/15 border-orange-500/30 text-orange-300',
          icon: <Bug className="w-3.5 h-3.5" />,
          label: 'ARTHROPOD PEST'
        };
      default:
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
          label: 'HEALTHY CANOPY'
        };
    }
  };

  const catBadge = getCategoryBadge(diseaseData.pathogenType);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c101a]/90 backdrop-blur-xl p-5 flex flex-col space-y-4 shadow-xl shadow-black/40">
      
      {/* Header with Classification Badge */}
      <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-3.5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider border ${catBadge.bg}`}>
              {catBadge.icon}
              {catBadge.label}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Taxon: {diseaseData.pathogenFamily || 'Agricultural'}
            </span>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-['Outfit']">
            {diseaseData.crop}: <span className="text-emerald-400">{diseaseData.disease}</span>
          </h2>
          <p className="text-xs text-slate-400 italic">
            Causal Organism: <span className="text-slate-200 font-medium">{diseaseData.scientificName}</span>
          </p>
        </div>

        {/* Confidence Percentage Badge */}
        <div className="flex flex-col items-end">
          <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-right">
            <div className="text-lg sm:text-xl font-mono font-black text-emerald-400">
              {(confidence * 100).toFixed(1)}%
            </div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              AI Certainty
            </div>
          </div>
        </div>
      </div>

      {/* Quantitative Foliar Pathology Metrics (Damage & Risk) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        
        {/* Severity Level */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-400" />
            Severity Grade
          </div>
          <div className={`text-base font-bold font-['Outfit'] ${
            severityLevel === 'Critical' ? 'text-red-400' :
            severityLevel === 'Severe' ? 'text-orange-400' :
            severityLevel === 'Moderate' ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {severityLevel.toUpperCase()}
          </div>
          <div className="text-[10px] text-slate-500">
            Foliar damage grading
          </div>
        </div>

        {/* Necrotic Canopy Coverage */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
            <Microscope className="w-3 h-3 text-cyan-400" />
            Necrotic Area
          </div>
          <div className="text-base font-bold font-mono text-cyan-400">
            {foliarDamagePercent}%
          </div>
          <div className="text-[10px] text-slate-500">
            Leaf surface affected
          </div>
        </div>

        {/* Threat / Risk Index */}
        <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-amber-400" />
            Field Risk Index
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold font-mono text-amber-400">
              {diseaseData.riskIndex}/100
            </span>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  diseaseData.riskIndex > 75 ? 'bg-red-500' :
                  diseaseData.riskIndex > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${diseaseData.riskIndex}%` }}
              />
            </div>
          </div>
          <div className="text-[10px] text-slate-500">
            Vector transmission threat
          </div>
        </div>

      </div>

      {/* Pathological Description */}
      <div className="p-3.5 rounded-xl bg-white/[0.015] border border-white/5 text-xs text-slate-300 leading-relaxed">
        <p className="mb-2">
          {diseaseData.description}
        </p>
        <div className="text-[11px] text-slate-400 flex items-center gap-1">
          <span className="font-semibold text-emerald-400">Optimal Microclimate:</span>
          <span>{diseaseData.optimalConditions}</span>
        </div>
      </div>

      {/* Key Foliar Symptoms List */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Characteristic Visual Symptoms:
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300">
          {diseaseData.symptoms?.map((sym, idx) => (
            <li key={idx} className="flex items-start gap-2 bg-white/[0.01] p-2 rounded-lg border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <span>{sym}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Differential Diagnoses (Top-3 Model Predictions) */}
      <div className="space-y-2 pt-1 border-t border-white/5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <span>Differential Diagnoses (Deep Vision Probabilities)</span>
          <span className="font-mono text-emerald-400">Top-3 Candidates</span>
        </div>
        
        <div className="space-y-1.5">
          {/* Primary */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-bold text-white">{diseaseData.crop} - {diseaseData.disease}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${confidence * 100}%` }} />
              </div>
              <span className="font-mono font-bold text-emerald-400">{(confidence * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Secondary Differentials */}
          {diseaseData.differentials?.map((diff, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.01] border border-white/5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                <span>{diff.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                  <div className="bg-slate-500 h-full rounded-full" style={{ width: `${diff.probability * 100}%` }} />
                </div>
                <span className="font-mono text-slate-400">{(diff.probability * 100).toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
