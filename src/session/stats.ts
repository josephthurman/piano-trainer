import type { Pitch, PitchClass } from '../music/pitch.ts';
import { pitchClassOf, pitchToMidi } from '../music/pitch.ts';
import type { Interval, IntervalQuality } from '../music/interval.ts';
import type { Chord, ScaleDegree, TriadQuality } from '../music/chord.ts';
import type { StoredAttempt, StoredChordAttempt, StoredIntervalAttempt } from './storage.ts';

export type StatCell = {
  attempts: number;
  correct: number;
};

export function cellAccuracy(c: StatCell): number {
  return c.attempts === 0 ? 0 : c.correct / c.attempts;
}

export function baseKey(p: PitchClass): string {
  return `${p.letter}${p.accidental === 'n' ? '' : p.accidental}`;
}

export function intervalKey(iv: Interval): string {
  return `${iv.quality}${iv.number}`;
}

/** e.g. "Bb:major" */
export function chordKey(c: Chord): string {
  return `${baseKey(c.root)}:${c.quality}`;
}

/** A chord's function in a key, e.g. "F|4" for IV of F major. */
export function chordItemKey(item: { tonic: PitchClass; degree: ScaleDegree }): string {
  return `${baseKey(item.tonic)}|${item.degree}`;
}

function bump(map: Map<string, StatCell>, key: string, correct: boolean): void {
  const cell = map.get(key) ?? { attempts: 0, correct: 0 };
  cell.attempts += 1;
  if (correct) cell.correct += 1;
  map.set(key, cell);
}

export type IntervalAggregates = {
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

export function aggregateIntervals(all: readonly StoredAttempt[]): IntervalAggregates {
  const attempts = all.filter((a): a is StoredIntervalAttempt => a.kind === 'interval');
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

export type ChordAggregates = {
  overall: StatCell;
  byChord: Map<string, StatCell>;
  /** Keyed by chordItemKey. */
  byKeyAndDegree: Map<string, StatCell>;
  seenChords: Chord[];
  seenTonics: PitchClass[];
  seenDegrees: ScaleDegree[];
};

const TRIAD_QUALITY_ORDER: Record<TriadQuality, number> = {
  major: 0, minor: 1, diminished: 2,
};

export function aggregateChords(all: readonly StoredAttempt[]): ChordAggregates {
  const attempts = all.filter((a): a is StoredChordAttempt => a.kind === 'chord');
  const overall: StatCell = { attempts: 0, correct: 0 };
  const byChord = new Map<string, StatCell>();
  const byKeyAndDegree = new Map<string, StatCell>();
  const chordSamples = new Map<string, Chord>();
  const tonicSamples = new Map<string, PitchClass>();
  const degrees = new Set<ScaleDegree>();

  for (const a of attempts) {
    overall.attempts += 1;
    if (a.correct) overall.correct += 1;

    const cKey = chordKey(a.chord);
    bump(byChord, cKey, a.correct);
    chordSamples.set(cKey, a.chord);

    bump(byKeyAndDegree, chordItemKey(a), a.correct);
    tonicSamples.set(baseKey(a.tonic), a.tonic);
    degrees.add(a.degree);
  }

  const seenChords = [...chordSamples.values()].sort((a, b) => {
    const byRoot = pitchClassOf(a.root) - pitchClassOf(b.root);
    return byRoot !== 0 ? byRoot : TRIAD_QUALITY_ORDER[a.quality] - TRIAD_QUALITY_ORDER[b.quality];
  });
  const seenTonics = [...tonicSamples.values()].sort((a, b) => pitchClassOf(a) - pitchClassOf(b));
  const seenDegrees = [...degrees].sort((a, b) => a - b);

  return { overall, byChord, byKeyAndDegree, seenChords, seenTonics, seenDegrees };
}
