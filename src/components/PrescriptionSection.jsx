import React, { useState } from 'react';
import { 
  Pill, 
  Leaf, 
  Calendar, 
  Wrench, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Calculator,
  Droplet
} from 'lucide-react';

export default function PrescriptionSection({ diseaseData }) {
  const [activeTab, setActiveTab] = useState('chemical'); // 'chemical' | 'organic' | 'schedule' | 'cultural'
  const [tankSize, setTankSize] = useState(16); // standard 16L knapsack sprayer

  const chem = diseaseData.chemicalPrescription || {};
  const org = diseaseData.organicPrescription || {};
  const sched = diseaseData.schedule14Day || {};
  const isHealthy = diseaseData.pathogenType === 'Healthy';

  // Calculate required grams/ml for knapsack sprayer
  const approxGramsPerLiter = 2.2;
  const totalRequired = Math.round(tankSize * approxGramsPerLiter);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c101a]/90 backdrop-blur-xl p-5 flex flex-col space-y-4 shadow-xl shadow-black/40">
      
      {/* Header & Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Pill className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white font-['Outfit']">
              Agronomist Prescription & Treatment Protocol
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Targeted curative & preventative interventions tailored to {diseaseData.disease}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('chemical')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'chemical'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            Chemical Rx
          </button>

          <button
            onClick={() => setActiveTab('organic')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'organic'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            Bio-Organic
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            14-Day Roadmap
          </button>

          <button
            onClick={() => setActiveTab('cultural')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'cultural'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Field Sanitation
          </button>
        </div>
      </div>

      {/* Tab 1: Chemical Prescription */}
      {activeTab === 'chemical' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* Active Ingredients & Trade Names */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Primary Registered Active Ingredients
              </div>
              <ul className="space-y-1.5">
                {chem.activeIngredients?.map((item, idx) => (
                  <li key={idx} className="text-xs text-white flex items-center gap-2 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {chem.tradeNames && (
                <div className="pt-2 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Commercial Brands: </span>
                  {chem.tradeNames.join(', ')}
                </div>
              )}
            </div>

            {/* Application Rate & Safety Window */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Dosage & Application Rate
              </div>
              <div className="text-sm font-bold font-mono text-emerald-400">
                {chem.dosage || '2.0 g / Liter water'}
              </div>
              <p className="text-xs text-slate-400">
                {chem.applicationMethod || 'Uniform foliar mist covering upper and lower surfaces.'}
              </p>

              <div className="flex items-center gap-4 pt-1 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>REI: {chem.reEntryInterval || '24 hrs'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>PHI: {chem.preHarvestInterval || '7 days'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Knapsack Sprayer Dosage Calculator Widget */}
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  Field Sprayer Tank Mixer
                </div>
                <div className="text-[11px] text-slate-400">
                  Calculate chemical quantity for your tank volume
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Tank Volume:</span>
                <select
                  value={tankSize}
                  onChange={(e) => setTankSize(parseInt(e.target.value))}
                  className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-emerald-400 font-mono font-bold focus:outline-none"
                >
                  <option value="5">5 Liters (Hand Pump)</option>
                  <option value="16">16 Liters (Knapsack)</option>
                  <option value="20">20 Liters (Backpack)</option>
                  <option value="100">100 Liters (Power Trolley)</option>
                  <option value="400">400 Liters (Tractor Boom)</option>
                </select>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold">
                Add ~{totalRequired}g product
              </div>
            </div>
          </div>

          {/* Precautions & Resistance Warning */}
          {chem.precautions && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Agronomic Warning: </span>
                {chem.precautions}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Bio-Organic Alternatives */}
      {activeTab === 'organic' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Biocontrol Agents */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Microbial Biocontrol
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {org.biocontrol?.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Botanical Extracts */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5" />
              Botanicals & Essential Oils
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {org.botanical || 'Cold-pressed Neem seed oil (1500ppm Azadirachtin) or botanical tea tree extracts.'}
            </p>
          </div>

          {/* Minerals & OMRI Approved */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5" />
              Organic Minerals
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {org.minerals || 'Copper Hydroxide (Kocide OMRI listed) or Potassium Bicarbonate.'}
            </p>
          </div>

        </div>
      )}

      {/* Tab 3: 14-Day Intervention Roadmap */}
      {activeTab === 'schedule' && (
        <div className="space-y-2.5">
          <div className="relative pl-6 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-500/30">
            
            {/* Day 1 */}
            <div className="relative">
              <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0c101a]" />
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="text-[11px] font-bold font-mono text-emerald-400">
                  DAY 01: Immediate Knockdown & Sanitation
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  {sched.day1 || 'Apply primary knock-down spray. Prune dead leaves.'}
                </div>
              </div>
            </div>

            {/* Day 3 */}
            <div className="relative">
              <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-slate-600 border-2 border-[#0c101a]" />
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="text-[11px] font-bold font-mono text-cyan-400">
                  DAY 03 - 04: Moisture Audit & Canopy Drying
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  {sched.day3 || 'Check drip lines, inspect soil moisture, ensure bed mulch is dry.'}
                </div>
              </div>
            </div>

            {/* Day 7 */}
            <div className="relative">
              <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0c101a]" />
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="text-[11px] font-bold font-mono text-emerald-400">
                  DAY 07: Follow-up Systemic / Biocontrol Rotation
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  {sched.day7 || 'Apply follow-up systemic fungicide or Serenade bio-fungicide.'}
                </div>
              </div>
            </div>

            {/* Day 14 */}
            <div className="relative">
              <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-[#0c101a]" />
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="text-[11px] font-bold font-mono text-amber-400">
                  DAY 14: Field Scouting Audit & Long-Term Maintenance
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  {sched.day14 || 'Foliar audit. If lesion count < 2 per plant, resume organic protocol.'}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 4: Cultural & Environmental Controls */}
      {activeTab === 'cultural' && (
        <div className="space-y-2">
          <div className="text-xs text-slate-400">
            Prevent recurrence and break pathogen life cycles using integrated cultural controls:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {diseaseData.culturalPractices?.map((prac, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  {idx + 1}
                </div>
                <div className="text-xs text-slate-300 leading-snug">
                  {prac}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
