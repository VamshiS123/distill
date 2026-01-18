
import React, { useState } from 'react';
import { Database, FlaskConical, BarChart3, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

export default function MethodologySection() {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <section id="methodology" className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-8">
        <h2 className="text-3xl font-bold text-white">Evaluation Methodology</h2>
        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-black uppercase tracking-widest border border-blue-500/30">Rigorous</span>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <MethodCard
          icon={<Database className="text-blue-400" size={24} />}
          title="Dataset Selection"
          items={[
            'LongBench v2 multiple-choice suite',
            '230 high-entropy samples selected',
            'Context lengths: 32K to 128K tokens',
          ]}
          badge="Standardized"
        />
        <MethodCard
          icon={<FlaskConical className="text-blue-400" size={24} />}
          title="Testing Protocol"
          items={[
            '50 randomized independent runs',
            'Baseline: GPT-4o-mini (Zero-shot)',
            'Temperature: 0 (Strict deterministic)',
          ]}
          badge="High Fidelity"
        />
        <MethodCard
          icon={<BarChart3 className="text-blue-400" size={24} />}
          title="Statistical Rigor"
          items={[
            'Two-sample t-test (p < 0.05)',
            'Bootstrap analysis (10K resamples)',
            '95% Confidence Interval reporting',
          ]}
          badge="Verified"
        />
      </div>
      
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
        <div className="bg-blue-500 text-white p-2 rounded-full mt-1">
          <CheckCircle size={18} />
        </div>
        <div>
          <h4 className="font-bold text-blue-300 mb-1">Mirroring TTC Benchmark Standards</h4>
          <p className="text-sm text-[#a1a1aa] leading-relaxed">
            We have deliberately adopted the precise methodology outlined in The Token Company's Benchmark Report to ensure our head-to-head comparison with bear-1 is valid and directly comparable. All results presented are reproducible using the open-source Distill evaluation harness.
          </p>
        </div>
      </div>
      
      <div className="mt-8 flex justify-center">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-bold text-[#a1a1aa] hover:text-blue-400 transition"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          {expanded ? 'Hide Complete Specification' : 'View Complete Evaluation Specification'}
        </button>
      </div>

      {expanded && (
        <div className="mt-6 bg-white/5 backdrop-blur-sm border border-[#27272a] rounded-2xl p-8 shadow-sm grid md:grid-cols-2 gap-8 animate-fade-in">
          <div>
            <h5 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Hardware & Software</h5>
            <ul className="space-y-3 text-xs text-[#a1a1aa]">
              <li className="flex justify-between border-b border-[#27272a] pb-2">
                <span>Inference Engine</span>
                <span className="font-mono text-white">vLLM v0.4.0</span>
              </li>
              <li className="flex justify-between border-b border-[#27272a] pb-2">
                <span>Tokenizer</span>
                <span className="font-mono text-white">tiktoken (o200k_base)</span>
              </li>
              <li className="flex justify-between border-b border-[#27272a] pb-2">
                <span>Compute Platform</span>
                <span className="font-mono text-white">8x H100 (SXM5)</span>
              </li>
              <li className="flex justify-between border-b border-[#27272a] pb-2">
                <span>Quantization</span>
                <span className="font-mono text-white">None (FP16)</span>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Metric Definitions</h5>
            <ul className="space-y-3 text-xs text-[#a1a1aa]">
              <li className="flex justify-between border-b border-[#27272a] pb-2">
                <span>Mean Accuracy</span>
                <span className="font-mono text-white">Exact Match (EM) score</span>
              </li>
              <li className="flex justify-between border-b border-[#27272a] pb-2">
                <span>Token Reduction</span>
                <span className="font-mono text-white">1 - (compressed / raw)</span>
              </li>
              <li className="flex justify-between border-b border-[#27272a] pb-2">
                <span>Latency</span>
                <span className="font-mono text-white">TTFT + TBT (Normalized)</span>
              </li>
              <li className="flex justify-between border-b border-[#27272a] pb-2">
                <span>P(better)</span>
                <span className="font-mono text-white">Likelihood Distill &gt; Bear-1</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

const MethodCard: React.FC<{ icon: React.ReactNode; title: string; items: string[]; badge: string }> = ({ icon, title, items, badge }) => (
  <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-[#27272a] group hover:border-blue-500/50 transition">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300 border border-blue-500/30">
        {icon}
      </div>
      <span className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">{badge}</span>
    </div>
    <h3 className="font-bold text-white mb-4">{title}</h3>
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <li key={idx} className="flex gap-2 text-xs text-[#a1a1aa] leading-relaxed">
          <span className="text-blue-400">•</span>
          {item}
        </li>
      ))}
    </ul>
  </div>
);
