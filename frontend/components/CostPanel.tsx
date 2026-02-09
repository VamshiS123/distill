
import React, { useState } from 'react';
import { DollarSign, Database, ArrowRight } from 'lucide-react';
import { LATENCY_DATA } from '../constants';

const PRICE_PER_1M_TOKENS = 0.15; // GPT-4o-mini sample pricing

// Calculate cost efficiency based on LLM inference times
// Cost is proportional to inference time (faster inference = lower cost per token)
const BASELINE_LLM_TIME = 12.06; // seconds
const BEAR1_LLM_TIME = 2.2; // seconds
const DISTILL_LLM_TIME = 2.11; // seconds

const BASELINE_COST = PRICE_PER_1M_TOKENS;
const BEAR1_COST = PRICE_PER_1M_TOKENS * (BEAR1_LLM_TIME / BASELINE_LLM_TIME);
const DISTILL_COST = PRICE_PER_1M_TOKENS * (DISTILL_LLM_TIME / BASELINE_LLM_TIME);

const BASELINE_PERCENTAGE = 100;
const BEAR1_PERCENTAGE = (BEAR1_LLM_TIME / BASELINE_LLM_TIME) * 100;
const DISTILL_PERCENTAGE = (DISTILL_LLM_TIME / BASELINE_LLM_TIME) * 100;

export default function CostPanel() {
  const [monthlyTokens, setMonthlyTokens] = useState(100);
  
  const baselineCost = monthlyTokens * BASELINE_COST;
  const distillCost = monthlyTokens * DISTILL_COST;
  const savings = baselineCost - distillCost;
  
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-sm border border-[#27272a] p-8 h-full flex flex-col">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Cost Efficiency</h3>
          <p className="text-sm text-[#a1a1aa]">Financial impact of token reduction</p>
        </div>
        <a 
          href="https://docs.google.com/spreadsheets/d/1UKq9BRvGuTh77XDEcClZUbU1eySqYg7TEuMzSeMHkn4/edit?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500/20 text-green-400 p-2 rounded-lg border border-green-500/30 hover:bg-green-500/30 hover:border-green-500/50 transition-all cursor-pointer flex items-center gap-1.5 group"
        >
          <Database size={18} />
          <ArrowRight size={14} className="opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </a>
      </div>
      
      <div className="space-y-6 mb-10">
        <CostBar label="Baseline" amount={BASELINE_COST} percentage={BASELINE_PERCENTAGE} color="bg-gray-500" />
        <CostBar label="bear-1" amount={BEAR1_COST} percentage={BEAR1_PERCENTAGE} color="bg-red-500" />
        <CostBar label="Distill" amount={DISTILL_COST} percentage={DISTILL_PERCENTAGE} color="bg-blue-500" isWinner />
      </div>
      
      <div className="bg-white/5 rounded-2xl p-6 border border-[#27272a] mt-auto">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign size={18} className="text-blue-400" />
          <h4 className="font-bold text-white">Monthly Savings Estimator</h4>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between text-xs font-bold text-[#a1a1aa] uppercase mb-2">
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
            className="w-full h-2 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
        
        <div className="space-y-3 pt-4 border-t border-[#27272a]">
          <div className="flex justify-between text-sm">
            <span className="text-[#a1a1aa] font-medium">Standard Cost:</span>
            <span className="text-white font-bold">${baselineCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#a1a1aa] font-medium">Distill Cost:</span>
            <span className="text-blue-400 font-bold">${distillCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="pt-3 flex justify-between items-center">
            <span className="text-white font-extrabold text-base">Net Savings:</span>
            <span className="text-2xl font-black text-green-400">${savings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
      
      <p className="mt-4 text-[10px] text-[#a1a1aa] font-medium text-center">
        *Cost efficiency calculated based on LLM inference time ratios. Baseline: 12.06s, bear-1: 2.2s, Distill: 2.11s.
      </p>
    </div>
  );
}

const CostBar: React.FC<{ label: string; amount: number; percentage: number; color: string; isWinner?: boolean }> = ({ label, amount, percentage, color, isWinner }) => (
  <div>
    <div className="flex justify-between text-xs font-bold text-[#a1a1aa] mb-1.5 uppercase tracking-wide">
      <span>{label}</span>
      <span className={isWinner ? 'text-blue-400' : 'text-[#a1a1aa]'}>${amount.toFixed(3)} / 1M Input Tokens</span>
    </div>
    <div className="w-full h-3 bg-[#27272a] rounded-full overflow-hidden">
      <div 
        className={`${color} h-full rounded-full transition-all duration-1000 ease-out`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  </div>
);
