
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Code2, Cpu, Zap, Share2 } from 'lucide-react';

export default function ApproachSection() {
  const [showCode, setShowCode] = useState(false);
  
  return (
    <section className="bg-white/5 backdrop-blur-sm rounded-3xl shadow-sm border border-[#27272a] overflow-hidden">
      <div className="p-10 border-b border-[#27272a] bg-white/5">
        <h2 className="text-3xl font-bold text-white mb-4">The Information-Theoretic Approach</h2>
        <p className="text-lg text-[#a1a1aa] max-w-4xl leading-relaxed">
          While competitors like bear-1 focus on <em>importance</em> weighting (identifying which tokens "seem" useful to the model), Distill focuses on <strong>information density</strong>. We calculate the conditional entropy of every token given its context window, identifying redundant signals that carry zero net-new information.
        </p>
      </div>
      
      <div className="p-10">
        {/* Architecture Flow */}
        <div className="mb-16">
          <h3 className="text-sm font-black text-[#a1a1aa] uppercase tracking-widest mb-8 text-center">Inference Architecture</h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <ArchBlock icon={<Code2 />} title="Input" sub="Raw Sequence" />
            <ArchArrow />
            <ArchBlock icon={<Cpu />} title="Entropy Estimator" sub="12M Transformer" highlight />
            <ArchArrow />
            <ArchBlock icon={<Zap />} title="Token Scorer" sub="H(t | Context)" />
            <ArchArrow />
            <ArchBlock icon={<Share2 />} title="Output" sub="Dense Prompt" success />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <InnovationCard 
            title="Entropy-Based Selection" 
            desc="We compute the Shannon entropy of each token. Tokens that are highly predictable based on the preceding sequence are pruned first, as they contribute the least amount of surprise to the model's latent state."
          />
          <InnovationCard 
            title="Contextual Persistence" 
            desc="Unlike static pruning, Distill maintains 'Anchor Tokens'—low-probability, high-entropy tokens that serve as semantic pivots, ensuring the compressed prompt remains logically coherent for the target LLM."
          />
          <InnovationCard 
            title="Edge-Ready Model" 
            desc="The Distill scoring engine is a ultra-lightweight 12M parameter transformer trained on millions of entropy patterns. It adds less than 50ms of overhead to the pre-fill stage."
          />
        </div>

        <button 
          onClick={() => setShowCode(!showCode)}
          className="w-full py-4 bg-white/10 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white/15 transition shadow-lg border border-[#27272a]"
        >
          {showCode ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          {showCode ? 'Close Technical Implementation' : 'View Code Implementation (PyTorch)'}
        </button>

        {showCode && (
          <div className="mt-6 bg-[#0D1117] rounded-2xl p-8 overflow-x-auto border border-[#27272a] animate-fade-in shadow-2xl">
            <pre className="text-[13px] leading-relaxed">
              <code className="text-blue-300">import</code> <code className="text-white">torch</code>{`
`}
              <code className="text-blue-300">from</code> <code className="text-white">distill.core</code> <code className="text-blue-300">import</code> <code className="text-white">EntropyModel, Pruner</code>{`

`}
              <code className="text-gray-400"># 1. Initialize our high-speed entropy estimator</code>{`
`}
              <code className="text-white">model = EntropyModel.from_pretrained(</code><code className="text-orange-300">"distill-12m-v2"</code><code className="text-white">)</code>{`

`}
              <code className="text-blue-300">def</code> <code className="text-green-300">distill_compress</code><code className="text-white">(input_ids, threshold=</code><code className="text-orange-300">0.9</code><code className="text-white">):</code>{`
    `}
              <code className="text-gray-400"># 2. Estimate conditional entropy H(x_i | x_prev)</code>{`
    `}
              <code className="text-white">logits = model(input_ids).logits
    probs = torch.softmax(logits, dim=-1)
    entropies = -torch.sum(probs * torch.log(probs + </code><code className="text-orange-300">1e-9</code><code className="text-white">), dim=-</code><code className="text-orange-300">1</code><code className="text-white">)

    </code><code className="text-gray-400"># 3. Apply adaptive pruning based on information density</code>{`
    `}
              <code className="text-white">keep_mask = Pruner.entropy_threshold(entropies, threshold)
    
    </code><code className="text-blue-300">return</code> <code className="text-white">input_ids[keep_mask]</code>{`

`}
              <code className="text-gray-400"># Usage on 100K token document</code>{`
`}
              <code className="text-white">compressed_ids = distill_compress(doc_tokens, threshold=</code><code className="text-orange-300">0.9</code><code className="text-white">)</code>{`
`}
              <code className="text-blue-300">print</code><code className="text-white">(</code><code className="text-orange-300">f"Compressed by </code><code className="text-white">{`{len(doc_tokens) / len(compressed_ids):.2f}`}</code><code className="text-orange-300">x"</code><code className="text-white">)</code>
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}

const ArchBlock: React.FC<{ icon: React.ReactNode; title: string; sub: string; highlight?: boolean; success?: boolean }> = ({ icon, title, sub, highlight, success }) => (
  <div className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-300 w-48 text-center shadow-sm ${
    highlight ? 'bg-blue-500 border-blue-500 text-white shadow-blue-500/20' : 
    success ? 'bg-green-500/20 border-green-500/50 text-green-300' : 
    'bg-white/5 border-[#27272a] text-white'
  }`}>
    <div className={`mb-3 p-2 rounded-lg ${highlight ? 'bg-white/10' : 'bg-white/5'}`}>{icon}</div>
    <div className="font-extrabold text-sm mb-1">{title}</div>
    <div className={`text-[10px] font-bold uppercase tracking-widest ${highlight ? 'text-blue-100' : 'text-[#a1a1aa]'}`}>{sub}</div>
  </div>
);

const ArchArrow = () => (
  <div className="hidden md:block text-[#a1a1aa]">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  </div>
);

const InnovationCard: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
  <div className="p-6 bg-white/5 rounded-2xl border border-[#27272a] group hover:bg-white/10 hover:shadow-xl transition-all duration-300">
    <h4 className="font-extrabold text-white mb-4 border-l-4 border-blue-500 pl-3">{title}</h4>
    <p className="text-sm text-[#a1a1aa] leading-relaxed font-medium">
      {desc}
    </p>
  </div>
);
