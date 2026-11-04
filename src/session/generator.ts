import type { Accidental, NoteLetter, Pitch, PitchClass } from '../music/pitch.ts';
import { pitchToMidi } from '../music/pitch.ts';
import type { Interval } from '../music/interval.ts';
import { applyInterval } from '../music/interval.ts';
import type { Chord, ScaleDegree } from '../music/chord.ts';
import { chordEquals, diatonicTriad } from '../music/chord.ts';

export type IntervalExercise = {
  kind: 'interval';
  base: Pitch;
  interval: Interval;
  direction: 'up' | 'down';
  target: Pitch;
};

const BASE_SPELLINGS: ReadonlyArray<{ letter: NoteLetter; accidental: Accidental }> = [
  { letter: 'C', accidental: 'n' },
  { letter: 'C', accidental: '#' },
  { letter: 'D', accidental: 'b' },
  { letter: 'D', accidental: 'n' },
  { letter: 'D', accidental: '#' },
  { letter: 'E', accidental: 'b' },
  { letter: 'E', accidental: 'n' },
  { letter: 'F', accidental: 'n' },
  { letter: 'F', accidental: '#' },
  { letter: 'G', accidental: 'b' },
  { letter: 'G', accidental: 'n' },
  { letter: 'G', accidental: '#' },
  { letter: 'A', accidental: 'b' },
  { letter: 'A', accidental: 'n' },
  { letter: 'A', accidental: '#' },
  { letter: 'B', accidental: 'b' },
  { letter: 'B', accidental: 'n' },
];

const MIN_BASE_MIDI = 48; // C3
const MAX_BASE_MIDI = 71; // B4
const MIN_TARGET_MIDI = 36; // C2 (for descending)
const MAX_TARGET_MIDI = 84; // C6 (for ascending)

export function generateIntervalExercise(options: {
  intervals: readonly Interval[];
  direction?: 'up' | 'down' | 'both';
  rng?: () => number;
  pickInterval?: (intervals: readonly Interval[]) => Interval;
}): IntervalExercise {
  const rng = options.rng ?? Math.random;
  const dirMode = options.direction ?? 'up';
  const pickInterval =
    options.pickInterval ?? ((xs) => xs[Math.floor(rng() * xs.length)]);

  for (let i = 0; i < 100; i++) {
    const spelling = BASE_SPELLINGS[Math.floor(rng() * BASE_SPELLINGS.length)];
    const octave = 3 + Math.floor(rng() * 2);
    const base: Pitch = { letter: spelling.letter, accidental: spelling.accidental, octave };
    const baseMidi = pitchToMidi(base);
    if (baseMidi < MIN_BASE_MIDI || baseMidi > MAX_BASE_MIDI) continue;

    const direction: 'up' | 'down' = dirMode === 'both' ? (rng() < 0.5 ? 'up' : 'down') : dirMode;
    const interval = pickInterval(options.intervals);
    const target = applyInterval(base, interval, direction);
    const targetMidi = pitchToMidi(target);
    if (targetMidi < MIN_TARGET_MIDI || targetMidi > MAX_TARGET_MIDI) continue;

    return { kind: 'interval', base, interval, direction, target };
  }

  const fallbackDirection: 'up' | 'down' = dirMode === 'down' ? 'down' : 'up';
  const fallbackBase: Pitch = { letter: 'C', accidental: 'n', octave: 4 };
  return {
    kind: 'interval',
    base: fallbackBase,
    interval: options.intervals[0],
    direction: fallbackDirection,
    target: applyInterval(fallbackBase, options.intervals[0], fallbackDirection),
  };
}

export function generateExercises(
  count: number,
  options: Parameters<typeof generateIntervalExercise>[0],
): IntervalExercise[] {
  return Array.from({ length: count }, () => generateIntervalExercise(options));
}

/** A chord to play, framed by its function in a major key (e.g. IV in F major = B♭ major). */
export type ChordExercise = {
  kind: 'chord';
  tonic: PitchClass;
  degree: ScaleDegree;
  chord: Chord;
};

export type Exercise = IntervalExercise | ChordExercise;

export type ChordItem = {
  tonic: PitchClass;
  degree: ScaleDegree;
};

/** Every (key, degree) combination, e.g. 3 keys × [I, IV, V] = 9 items. */
export function chordItems(
  tonics: readonly PitchClass[],
  degrees: readonly ScaleDegree[],
): ChordItem[] {
  return tonics.flatMap((tonic) => degrees.map((degree) => ({ tonic, degree })));
}

function toChordExercise(item: ChordItem): ChordExercise {
  return { kind: 'chord', ...item, chord: diatonicTriad(item.tonic, item.degree) };
}

export function generateChordExercises(
  count: number,
  options: {
    items: readonly ChordItem[];
    rng?: () => number;
    pickItem?: (items: readonly ChordItem[]) => ChordItem;
  },
): ChordExercise[] {
  const rng = options.rng ?? Math.random;
  const pickItem = options.pickItem ?? ((xs) => xs[Math.floor(rng() * xs.length)]);

  const exercises: ChordExercise[] = [];
  for (let i = 0; i < count; i++) {
    const previous = exercises[exercises.length - 1];
    let next = toChordExercise(pickItem(options.items));
    // The same chord shows up in several keys (C major is I of C, IV of G, V of F),
    // so re-draw a few times to avoid asking for the same chord back to back.
    for (let tries = 0; previous && chordEquals(next.chord, previous.chord) && tries < 10; tries++) {
      next = toChordExercise(pickItem(options.items));
    }
    exercises.push(next);
  }
  return exercises;
}
