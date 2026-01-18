
import React from 'react';
import { CheckCircle2, Minus, Info } from 'lucide-react';
import { COMPARISON_DATA } from '../constants';
import { MetricRow } from '../types';

export default function ComparisonTable() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Head-to-Head: Distill vs bear-1</h2>
        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">LongBench v2</span>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200">
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Metric</th>
                <th className="px-8 py-5 text-center text-xs font-bold text-red-500 uppercase tracking-wider">bear-1 (v0.9)</th>
                <th className="px-8 py-5 text-center text-xs font-bold text-blue-600 uppercase tracking-wider">Distill</th>
                <th className="px-8 py-5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Winner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {COMPARISON_DATA.map((row: MetricRow, idx: number) => (
                <tr key={idx} className="group hover:bg-gray-50 transition duration-150">
                  <td className="px-8 py-5 font-semibold text-gray-900">{row.metric}</td>
                  <td className="px-8 py-5 text-center text-gray-500">{row.bear1}</td>
                  <td className="px-8 py-5 text-center text-blue-700 font-bold">{row.distill}</td>
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
        
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
          <Info size={14} className="text-gray-400" />
          Both models were evaluated on the LongBench v2 dataset (230 samples, 50 independent runs each) to ensure statistical significance.
        </div>
      </div>
    </section>
  );
}

const WinnerBadge: React.FC<{ winner: string; delta?: string }> = ({ winner, delta }) => {
  if (winner === 'distill') {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-semibold border border-green-100 animate-pulse-subtle">
        <CheckCircle2 size={16} />
        <span>Distill</span>
        {delta && <span className="text-green-600 text-xs font-bold bg-green-100/50 px-1.5 py-0.5 rounded ml-1">{delta}</span>}
      </div>
    );
  }
  if (winner === 'tie') {
    return (
      <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium border border-gray-200">
        <Minus size={14} />
        <span>Statistical Tie</span>
      </div>
    );
  }
  if (winner === 'neutral') {
    return <span className="text-gray-300">—</span>;
  }
  return <span className="text-gray-400">bear-1</span>;
};
