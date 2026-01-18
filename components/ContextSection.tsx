
import React from 'react';
import { Maximize, Search } from 'lucide-react';

export default function ContextSection() {
  return (
    <section>
      <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
        Context Utilization & Retrieval
      </h2>
      
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Multiplier Visual */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-sm border border-[#27272a] p-8 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-6">
            <Maximize className="text-blue-400" size={24} />
            <h3 className="text-xl font-bold text-white">Effective Context Multiplier</h3>
          </div>
          
          <div className="relative h-24 w-full bg-[#27272a] rounded-xl mb-8 flex items-center px-4 overflow-hidden border border-[#27272a]">
            {/* Base Context */}
            <div className="h-10 bg-white/10 rounded-lg flex items-center justify-center text-[10px] font-bold text-[#a1a1aa] w-1/4 z-10 shadow-sm border border-[#27272a]">
              128K Native
            </div>
            {/* Expanded Context */}
            <div className="absolute inset-y-0 left-0 bg-blue-500/20 border-r-2 border-blue-500 border-dashed flex items-center justify-end pr-4 w-[75%]">
              <span className="text-blue-400 font-black text-xl">~400K Effective</span>
            </div>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#27272a] opacity-50" />
          </div>
          
          <p className="text-sm text-[#a1a1aa] leading-relaxed italic">
            "By pruning 68% of redundant input tokens, models with a 128K context window can effectively digest documents that previously required a 400K window, with zero retraining required."
          </p>
        </div>

        {/* Needle in Haystack Table */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-sm border border-[#27272a] p-8">
          <div className="flex items-center gap-3 mb-6">
            <Search className="text-blue-400" size={24} />
            <h3 className="text-xl font-bold text-white">Needle-in-Haystack Retrieval</h3>
          </div>
          
          <div className="overflow-hidden border border-[#27272a] rounded-xl">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-4 py-3 text-left font-bold text-[#a1a1aa] uppercase">Context Depth</th>
                  <th className="px-4 py-3 text-center font-bold text-[#a1a1aa] uppercase">Baseline</th>
                  <th className="px-4 py-3 text-center font-bold text-blue-400 uppercase">Distill (0.9)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                <NeedleRow depth="Top 10%" baseline={98} distill={99} />
                <NeedleRow depth="Middle 50%" baseline={92} distill={94} />
                <NeedleRow depth="Bottom 10%" baseline={89} distill={92} />
                <NeedleRow depth="Avg (All)" baseline={93} distill={95} />
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[10px] text-[#a1a1aa] font-medium text-center">
            Retrieval accuracy (%) tested across 1,000 document permutations at 100K context length.
          </p>
        </div>
      </div>
      
      {/* Real-World Use Case Card */}
      <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-xl shadow-blue-900/10 border border-blue-500/30">
        <h3 className="text-xl font-bold mb-4">Real-World Application: Enterprise Document QA</h3>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              We tested Distill on 300-page case files formatted as{' '}
              <a 
                href="https://www.ca5.uscourts.gov/documents/SampleBriefs.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-200 underline decoration-blue-400/50 hover:decoration-blue-300 transition-colors"
              >
                Fifth Circuit appellate briefs
              </a>
              . Previously, prompts had to be chunked across multiple calls, losing global coherence. With Distill, entire files were compressed to fit within a single 128K context window.
            </p>
            <div className="flex gap-4">
              <div className="bg-white/10 rounded-lg p-3 text-center flex-1 border border-white/10">
                <div className="text-xl font-black">68%</div>
                <div className="text-[10px] font-bold uppercase text-blue-200">Cost Reduced</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center flex-1 border border-white/10">
                <div className="text-xl font-black">4x</div>
                <div className="text-[10px] font-bold uppercase text-blue-200">Throughput</div>
              </div>
            </div>
          </div>
          <div className="bg-black/20 rounded-xl p-6 border border-white/10 backdrop-blur-sm">
            <div className="font-mono text-xs space-y-2 opacity-80">
              <div className="text-blue-300"># compression_stats.log</div>
              <div>[INPUT] Original: 252,894 tokens</div>
              <div>[PROCESS] Entropy Estimator: 42ms</div>
              <div className="text-green-300">[OUTPUT] Compressed: 80,926 tokens</div>
              <div>[RESULT] Reduction: 68.0% | Semantic Drift: &lt;0.1%</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const NeedleRow: React.FC<{ depth: string; baseline: number; distill: number }> = ({ depth, baseline, distill }) => (
  <tr>
    <td className="px-4 py-3 font-semibold text-white">{depth}</td>
    <td className="px-4 py-3 text-center text-[#a1a1aa] font-medium">{baseline}%</td>
    <td className="px-4 py-3 text-center">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 text-green-400 rounded-md font-bold border border-green-500/30">
        {distill}%
        <span className="text-[8px] text-green-300 bg-green-500/30 px-1 rounded">+{distill - baseline}</span>
      </span>
    </td>
  </tr>
);
