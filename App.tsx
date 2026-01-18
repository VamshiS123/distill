
import React, { useEffect, useRef, useState } from 'react';
import HeroSection from './components/HeroSection';
import DemoSection from './components/DemoSection';
import ComparisonTable from './components/ComparisonTable';
import AccuracyPanel from './components/AccuracyPanel';
import LatencyPanel from './components/LatencyPanel';
import CostPanel from './components/CostPanel';
import ContextSection from './components/ContextSection';
import MethodologySection from './components/MethodologySection';
import ApproachSection from './components/ApproachSection';
import LimitationsSection from './components/LimitationsSection';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showDemo, setShowDemo] = useState(false);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();

    type Particle = {
      x: number;
      y: number;
      speed: number;
      opacity: number;
      fadeDelay: number;
      fadeStart: number;
      fadingOut: boolean;
    };

    let particles: Particle[] = [];
    let raf = 0;

    const count = () => Math.floor((canvas.width * canvas.height) / 7000);

    const make = (): Particle => {
      const fadeDelay = Math.random() * 600 + 100;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() / 5 + 0.1,
        opacity: 0.7,
        fadeDelay,
        fadeStart: Date.now() + fadeDelay,
        fadingOut: false,
      };
    };

    const reset = (p: Particle) => {
      p.x = Math.random() * canvas.width;
      p.y = Math.random() * canvas.height;
      p.speed = Math.random() / 5 + 0.1;
      p.opacity = 0.7;
      p.fadeDelay = Math.random() * 600 + 100;
      p.fadeStart = Date.now() + p.fadeDelay;
      p.fadingOut = false;
    };

    const init = () => {
      particles = [];
      for (let i = 0; i < count(); i++) particles.push(make());
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < 0) reset(p);
        if (!p.fadingOut && Date.now() > p.fadeStart) p.fadingOut = true;
        if (p.fadingOut) {
          p.opacity -= 0.008;
          if (p.opacity <= 0) reset(p);
        }
        ctx.fillStyle = `rgba(250, 250, 250, ${p.opacity})`;
        ctx.fillRect(p.x, p.y, 0.6, Math.random() * 2 + 1);
      });
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      setSize();
      init();
    };

    window.addEventListener("resize", onResize);
    init();
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500/30 selection:text-white relative">
      <style>{`
        .app-grid-line {
          position: fixed;
          background: #27272a;
          opacity: 0.75;
          will-change: transform, opacity;
          z-index: 0;
        }
        
        .app-hline {
          height: 1px;
          left: 0;
          right: 0;
          transform: scaleX(0);
          transform-origin: 50% 50%;
          animation: drawX 800ms cubic-bezier(.22,.61,.36,1) forwards;
        }
        .app-hline:nth-child(1) { top: 20%; animation-delay: 150ms; }
        .app-hline:nth-child(2) { top: 50%; animation-delay: 280ms; }
        .app-hline:nth-child(3) { top: 80%; animation-delay: 410ms; }
        
        .app-vline {
          width: 1px;
          top: 0;
          bottom: 0;
          transform: scaleY(0);
          transform-origin: 50% 0%;
          animation: drawY 900ms cubic-bezier(.22,.61,.36,1) forwards;
        }
        .app-vline:nth-child(4) { left: 20%; animation-delay: 520ms; }
        .app-vline:nth-child(5) { left: 50%; animation-delay: 640ms; }
        .app-vline:nth-child(6) { left: 80%; animation-delay: 760ms; }
        
        .app-grid-line::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(250,250,250,.25), transparent);
          opacity: 0;
          animation: shimmer 900ms ease-out forwards;
        }
        .app-hline:nth-child(1)::after { animation-delay: 150ms; }
        .app-hline:nth-child(2)::after { animation-delay: 280ms; }
        .app-hline:nth-child(3)::after { animation-delay: 410ms; }
        .app-vline:nth-child(4)::after { animation-delay: 520ms; }
        .app-vline:nth-child(5)::after { animation-delay: 640ms; }
        .app-vline:nth-child(6)::after { animation-delay: 760ms; }
        
        @keyframes drawX {
          0% { transform: scaleX(0); opacity: 0; }
          60% { opacity: .9; }
          100% { transform: scaleX(1); opacity: .75; }
        }
        @keyframes drawY {
          0% { transform: scaleY(0); opacity: 0; }
          60% { opacity: .9; }
          100% { transform: scaleY(1); opacity: .75; }
        }
        @keyframes shimmer {
          0% { opacity: .0; }
          30% { opacity: .25; }
          100% { opacity: 0; }
        }
        
        .app-particle-canvas {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          mix-blend-mode: screen;
          opacity: .6;
          z-index: 0;
        }
      `}</style>

      {/* Particle Canvas - Fixed Background */}
      <canvas ref={canvasRef} className="app-particle-canvas" />

      {/* Animated Grid Lines - Fixed Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="app-grid-line app-hline" />
        <div className="app-grid-line app-hline" />
        <div className="app-grid-line app-hline" />
        <div className="app-grid-line app-vline" />
        <div className="app-grid-line app-vline" />
        <div className="app-grid-line app-vline" />
      </div>

      <div className="relative z-10">
        <HeroSection onTryDemo={() => setShowDemo(true)} />
        {showDemo && <DemoSection />}
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 lg:space-y-24">
          <div className="scroll-reveal">
            <ComparisonTable />
          </div>
          
          <div className="scroll-reveal">
            <AccuracyPanel />
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
        
        <footer className="bg-[#0a0a0a]/80 backdrop-blur-sm text-[#a1a1aa] py-12 mt-20 border-t border-[#27272a] relative z-10">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-white font-bold text-xl mb-2">Distill</h2>
            <p className="text-sm mb-6 whitespace-nowrap">
              Advanced information-theoretic compression for high-performance LLM workflows.
            </p>
            <div className="flex justify-center mb-6">
              <a href="#" className="text-sm hover:text-white transition">Github</a>
            </div>
            <p className="mt-8 text-xs">© 2026 The Token Company Challenge - Distill Project</p>
          </div>
        </footer>
      </div>
    </div>
  );
}