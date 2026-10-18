import type { Pitch } from '../music/pitch.ts';
import { pitchToMidi } from '../music/pitch.ts';
import type { Interval, IntervalQuality } from '../music/interval.ts';
import type { StoredAttempt } from './storage.ts';

export type StatCell = {
  attempts: number;
  correct: number;
};

export function cellAccuracy(c: StatCell): number {
  return c.attempts === 0 ? 0 : c.correct / c.attempts;
}

export function baseKey(p: Pitch): string {
  return `${p.letter}${p.accidental === 'n' ? '' : p.accidental}`;
}

export function intervalKey(iv: Interval): string {
  return `${iv.quality}${iv.number}`;
}

function bump(map: Map<string, StatCell>, key: string, correct: boolean): void {
  const cell = map.get(key) ?? { attempts: 0, correct: 0 };
  cell.attempts += 1;
  if (correct) cell.correct += 1;
  map.set(key, cell);
}

export type Aggregates = {
  overall: StatCell;
  byInterval: Map<string, StatCell>;
  byBaseAndInterval: Map<string, StatCell>;
  seenIntervals: Interval[];
  seenBases: Pitch[];
};

const INTERVAL_QUALITY_ORDER: Record<IntervalQuality, number> = {
  d: 0, m: 1, P: 2, M: 3, A: 4,
};

function pitchClassMidi(p: Pitch): number {
  return pitchToMidi({ ...p, octave: 0 });
}

export function aggregate(attempts: StoredAttempt[]): Aggregates {
  const overall: StatCell = { attempts: 0, correct: 0 };
  const byInterval = new Map<string, StatCell>();
  const byBaseAndInterval = new Map<string, StatCell>();
  const intervalSamples = new Map<string, Interval>();
  const baseSamples = new Map<string, Pitch>();

  for (const a of attempts) {
    overall.attempts += 1;
    if (a.correct) overall.correct += 1;

    const iKey = intervalKey(a.interval);
    bump(byInterval, iKey, a.correct);
    intervalSamples.set(iKey, a.interval);

    const bKey = baseKey(a.base);
    bump(byBaseAndInterval, `${bKey}|${iKey}`, a.correct);
    if (!baseSamples.has(bKey)) {
      baseSamples.set(bKey, { ...a.base, octave: 4 });
    }
  }

  const seenIntervals = [...intervalSamples.values()].sort((a, b) => {
    if (a.number !== b.number) return a.number - b.number;
    return INTERVAL_QUALITY_ORDER[a.quality] - INTERVAL_QUALITY_ORDER[b.quality];
  });

  const seenBases = [...baseSamples.values()].sort(
    (a, b) => pitchClassMidi(a) - pitchClassMidi(b),
  );

  return { overall, byInterval, byBaseAndInterval, seenIntervals, seenBases };
}
