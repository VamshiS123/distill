
import React, { useEffect, useState } from 'react';
import { ChevronRight, Play } from 'lucide-react';

interface AnimatedNumberProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ target, suffix = '', prefix = '', duration = 1500, decimals = 1 }) => {
  const [current, setCurrent] = useState(0);
  
  useEffect(() => {
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCurrent(progress * target);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  
  return (
    <span>
      {prefix}{current.toFixed(decimals)}{suffix}
    </span>
  );
};

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden text-white pt-24 pb-32">
      <div className="relative max-w-7xl mx-auto px-4 text-center z-10">
        <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium mb-6 backdrop-blur-sm border border-[#27272a]">
          ✨ Surpassed bear-1 in LongBench v2 Performance
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
          Distill
        </h1>
        <p className="text-xl md:text-2xl text-[#a1a1aa] font-medium mb-12 max-w-3xl mx-auto leading-relaxed">
          Information-Theoretic LLM Input Compression that removes low-entropy noise while preserving deep semantic intent.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-14">
          <HeroMetricCard 
            value={64} 
            suffix="%" 
            label="Token Reduction" 
            icon="⬇"
          />
          <HeroMetricCard 
            value={1.3} 
            suffix="%" 
            prefix="-" 
            label="Accuracy Loss" 
            icon="◎"
          />
          <HeroMetricCard 
            value={2.4} 
            suffix="x" 
            label="LLM Throughput Boost" 
            icon="↗"
          />
        </div>
        
        <p className="text-lg text-[#a1a1aa] mb-10 max-w-2xl mx-auto">
          Built to outperform standard importance-scoring models by identifying the true informational entropy of every token in context.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button className="w-full sm:w-auto px-8 py-4 bg-white text-[#0a0a0a] rounded-xl font-bold shadow-lg shadow-black/20 hover:bg-gray-100 transform hover:-translate-y-0.5 transition flex items-center justify-center gap-2">
            <Play size={18} className="fill-current" />
            Try Demo
          </button>
          <button 
            onClick={() => {
              const element = document.getElementById('methodology');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white/40 text-white rounded-xl font-bold hover:bg-white/10 hover:border-white transition flex items-center justify-center gap-2"
          >
            View Methodology
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

interface HeroMetricCardProps {
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
  icon: string;
}

const HeroMetricCard: React.FC<HeroMetricCardProps> = ({ value, suffix, prefix, label, icon }) => (
  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-[#27272a] shadow-xl group hover:bg-white/15 transition">
    <div className="flex flex-col items-center">
      <span className="text-3xl mb-4 transform group-hover:scale-110 transition">{icon}</span>
      <div className="text-5xl font-bold mb-3 tracking-tighter">
        <AnimatedNumber target={value} suffix={suffix} prefix={prefix} />
      </div>
      <div className="text-[#a1a1aa] font-medium text-sm tracking-wide uppercase">{label}</div>
    </div>
  </div>
);
