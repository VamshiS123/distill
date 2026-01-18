
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

// Simple token estimation as fallback
function estimateTokens(text: string): number {
  if (!text.trim()) return 0;
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  return Math.max(1, Math.round(words.length * 1.3));
}

export default function DemoSection() {
  const [inputText, setInputText] = useState('Could you list for me the planets in the solar system, in order from the');
  const [aggressiveness, setAggressiveness] = useState(0.1);
  const [outputText, setOutputText] = useState('');
  const [inputTokens, setInputTokens] = useState(0);
  const [outputTokens, setOutputTokens] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompress = useCallback(async (text: string, agg: number) => {
    if (!text.trim()) {
      setOutputText('');
      setInputTokens(0);
      setOutputTokens(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8001/compress_prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: text,
          rate: 1 - agg,
          use_token_level_filter: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      setOutputText(data.compressed_prompt || '');
      setInputTokens(data.origin_tokens || estimateTokens(text));
      setOutputTokens(data.compressed_tokens || estimateTokens(data.compressed_prompt || ''));
    } catch (err) {
      console.error('Compression error:', err);
      setError('Failed to connect to compression API. Make sure the server is running at localhost:8001');
      // Fallback to a simple visual indicator of failure or keep previous output
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      handleCompress(inputText, aggressiveness);
    }, 600);
    
    return () => clearTimeout(timer);
  }, [inputText, aggressiveness, handleCompress]);

  return (
    <section id="demo-section" className="relative py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-white/8 via-white/5 to-white/3 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 p-10 md:p-12">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight">
                Try Distill Compression
              </h2>
              {isLoading && <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />}
            </div>
            <p className="text-lg text-white/70 font-light max-w-2xl mx-auto leading-relaxed">
              See how Distill compresses your text while preserving semantic meaning
            </p>
          </div>
          
          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
          
          {/* Input and Output Sections */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Input Section */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <label className="text-white/90 font-light text-sm uppercase tracking-wider">Input</label>
                <div className="text-xs text-white/60 font-mono tracking-wide">
                  {inputTokens || estimateTokens(inputText)} tokens
                </div>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-64 bg-black/40 border border-white/10 rounded-xl p-6 text-white/90 placeholder-white/40 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition font-light text-sm leading-relaxed"
                placeholder="Enter your text here..."
              />
            </div>
            
            {/* Output Section */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <label className="text-white/90 font-light text-sm uppercase tracking-wider">Output</label>
                <div className="text-xs text-white/60 font-mono tracking-wide">
                  {outputTokens} tokens
                </div>
              </div>
              <div className="relative group">
                <textarea
                  value={outputText}
                  readOnly
                  className={`w-full h-64 bg-black/40 border border-white/10 rounded-xl p-6 text-white/80 placeholder-white/40 resize-none focus:outline-none font-light text-sm leading-relaxed transition-opacity ${isLoading ? 'opacity-50' : 'opacity-100'}`}
                  placeholder={isLoading ? "Compressing..." : "Compressed output will appear here..."}
                />
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                      <span className="text-xs text-blue-400 font-medium">DISTILLING...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Aggressiveness Slider */}
          <div className="space-y-5 mt-10 pt-8 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-white/90 font-light text-base tracking-wide">
                Aggressiveness: <span className="text-blue-400 font-normal ml-1">{aggressiveness.toFixed(1)}</span>
              </label>
              <div className="text-xs text-white/40 italic">
                Higher values remove more low-entropy tokens
              </div>
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
                  border: 2px solid #3B82F6;
                }
                .slider::-moz-range-thumb {
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  background: white;
                  cursor: pointer;
                  border: 2px solid #3B82F6;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                }
              `}</style>
            </div>
            
            <div className="flex justify-between text-xs text-white/50 font-light tracking-wide">
              <div className="flex flex-col items-start gap-1">
                <span>0.1 (low)</span>
                <span className="text-[10px] opacity-70">Maximum Retention</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span>0.9 (high)</span>
                <span className="text-[10px] opacity-70">Maximum Compression</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
