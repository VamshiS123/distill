
import React, { useState, useMemo } from 'react';

// Simple token estimation: roughly 1 token ≈ 4 characters
function estimateTokens(text: string): number {
  if (!text.trim()) return 0;
  // Rough approximation: split by whitespace and count words
  // More accurate would be ~4 chars per token
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  return Math.max(1, Math.round(words.length * 1.3)); // Account for punctuation, etc.
}

// Mock compression function
function mockCompress(text: string, aggressiveness: number): string {
  if (!text.trim()) return '';
  
  const words = text.trim().split(/\s+/);
  const compressionRatio = aggressiveness; // 0.1 = 10% compression, 0.9 = 90% compression
  const targetLength = Math.max(1, Math.floor(words.length * (1 - compressionRatio)));
  
  // Simple mock: remove words based on aggressiveness
  // In reality, this would be based on entropy calculations
  const keepCount = Math.max(1, Math.floor(words.length * (1 - compressionRatio * 0.7)));
  
  // Try to keep important words (longer words, words with capitals, etc.)
  const wordScores = words.map((word, idx) => {
    let score = 0;
    if (word.length > 4) score += 2;
    if (/[A-Z]/.test(word)) score += 1;
    if (/[0-9]/.test(word)) score += 1;
    if (idx === 0 || idx === words.length - 1) score += 1; // Keep first/last
    return { word, score, idx };
  });
  
  // Sort by score and keep top words
  wordScores.sort((a, b) => b.score - a.score);
  const keptIndices = new Set(wordScores.slice(0, keepCount).map(w => w.idx));
  
  // Reconstruct text maintaining order
  const result = words
    .map((word, idx) => keptIndices.has(idx) ? word : null)
    .filter(w => w !== null)
    .join(' ');
  
  return result || text; // Fallback to original if compression removes everything
}

export default function DemoSection() {
  const [inputText, setInputText] = useState('Could you list for me the planets in the solar system, in order from the');
  const [aggressiveness, setAggressiveness] = useState(0.1);
  
  // Calculate output text based on input and aggressiveness
  const outputText = useMemo(() => {
    return mockCompress(inputText, aggressiveness);
  }, [inputText, aggressiveness]);
  
  // Calculate token counts
  const inputTokens = useMemo(() => estimateTokens(inputText), [inputText]);
  const outputTokens = useMemo(() => estimateTokens(outputText), [outputText]);
  
  return (
    <section id="demo-section" className="relative py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-white/8 via-white/5 to-white/3 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 p-10 md:p-12">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4 tracking-tight">
              Try Distill Compression
            </h2>
            <p className="text-lg text-white/70 font-light max-w-2xl mx-auto leading-relaxed">
              See how Distill compresses your text while preserving semantic meaning
            </p>
          </div>
          
          {/* Input and Output Sections */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Input Section */}
            <div className="flex flex-col">
              <label className="text-white/90 font-light text-sm uppercase tracking-wider mb-3">Input</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-white/90 placeholder-white/40 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition font-light text-sm leading-relaxed"
                placeholder="Enter your text here..."
              />
              <div className="mt-3 text-xs text-white/60 font-mono tracking-wide">
                {inputTokens} tokens
              </div>
            </div>
            
            {/* Output Section */}
            <div className="flex flex-col">
              <label className="text-white/90 font-light text-sm uppercase tracking-wider mb-3">Output</label>
              <textarea
                value={outputText}
                readOnly
                className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-white/80 placeholder-white/40 resize-none focus:outline-none font-light text-sm leading-relaxed"
                placeholder="Compressed output will appear here..."
              />
              <div className="mt-3 text-xs text-white/60 font-mono tracking-wide">
                {outputTokens} tokens
              </div>
            </div>
          </div>
          
          {/* Aggressiveness Slider */}
          <div className="space-y-5 mt-10 pt-8 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-white/90 font-light text-base tracking-wide">
                Aggressiveness: <span className="text-blue-400 font-normal ml-1">{aggressiveness.toFixed(1)}</span>
              </label>
            </div>
            
            <div className="relative">
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.1"
                value={aggressiveness}
                onChange={(e) => setAggressiveness(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#27272a] rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((aggressiveness - 0.1) / 0.8) * 100}%, #27272a ${((aggressiveness - 0.1) / 0.8) * 100}%, #27272a 100%)`
                }}
              />
              <style>{`
                .slider::-webkit-slider-thumb {
                  appearance: none;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  background: white;
                  cursor: pointer;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                }
                .slider::-moz-range-thumb {
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  background: white;
                  cursor: pointer;
                  border: none;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                }
              `}</style>
            </div>
            
            <div className="flex justify-between text-xs text-white/50 font-light tracking-wide">
              <span>0.1 (low)</span>
              <span>0.9 (high)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
