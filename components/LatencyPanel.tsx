
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from 'recharts';
import { LATENCY_DATA, SCALING_DATA } from '../constants';
import { Zap } from 'lucide-react';

export default function LatencyPanel() {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-sm border border-[#27272a] p-8 h-full flex flex-col">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Latency Breakdown</h3>
          <p className="text-sm text-[#a1a1aa]">End-to-end response time analysis</p>
        </div>
        <div className="bg-yellow-500/20 text-yellow-400 p-2 rounded-lg border border-yellow-500/30">
          <Zap size={20} />
        </div>
      </div>
      
      <div className="h-56 mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={LATENCY_DATA} layout="vertical" margin={{ left: 10, right: 30 }}>
            <XAxis type="number" unit="s" hide />
            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#fff' }} />
            <Tooltip 
              formatter={(value) => `${value}s`}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #27272a', backgroundColor: '#0a0a0a', color: '#fff' }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ color: '#fff' }} />
            <Bar dataKey="compression" stackId="a" fill="#93C5FD" name="Comp. Overhead" radius={[0, 0, 0, 0]} />
            <Bar dataKey="llm" stackId="a" fill="#2563EB" name="LLM Inference" radius={[0, 4, 4, 0]}>
              {LATENCY_DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.name === 'Distill' ? '#2563EB' : (entry.name === 'bear-1' ? '#EF4444' : '#9CA3AF')} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex flex-col items-center">
          <span className="text-2xl font-black text-green-400 leading-none">2.3x</span>
          <span className="text-[10px] text-green-300 font-bold uppercase mt-2">vs Baseline</span>
        </div>
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex flex-col items-center">
          <span className="text-2xl font-black text-blue-400 leading-none">1.2x</span>
          <span className="text-[10px] text-blue-300 font-bold uppercase mt-2">vs bear-1</span>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-bold text-white mb-4">Context Length Scaling</h4>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SCALING_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
              <XAxis dataKey="tokens" tick={{ fontSize: 10, fill: '#a1a1aa' }} />
              <YAxis unit="s" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
              <Tooltip 
                formatter={(value) => `${value}s`}
                contentStyle={{ borderRadius: '8px', border: '1px solid #27272a', backgroundColor: '#0a0a0a', color: '#fff' }}
              />
              <Line type="monotone" dataKey="baseline" stroke="#9CA3AF" strokeWidth={2} dot={false} strokeDasharray="4 4" name="Baseline" />
              <Line type="monotone" dataKey="distill" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#2563EB' }} name="Distill" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-4 text-[10px] text-[#a1a1aa] text-center font-medium italic">
          Performance advantage increases non-linearly with context length due to KV-cache reduction.
        </p>
      </div>
    </div>
  );
}
