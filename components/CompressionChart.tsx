
import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer, ZAxis } from 'recharts';
import { DISTILL_SCATTER, BEAR1_SCATTER } from '../constants';
import { Target } from 'lucide-react';

export default function CompressionChart() {
  const [showBear1, setShowBear1] = useState(true);
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Compression Efficiency</h3>
          <p className="text-sm text-gray-500">The Accuracy vs. Token Reduction Pareto Frontier</p>
        </div>
        <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-lg">
           <button 
            onClick={() => setShowBear1(!showBear1)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${showBear1 ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {showBear1 ? 'Comparing bear-1' : 'Hide bear-1'}
          </button>
        </div>
      </div>
      
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis 
              type="number" 
              dataKey="compression" 
              name="Reduction" 
              unit="%" 
              domain={[0, 100]}
              label={{ value: 'Token Reduction %', position: 'bottom', offset: 0, fontSize: 12, fill: '#6B7280' }}
              tick={{ fontSize: 11, fill: '#6B7280' }}
            />
            <YAxis 
              type="number" 
              dataKey="accuracy" 
              name="Accuracy Δ" 
              unit="%" 
              domain={[-1, 2]}
              label={{ value: 'Accuracy Δ %', angle: -90, position: 'left', offset: 10, fontSize: 12, fill: '#6B7280' }}
              tick={{ fontSize: 11, fill: '#6B7280' }}
            />
            <ZAxis type="number" range={[100, 100]} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontWeight: 'bold' }}
            />
            <Legend verticalAlign="top" height={36} />
            <ReferenceLine y={0} stroke="#9CA3AF" strokeDasharray="4 4" />
            
            {/* Success Area Shading */}
            <rect x="50%" y="-10%" width="50%" height="100%" fill="#10B981" fillOpacity={0.03} pointerEvents="none" />
            
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
      
      <div className="mt-6 p-5 bg-blue-50 border border-blue-100 rounded-2xl">
        <div className="flex items-center gap-3 mb-2 text-blue-900">
          <Target size={18} />
          <h4 className="font-bold text-sm">Superior Efficiency Frontier</h4>
        </div>
        <p className="text-xs text-blue-800 leading-relaxed">
          Distill maintains positive accuracy gains even at 68% compression (θ=0.9). By using entropy-based identification, we remove tokens that are highly predictable given the context, whereas bear-1 relies on simpler importance weightings that often prune critical low-frequency semantic anchors.
        </p>
      </div>
    </div>
  );
}
