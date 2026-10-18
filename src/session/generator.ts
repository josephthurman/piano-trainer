import type { Accidental, NoteLetter, Pitch } from '../music/pitch.ts';
import { pitchToMidi } from '../music/pitch.ts';
import type { Interval } from '../music/interval.ts';
import { applyInterval } from '../music/interval.ts';

export type IntervalExercise = {
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

    return { base, interval, direction, target };
  }

  const fallbackDirection: 'up' | 'down' = dirMode === 'down' ? 'down' : 'up';
  const fallbackBase: Pitch = { letter: 'C', accidental: 'n', octave: 4 };
  return {
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
