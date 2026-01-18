
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { RESULTS_DATA, HISTOGRAM_DATA } from '../constants';

export default function AccuracyPanel() {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 h-full flex flex-col">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Accuracy Analysis</h3>
          <p className="text-sm text-gray-500">Performance delta over LongBench v2 baseline</p>
        </div>
        <div className="bg-green-100 text-green-700 p-2 rounded-lg">
          <TrendingUp size={20} />
        </div>
      </div>
      
      {/* Results Table */}
      <div className="overflow-hidden border border-gray-100 rounded-xl mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Config</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Mean Acc</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Δ vs Baseline</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Significant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {RESULTS_DATA.map((row, idx) => (
              <tr key={idx} className="hover:bg-blue-50/30 transition">
                <td className="px-4 py-3 font-mono font-medium text-gray-700">
                  {row.config === 'baseline' ? 'baseline' : `θ=${row.config}`}
                </td>
                <td className="px-4 py-3 text-center font-medium">
                  {row.mean.toFixed(1)}% <span className="text-gray-400 text-xs font-normal">±{row.stdDev}%</span>
                </td>
                <td className={`px-4 py-3 text-center font-bold ${
                  row.delta?.startsWith('+') ? 'text-green-600' : 
                  row.delta?.startsWith('-') ? 'text-red-600' : 'text-gray-400'
                }`}>
                  {row.delta || '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  {row.significant === true && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">YES</span>}
                  {row.significant === false && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">NO</span>}
                  {row.significant === null && <span className="text-gray-300">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Histogram Chart */}
      <div className="flex-grow mb-6">
        <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          Bootstrap Distribution (10,000 iterations)
          <div className="group relative">
            <AlertCircle size={14} className="text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-[10px] rounded shadow-xl z-10">
              Frequency of accuracy gain across 10,000 bootstrap resamplings.
            </div>
          </div>
        </h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={HISTOGRAM_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="range" tick={{ fontSize: 10 }} />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: '#F9FAFB' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="frequency" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                {HISTOGRAM_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index > 1 ? '#10B981' : '#EF4444'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-6 p-4 bg-gray-50 rounded-xl">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">+1.3%</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Mean Diff</div>
          </div>
          <div className="text-center border-x border-gray-200">
            <div className="text-lg font-bold text-gray-900">[+0.9, +1.7]</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">95% CI</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">100%</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">P(better)</div>
          </div>
        </div>
      </div>
      
      {/* Expandable methodology */}
      <button 
        onClick={() => setExpanded(!expanded)}
        className="mt-auto w-full flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
      >
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {expanded ? 'Hide Measurement Details' : 'How we measured this'}
      </button>
      
      {expanded && (
        <div className="mt-4 p-5 bg-gray-50 rounded-xl text-xs text-gray-600 leading-relaxed border border-gray-100 animate-fade-in">
          <ul className="space-y-2">
            <li className="flex gap-2"><span className="text-blue-500 font-bold">•</span> 50 independent runs per configuration using GPT-4o-mini as the backbone.</li>
            <li className="flex gap-2"><span className="text-blue-500 font-bold">•</span> Two-sample t-test utilized to determine significance (|t| &gt; 2).</li>
            <li className="flex gap-2"><span className="text-blue-500 font-bold">•</span> Bootstrap resampling (10k iterations) used to generate confidence intervals.</li>
            <li className="flex gap-2"><span className="text-blue-500 font-bold">•</span> Temperature set to 0 to ensure high reproducibility of results.</li>
          </ul>
        </div>
      )}
    </div>
  );
}