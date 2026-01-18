
import React, { useState } from 'react';
import { DollarSign, Wallet } from 'lucide-react';

const PRICE_PER_1M_TOKENS = 0.15; // GPT-4o-mini sample pricing

export default function CostPanel() {
  const [monthlyTokens, setMonthlyTokens] = useState(100);
  
  const baselineCost = monthlyTokens * PRICE_PER_1M_TOKENS;
  const distillCost = monthlyTokens * PRICE_PER_1M_TOKENS * (1 - 0.682);
  const savings = baselineCost - distillCost;
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 h-full flex flex-col">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Cost Efficiency</h3>
          <p className="text-sm text-gray-500">Financial impact of token reduction</p>
        </div>
        <div className="bg-green-100 text-green-700 p-2 rounded-lg">
          <Wallet size={20} />
        </div>
      </div>
      
      <div className="space-y-6 mb-10">
        <CostBar label="Baseline" amount={0.150} percentage={100} color="bg-gray-400" />
        <CostBar label="bear-1" amount={0.051} percentage={34} color="bg-red-400" />
        <CostBar label="Distill" amount={0.048} percentage={32} color="bg-blue-600" isWinner />
      </div>
      
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mt-auto">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign size={18} className="text-blue-600" />
          <h4 className="font-bold text-gray-800">Monthly Savings Estimator</h4>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between text-xs font-bold text-gray-500 uppercase mb-2">
            <span>Estimated Volume</span>
            <span>{monthlyTokens}M Tokens</span>
          </div>
          <input 
            type="range" 
            min="10" 
            max="1000" 
            step="10"
            value={monthlyTokens} 
            onChange={(e) => setMonthlyTokens(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
        
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Standard Cost:</span>
            <span className="text-gray-900 font-bold">${baselineCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Distill Cost:</span>
            <span className="text-blue-600 font-bold">${distillCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="pt-3 flex justify-between items-center">
            <span className="text-gray-800 font-extrabold text-base">Net Savings:</span>
            <span className="text-2xl font-black text-green-600">${savings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
      
      <p className="mt-4 text-[10px] text-gray-400 font-medium text-center">
        *Based on 68.2% avg reduction. Actual results vary by prompt entropy.
      </p>
    </div>
  );
}

const CostBar: React.FC<{ label: string; amount: number; percentage: number; color: string; isWinner?: boolean }> = ({ label, amount, percentage, color, isWinner }) => (
  <div>
    <div className="flex justify-between text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
      <span>{label}</span>
      <span className={isWinner ? 'text-blue-600' : 'text-gray-400'}>${amount.toFixed(3)} / 1M Input Tokens</span>
    </div>
    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
      <div 
        className={`${color} h-full rounded-full transition-all duration-1000 ease-out`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  </div>
);
