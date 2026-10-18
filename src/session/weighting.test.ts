import { describe, expect, it } from 'vitest';
import type { Interval } from '../music/interval.ts';
import type { StoredAttempt } from './storage.ts';
import { intervalKey } from './stats.ts';
import { intervalWeights, pickWeightedInterval } from './weighting.ts';

const M3: Interval = { quality: 'M', number: 3 };
const P5: Interval = { quality: 'P', number: 5 };
const M7: Interval = { quality: 'M', number: 7 };

function attempt(iv: Interval, correct: boolean, timestamp: number): StoredAttempt {
  return {
    base: { letter: 'C', accidental: 'n', octave: 4 },
    interval: iv,
    direction: 'up',
    playedMidi: [60, 64],
    correct,
    timestamp,
  };
}

describe('intervalWeights', () => {
  it('assigns weight 1 to intervals with no history', () => {
    const w = intervalWeights([M3, P5], []);
    expect(w.get('M3')).toBe(1);
    expect(w.get('P5')).toBe(1);
  });

  it('applies floor for intervals with perfect accuracy', () => {
    const attempts = [
      attempt(M3, true, 1),
      attempt(M3, true, 2),
      attempt(M3, true, 3),
    ];
    const w = intervalWeights([M3], attempts, { recentWindow: 20, floor: 0.15 });
    expect(w.get('M3')).toBe(0.15);
  });

  it('weights worse intervals higher than better ones', () => {
    const attempts = [
      attempt(M3, true, 1),
      attempt(M3, true, 2),
      attempt(M3, true, 3),
      attempt(M3, true, 4),
      attempt(P5, false, 5),
      attempt(P5, false, 6),
      attempt(P5, true, 7),
      attempt(P5, false, 8),
    ];
    const w = intervalWeights([M3, P5], attempts);
    expect(w.get('P5')!).toBeGreaterThan(w.get('M3')!);
  });

  it('only considers the recentWindow most recent attempts per interval', () => {
    const attempts: StoredAttempt[] = [];
    for (let i = 0; i < 20; i++) attempts.push(attempt(M3, false, i));
    for (let i = 0; i < 5; i++) attempts.push(attempt(M3, true, 100 + i));
    const w = intervalWeights([M3], attempts, { recentWindow: 5, floor: 0.1 });
    expect(w.get('M3')).toBe(0.1); // last 5 all correct → floor
  });
});

describe('pickWeightedInterval', () => {
  it('respects weight ratios over many samples', () => {
    const weights = new Map<string, number>([
      [intervalKey(M3), 0.1],
      [intervalKey(P5), 0.9],
    ]);
    let picksP5 = 0;
    const n = 10000;
    let seed = 1;
    const rng = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 0; i < n; i++) {
      if (pickWeightedInterval([M3, P5], weights, rng).quality === 'P') picksP5 += 1;
    }
    const ratio = picksP5 / n;
    expect(ratio).toBeGreaterThan(0.85);
    expect(ratio).toBeLessThan(0.95);
  });

  it('still picks intervals missing from the weights map (fallback to 1)', () => {
    const weights = new Map<string, number>();
    const picked = pickWeightedInterval([M7], weights);
    expect(picked).toEqual(M7);
  });
});
