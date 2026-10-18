import type { Interval } from '../music/interval.ts';
import type { StoredAttempt } from './storage.ts';
import { intervalKey } from './stats.ts';

export type WeightingConfig = {
  recentWindow: number;
  floor: number;
};

export const DEFAULT_WEIGHTING: WeightingConfig = { recentWindow: 20, floor: 0.15 };

export function intervalWeights(
  intervals: readonly Interval[],
  attempts: readonly StoredAttempt[],
  config: WeightingConfig = DEFAULT_WEIGHTING,
): Map<string, number> {
  const byInterval = new Map<string, StoredAttempt[]>();
  for (const a of attempts) {
    const key = intervalKey(a.interval);
    const bucket = byInterval.get(key) ?? [];
    bucket.push(a);
    byInterval.set(key, bucket);
  }

  const weights = new Map<string, number>();
  for (const iv of intervals) {
    const key = intervalKey(iv);
    const bucket = byInterval.get(key) ?? [];
    if (bucket.length === 0) {
      weights.set(key, 1);
      continue;
    }
    const recent = [...bucket]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, config.recentWindow);
    const correct = recent.filter((a) => a.correct).length;
    const accuracy = correct / recent.length;
    weights.set(key, Math.max(1 - accuracy, config.floor));
  }
  return weights;
}

export function pickWeightedInterval(
  intervals: readonly Interval[],
  weights: Map<string, number>,
  rng: () => number = Math.random,
): Interval {
  const totals: number[] = [];
  let sum = 0;
  for (const iv of intervals) {
    sum += weights.get(intervalKey(iv)) ?? 1;
    totals.push(sum);
  }
  const target = rng() * sum;
  for (let i = 0; i < intervals.length; i++) {
    if (target < totals[i]) return intervals[i];
  }
  return intervals[intervals.length - 1];
}
