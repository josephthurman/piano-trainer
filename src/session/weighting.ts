import type { Interval } from '../music/interval.ts';
import type { ChordItem } from './generator.ts';
import type { StoredAttempt } from './storage.ts';
import { chordItemKey, intervalKey } from './stats.ts';

export type WeightingConfig = {
  recentWindow: number;
  floor: number;
};

export const DEFAULT_WEIGHTING: WeightingConfig = { recentWindow: 20, floor: 0.15 };

export type WeightSample = {
  key: string;
  correct: boolean;
  timestamp: number;
};

/**
 * Weight each key by its recent error rate (1 − accuracy over the last
 * `recentWindow` attempts), floored so mastered items still come up. Unseen keys
 * get weight 1.
 */
export function weightsFromHistory(
  keys: readonly string[],
  samples: readonly WeightSample[],
  config: WeightingConfig = DEFAULT_WEIGHTING,
): Map<string, number> {
  const byKey = new Map<string, WeightSample[]>();
  for (const s of samples) {
    const bucket = byKey.get(s.key) ?? [];
    bucket.push(s);
    byKey.set(s.key, bucket);
  }

  const weights = new Map<string, number>();
  for (const key of keys) {
    const bucket = byKey.get(key) ?? [];
    if (bucket.length === 0) {
      weights.set(key, 1);
      continue;
    }
    const recent = [...bucket]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, config.recentWindow);
    const correct = recent.filter((s) => s.correct).length;
    const accuracy = correct / recent.length;
    weights.set(key, Math.max(1 - accuracy, config.floor));
  }
  return weights;
}

export function pickWeighted<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
  weights: Map<string, number>,
  rng: () => number = Math.random,
): T {
  const totals: number[] = [];
  let sum = 0;
  for (const item of items) {
    sum += weights.get(keyOf(item)) ?? 1;
    totals.push(sum);
  }
  const target = rng() * sum;
  for (let i = 0; i < items.length; i++) {
    if (target < totals[i]) return items[i];
  }
  return items[items.length - 1];
}

export function intervalWeights(
  intervals: readonly Interval[],
  attempts: readonly StoredAttempt[],
  config: WeightingConfig = DEFAULT_WEIGHTING,
): Map<string, number> {
  const samples = attempts.flatMap((a) =>
    a.kind === 'interval'
      ? [{ key: intervalKey(a.interval), correct: a.correct, timestamp: a.timestamp }]
      : [],
  );
  return weightsFromHistory(intervals.map(intervalKey), samples, config);
}

export function pickWeightedInterval(
  intervals: readonly Interval[],
  weights: Map<string, number>,
  rng: () => number = Math.random,
): Interval {
  return pickWeighted(intervals, intervalKey, weights, rng);
}

/** Chords are weighted per (key, degree), matching how they're prompted. */
export function chordItemWeights(
  items: readonly ChordItem[],
  attempts: readonly StoredAttempt[],
  config: WeightingConfig = DEFAULT_WEIGHTING,
): Map<string, number> {
  const samples = attempts.flatMap((a) =>
    a.kind === 'chord'
      ? [{ key: chordItemKey(a), correct: a.correct, timestamp: a.timestamp }]
      : [],
  );
  return weightsFromHistory(items.map(chordItemKey), samples, config);
}
