
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
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white pt-24 pb-32">
      {/* Decorative Background Patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-blue-400/20 text-blue-100 text-sm font-medium mb-6 backdrop-blur-sm border border-blue-400/30">
          ✨ Surpassed bear-1 in LongBench v2 Performance
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
          Distill
        </h1>
        <p className="text-xl md:text-2xl text-blue-100 font-medium mb-12 max-w-3xl mx-auto leading-relaxed">
          Information-Theoretic LLM Input Compression that removes low-entropy noise while preserving deep semantic intent.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-14">
          <HeroMetricCard 
            value={68.2} 
            suffix="%" 
            label="Token Reduction" 
            icon="📉"
          />
          <HeroMetricCard 
            value={1.3} 
            suffix="%" 
            prefix="+" 
            label="Accuracy Gain" 
            icon="🎯"
          />
          <HeroMetricCard 
            value={2.4} 
            suffix="x" 
            label="Inference Boost" 
            icon="⚡"
          />
        </div>
        
        <p className="text-lg text-blue-200 mb-10 max-w-2xl mx-auto">
          Built to outperform standard importance-scoring models by identifying the true informational entropy of every token in context.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button className="w-full sm:w-auto px-8 py-4 bg-white text-blue-700 rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-50 transform hover:-translate-y-0.5 transition flex items-center justify-center gap-2">
            <Play size={18} className="fill-current" />
            Try Demo
          </button>
          <button className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white/40 text-white rounded-xl font-bold hover:bg-white/10 hover:border-white transition flex items-center justify-center gap-2">
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
  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-xl group hover:bg-white/15 transition">
    <div className="flex flex-col items-center">
      <span className="text-3xl mb-4 transform group-hover:scale-110 transition">{icon}</span>
      <div className="text-5xl font-bold mb-3 tracking-tighter">
        <AnimatedNumber target={value} suffix={suffix} prefix={prefix} />
      </div>
      <div className="text-blue-100 font-medium text-sm tracking-wide uppercase">{label}</div>
    </div>
  </div>
);
