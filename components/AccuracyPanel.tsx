
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { RESULTS_DATA, HISTOGRAM_DATA } from '../constants';

export default function AccuracyPanel() {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-sm border border-[#27272a] p-8 h-full flex flex-col">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Accuracy Analysis</h3>
          <p className="text-sm text-[#a1a1aa]">Performance delta over LongBench v2 baseline</p>
        </div>
        <div className="bg-green-500/20 text-green-400 p-2 rounded-lg border border-green-500/30">
          <TrendingUp size={20} />
        </div>
      </div>
      
      {/* Results Table */}
      <div className="overflow-hidden border border-[#27272a] rounded-xl mb-8">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#a1a1aa] uppercase">Config</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-[#a1a1aa] uppercase">Mean Acc</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-[#a1a1aa] uppercase">Δ vs Baseline</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-[#a1a1aa] uppercase">Significant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a]">
            {RESULTS_DATA.map((row, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition">
                <td className="px-4 py-3 font-mono font-medium text-white">
                  {row.config === 'baseline' ? 'baseline' : `θ=${row.config}`}
                </td>
                <td className="px-4 py-3 text-center font-medium text-white">
                  {row.mean.toFixed(1)}% <span className="text-[#a1a1aa] text-xs font-normal">±{row.stdDev}%</span>
                </td>
                <td className={`px-4 py-3 text-center font-bold ${
                  row.delta?.startsWith('+') ? 'text-green-400' : 
                  row.delta?.startsWith('-') ? 'text-red-400' : 'text-[#a1a1aa]'
                }`}>
                  {row.delta || '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  {row.significant === true && <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs font-bold border border-green-500/30">YES</span>}
                  {row.significant === false && <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-xs font-bold border border-red-500/30">NO</span>}
                  {row.significant === null && <span className="text-[#a1a1aa]">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Histogram Chart */}
      <div className="flex-grow mb-6">
        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          Bootstrap Distribution (10,000 iterations)
          <div className="group relative">
            <AlertCircle size={14} className="text-[#a1a1aa] cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-[#0a0a0a] text-white text-[10px] rounded shadow-xl z-10 border border-[#27272a]">
              Frequency of accuracy gain across 10,000 bootstrap resamplings.
            </div>
          </div>
        </h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={HISTOGRAM_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#a1a1aa' }} />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #27272a', backgroundColor: '#0a0a0a', color: '#fff' }}
              />
              <Bar dataKey="frequency" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                {HISTOGRAM_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index > 1 ? '#10B981' : '#EF4444'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-6 p-4 bg-white/5 rounded-xl border border-[#27272a]">
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">+1.3%</div>
            <div className="text-[10px] text-[#a1a1aa] uppercase tracking-wider font-bold">Mean Diff</div>
          </div>
          <div className="text-center border-x border-[#27272a]">
            <div className="text-lg font-bold text-white">[+0.9, +1.7]</div>
            <div className="text-[10px] text-[#a1a1aa] uppercase tracking-wider font-bold">95% CI</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">100%</div>
            <div className="text-[10px] text-[#a1a1aa] uppercase tracking-wider font-bold">P(better)</div>
          </div>
        </div>
      </div>
      
      {/* Expandable methodology */}
      <button 
        onClick={() => setExpanded(!expanded)}
        className="mt-auto w-full flex items-center justify-center gap-2 py-3 border border-[#27272a] rounded-xl text-sm font-semibold text-white hover:bg-white/5 transition"
      >
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {expanded ? 'Hide Measurement Details' : 'How we measured this'}
      </button>
      
      {expanded && (
        <div className="mt-4 p-5 bg-white/5 rounded-xl text-xs text-[#a1a1aa] leading-relaxed border border-[#27272a] animate-fade-in">
          <ul className="space-y-2">
            <li className="flex gap-2"><span className="text-blue-400 font-bold">•</span> 50 independent runs per configuration using GPT-4o-mini as the backbone.</li>
            <li className="flex gap-2"><span className="text-blue-400 font-bold">•</span> Two-sample t-test utilized to determine significance (|t| &gt; 2).</li>
            <li className="flex gap-2"><span className="text-blue-400 font-bold">•</span> Bootstrap resampling (10k iterations) used to generate confidence intervals.</li>
            <li className="flex gap-2"><span className="text-blue-400 font-bold">•</span> Temperature set to 0 to ensure high reproducibility of results.</li>
          </ul>
        </div>
      )}
    </div>
  );
}