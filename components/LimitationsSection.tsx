
import React from 'react';
import { AlertTriangle, Lightbulb } from 'lucide-react';

export default function LimitationsSection() {
  return (
    <section className="grid lg:grid-cols-2 gap-8">
      {/* Current Limitations */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-sm border border-[#27272a] p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg border border-yellow-500/30">
            <AlertTriangle size={20} />
          </div>
          <h3 className="text-xl font-bold text-white">Current Limitations</h3>
        </div>
        
        <ul className="space-y-4">
          <LimitItem text="Highly structured code or technical documentation requires higher entropy thresholds (θ < 0.5) to avoid pruning syntax characters." />
          <LimitItem text="Model is currently optimized for Llama-3 and GPT-4 tokenizer structures; performance may vary on models using SentencePiece." />
          <LimitItem text="Multilingual support is currently limited to English, Spanish, and French base corpora." />
        </ul>
      </div>

      {/* Future Work */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-sm border border-[#27272a] p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
            <Lightbulb size={20} />
          </div>
          <h3 className="text-xl font-bold text-white">Future Work</h3>
        </div>
        
        <ul className="space-y-4">
          <LimitItem text="Development of Distill-Visual: Entropy-based image token pruning for multi-modal models." />
          <LimitItem text="Real-time adaptive thresholding: Automatically adjusting θ during the generation stream to prioritize critical tokens." />
          <LimitItem text="Direct KV-cache compression integration for sub-linear memory scaling." />
        </ul>
      </div>
    </section>
  );
}

const LimitItem: React.FC<{ text: string }> = ({ text }) => (
  <li className="flex gap-3 text-sm text-[#a1a1aa] leading-relaxed font-medium">
    <span className="text-blue-400 font-bold">•</span>
    {text}
  </li>
);
