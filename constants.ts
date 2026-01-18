
import { MetricRow, AccuracyResult, LatencyDataPoint } from './types';

export const COMPARISON_DATA: MetricRow[] = [
  { metric: 'Token Reduction', bear1: '66.1%', distill: '68%', winner: 'distill', delta: '+1.9%' },
  { metric: 'Accuracy Δ', bear1: '+1.1%', distill: '-1.2%', winner: 'bear1', delta: '-2.3%' },
  { metric: 'P(better)', bear1: '100%', distill: '100%', winner: 'tie', delta: '' },
  { metric: 'Latency', bear1: '2.2s', distill: '2.11s', winner: 'distill', delta: '1.04x faster' },
  { metric: 'Model Size', bear1: 'Unknown', distill: '7B params', winner: 'neutral', delta: '' },
];

export const RESULTS_DATA: AccuracyResult[] = [
  { config: 'baseline', mean: 28.2, stdDev: 0.6, delta: null, significant: null },
  { config: '0.3', mean: 29.1, stdDev: 0.8, delta: '+0.9%', significant: true },
  { config: '0.5', mean: 29.3, stdDev: 0.7, delta: '+1.1%', significant: true },
  { config: '0.7', mean: 29.2, stdDev: 0.9, delta: '+1.0%', significant: true },
  { config: '0.9', mean: 29.5, stdDev: 0.8, delta: '+1.3%', significant: true },
  { config: '0.95', mean: 27.9, stdDev: 0.7, delta: '-0.3%', significant: false },
];

export const DISTILL_SCATTER = [
  { compression: 15, accuracy: 0.4, config: '0.2' },
  { compression: 28, accuracy: 0.9, config: '0.3' },
  { compression: 38, accuracy: 1.1, config: '0.5' },
  { compression: 52, accuracy: 1.0, config: '0.7' },
  { compression: 68, accuracy: 1.3, config: '0.9' },
  { compression: 78, accuracy: -0.3, config: '0.95' },
];

export const BEAR1_SCATTER = [
  { compression: 10.3, accuracy: 0.2 },
  { compression: 15.5, accuracy: -0.5 },
  { compression: 23.4, accuracy: 1.0 },
  { compression: 31.4, accuracy: 0.7 },
  { compression: 42.4, accuracy: -0.4 },
  { compression: 52.4, accuracy: 0.8 },
  { compression: 66.1, accuracy: 1.1 },
  { compression: 77.4, accuracy: -0.5 },
];

export const LATENCY_DATA: LatencyDataPoint[] = [
  { name: 'Baseline', compression: 0, llm: 12.06, total: 12.06 },
  { name: 'bear-1', compression: 0.3, llm: 2.2, total: 2.5 },
  { name: 'Distill', compression: 5.5, llm: 2.11, total: 7.61 },
];

export const SCALING_DATA = [
  { tokens: '4K', baseline: 2.3, distill: 2.8 },
  { tokens: '16K', baseline: 6.0, distill: 4.2 },
  { tokens: '32K', baseline: 12.06, distill: 7.61 },
  { tokens: '64K', baseline: 24.4, distill: 13.5 },
  { tokens: '100K', baseline: 40.8, distill: 21.4 },
];

export const HISTOGRAM_DATA = [
  { range: '-0.5%', frequency: 20 },
  { range: '0%', frequency: 150 },
  { range: '0.5%', frequency: 800 },
  { range: '1.0%', frequency: 2100 },
  { range: '1.5%', frequency: 3200 },
  { range: '2.0%', frequency: 1800 },
  { range: '2.5%', frequency: 400 },
];
