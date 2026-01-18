
import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer, ZAxis } from 'recharts';
import { DISTILL_SCATTER, BEAR1_SCATTER } from '../constants';
import { Target } from 'lucide-react';

export default function CompressionChart() {
  const [showBear1, setShowBear1] = useState(true);
  
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-sm border border-[#27272a] p-8 flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Compression Efficiency</h3>
          <p className="text-sm text-[#a1a1aa]">The Accuracy vs. Token Reduction Pareto Frontier</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 p-1 rounded-lg border border-[#27272a]">
           <button 
            onClick={() => setShowBear1(!showBear1)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${showBear1 ? 'bg-white/10 shadow-sm text-red-400 border border-[#27272a]' : 'text-[#a1a1aa] hover:text-white'}`}
          >
            {showBear1 ? 'Comparing bear-1' : 'Hide bear-1'}
          </button>
        </div>
      </div>
      
      <div>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
            <XAxis 
              type="number" 
              dataKey="compression" 
              name="Reduction" 
              unit="%" 
              domain={[0, 100]}
              label={{ value: 'Token Reduction %', position: 'bottom', offset: 0, fontSize: 12, fill: '#a1a1aa' }}
              tick={{ fontSize: 11, fill: '#a1a1aa' }}
            />
            <YAxis 
              type="number" 
              dataKey="accuracy" 
              name="Accuracy Δ" 
              unit="%" 
              domain={[-1, 2]}
              label={{ value: 'Accuracy Δ %', angle: -90, position: 'left', offset: 10, fontSize: 12, fill: '#a1a1aa' }}
              tick={{ fontSize: 11, fill: '#a1a1aa' }}
            />
            <ZAxis type="number" range={[100, 100]} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ borderRadius: '12px', border: '1px solid #27272a', backgroundColor: '#0a0a0a', color: '#fff' }}
              itemStyle={{ fontWeight: 'bold' }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ color: '#fff' }} />
            <ReferenceLine y={0} stroke="#a1a1aa" strokeDasharray="4 4" />
            
            <Scatter 
              name="Distill" 
              data={DISTILL_SCATTER} 
              fill="#2563EB"
              shape="circle"
              line={{ stroke: '#2563EB', strokeWidth: 1.5, strokeDasharray: '5 5' }}
            />
            
            {showBear1 && (
              <Scatter 
                name="bear-1" 
                data={BEAR1_SCATTER} 
                fill="#EF4444"
                shape="cross"
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 p-5 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
        <div className="flex items-center gap-3 mb-2 text-blue-400">
          <Target size={18} />
          <h4 className="font-bold text-sm">Superior Efficiency Frontier</h4>
        </div>
        <p className="text-xs text-[#a1a1aa] leading-relaxed">
          Distill maintains positive accuracy gains even at 68% compression (θ=0.9). By using entropy-based identification, we remove tokens that are highly predictable given the context, whereas bear-1 relies on simpler importance weightings that often prune critical low-frequency semantic anchors.
        </p>
      </div>
    </div>
  );
}
