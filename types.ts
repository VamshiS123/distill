
export interface MetricRow {
    metric: string;
    bear1: string;
    distill: string;
    winner: 'distill' | 'bear1' | 'tie' | 'neutral';
    delta?: string;
  }
  
  export interface AccuracyResult {
    config: string;
    mean: number;
    stdDev: number;
    delta: string | null;
    significant: boolean | null;
  }
  
  export interface ChartDataPoint {
    compression: number;
    accuracy: number;
    config?: string;
  }
  
  export interface LatencyDataPoint {
    name: string;
    compression: number;
    llm: number;
    total: number;
  }
  