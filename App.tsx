
import React, { useEffect } from 'react';
import HeroSection from './components/HeroSection';
import ComparisonTable from './components/ComparisonTable';
import AccuracyPanel from './components/AccuracyPanel';
import CompressionChart from './components/CompressionChart';
import LatencyPanel from './components/LatencyPanel';
import CostPanel from './components/CostPanel';
import ContextSection from './components/ContextSection';
import MethodologySection from './components/MethodologySection';
import ApproachSection from './components/ApproachSection';
import LimitationsSection from './components/LimitationsSection';

export default function App() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    const revealElements = document.querySelectorAll('.scroll-reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-blue-100 selection:text-blue-900">
      <HeroSection />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 lg:space-y-24">
        <div className="scroll-reveal">
          <ComparisonTable />
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="scroll-reveal">
            <AccuracyPanel />
          </div>
          <div className="scroll-reveal">
            <CompressionChart />
          </div>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="scroll-reveal">
            <LatencyPanel />
          </div>
          <div className="scroll-reveal">
            <CostPanel />
          </div>
        </div>
        
        <div className="scroll-reveal">
          <ContextSection />
        </div>
        
        <div className="scroll-reveal">
          <MethodologySection />
        </div>
        
        <div className="scroll-reveal">
          <ApproachSection />
        </div>
        
        <div className="scroll-reveal">
          <LimitationsSection />
        </div>
      </main>
      
      <footer className="bg-gray-900 text-gray-400 py-12 mt-20 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-white font-bold text-xl mb-2">Distill</h2>
          <p className="text-sm mb-6 max-w-md mx-auto">
            Advanced information-theoretic compression for high-performance LLM workflows.
          </p>
          <div className="flex justify-center space-x-6 text-sm">
            <a href="#" className="hover:text-white transition">Documentation</a>
            <a href="#" className="hover:text-white transition">Github</a>
            <a href="#" className="hover:text-white transition">Privacy</a>
          </div>
          <p className="mt-8 text-xs">© 2024 The Token Company Challenge - Distill Project</p>
        </div>
      </footer>
    </div>
  );
}