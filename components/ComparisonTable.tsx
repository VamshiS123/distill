
import React from 'react';
import { CheckCircle2, Minus, Info } from 'lucide-react';
import { COMPARISON_DATA } from '../constants';
import { MetricRow } from '../types';

export default function ComparisonTable() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-8">
        <h2 className="text-3xl font-bold text-white">Head-to-Head: Distill vs bear-1</h2>
        <span className="px-3 py-1 bg-white/10 text-[#a1a1aa] rounded-full text-xs font-semibold border border-[#27272a]">LongBench v2</span>
      </div>
      
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-sm border border-[#27272a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-white/5 border-b border-[#27272a]">
                <th className="px-8 py-5 text-left text-xs font-bold text-[#a1a1aa] uppercase tracking-wider">Metric</th>
                <th className="px-8 py-5 text-center text-xs font-bold text-red-400 uppercase tracking-wider">bear-1 (v0.9)</th>
                <th className="px-8 py-5 text-center text-xs font-bold text-blue-400 uppercase tracking-wider">Distill</th>
                <th className="px-8 py-5 text-center text-xs font-bold text-[#a1a1aa] uppercase tracking-wider">Winner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {COMPARISON_DATA.map((row: MetricRow, idx: number) => (
                <tr key={idx} className="group hover:bg-white/5 transition duration-150">
                  <td className="px-8 py-5 font-semibold text-white">{row.metric}</td>
                  <td className="px-8 py-5 text-center text-[#a1a1aa]">{row.bear1}</td>
                  <td className="px-8 py-5 text-center text-blue-400 font-bold">{row.distill}</td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center">
                      <WinnerBadge winner={row.winner} delta={row.delta} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-8 py-4 bg-white/5 border-t border-[#27272a] flex items-center gap-2 text-sm text-[#a1a1aa]">
          <Info size={14} className="text-[#a1a1aa]" />
          Both models were evaluated on the LongBench v2 dataset (230 samples, 100 independent runs each) to ensure statistical significance.
        </div>
      </div>
    </section>
  );
}

const WinnerBadge: React.FC<{ winner: string; delta?: string }> = ({ winner, delta }) => {
  if (winner === 'distill') {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold border border-green-500/30 animate-pulse-subtle">
        <CheckCircle2 size={16} />
        <span>Distill</span>
        {delta && <span className="text-green-300 text-xs font-bold bg-green-500/30 px-1.5 py-0.5 rounded ml-1">{delta}</span>}
      </div>
    );
  }
  if (winner === 'tie') {
    return (
      <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/10 text-[#a1a1aa] rounded-full text-sm font-medium border border-[#27272a]">
        <Minus size={14} />
        <span>Statistical Tie</span>
      </div>
    );
  }
  if (winner === 'neutral') {
    return <span className="text-[#a1a1aa]">—</span>;
  }
  return <span className="text-[#a1a1aa]">bear-1</span>;
};
