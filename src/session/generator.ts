import type { Accidental, NoteLetter, Pitch } from '../music/pitch.ts';
import { pitchToMidi } from '../music/pitch.ts';
import type { Interval } from '../music/interval.ts';
import { applyInterval } from '../music/interval.ts';

export type IntervalExercise = {
  id: string;
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
const MAX_TARGET_MIDI = 84; // C6

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function generateIntervalExercise(options: {
  intervals: readonly Interval[];
  direction?: 'up' | 'down';
  rng?: () => number;
}): IntervalExercise {
  const rng = options.rng ?? Math.random;
  const direction = options.direction ?? 'up';

  for (let i = 0; i < 100; i++) {
    const spelling = BASE_SPELLINGS[Math.floor(rng() * BASE_SPELLINGS.length)];
    const octave = 3 + Math.floor(rng() * 2);
    const base: Pitch = { letter: spelling.letter, accidental: spelling.accidental, octave };
    const baseMidi = pitchToMidi(base);
    if (baseMidi < MIN_BASE_MIDI || baseMidi > MAX_BASE_MIDI) continue;

    const interval = options.intervals[Math.floor(rng() * options.intervals.length)];
    const target = applyInterval(base, interval, direction);
    const targetMidi = pitchToMidi(target);
    if (targetMidi < MIN_BASE_MIDI || targetMidi > MAX_TARGET_MIDI) continue;

    return { id: randomId(), base, interval, direction, target };
  }

  const fallbackBase: Pitch = { letter: 'C', accidental: 'n', octave: 4 };
  return {
    id: randomId(),
    base: fallbackBase,
    interval: options.intervals[0],
    direction,
    target: applyInterval(fallbackBase, options.intervals[0], direction),
  };
}

export function generateExercises(
  count: number,
  options: Parameters<typeof generateIntervalExercise>[0],
): IntervalExercise[] {
  return Array.from({ length: count }, () => generateIntervalExercise(options));
}
