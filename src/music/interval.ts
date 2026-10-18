import type { Accidental, Pitch } from './pitch.ts';
import { LETTERS, LETTER_STEP, pitchToMidi } from './pitch.ts';

export type IntervalQuality = 'P' | 'M' | 'm' | 'A' | 'd';
export type IntervalNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type Direction = 'up' | 'down';

export type Interval = {
  quality: IntervalQuality;
  number: IntervalNumber;
};

export function interval(quality: IntervalQuality, number: IntervalNumber): Interval {
  return { quality, number };
}

const BASE_SEMITONES: Record<IntervalNumber, number> = {
  1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11, 8: 12,
};

const PERFECT_NUMBERS: ReadonlySet<IntervalNumber> = new Set<IntervalNumber>([1, 4, 5, 8]);

export function intervalSemitones(iv: Interval): number {
  const base = BASE_SEMITONES[iv.number];
  if (PERFECT_NUMBERS.has(iv.number)) {
    switch (iv.quality) {
      case 'P': return base;
      case 'A': return base + 1;
      case 'd': return base - 1;
      case 'M':
      case 'm':
        throw new Error(`Perfect interval ${iv.number} cannot have quality ${iv.quality}`);
    }
  } else {
    switch (iv.quality) {
      case 'M': return base;
      case 'm': return base - 1;
      case 'A': return base + 1;
      case 'd': return base - 2;
      case 'P':
        throw new Error(`Non-perfect interval ${iv.number} cannot have quality P`);
    }
  }
}

const DIFF_TO_ACCIDENTAL: Record<number, Accidental> = {
  [-2]: 'bb',
  [-1]: 'b',
  0: 'n',
  1: '#',
  2: '##',
};

export function applyInterval(base: Pitch, iv: Interval, direction: Direction = 'up'): Pitch {
  const sign = direction === 'up' ? 1 : -1;
  const diatonicSteps = (iv.number - 1) * sign;

  const targetStepRaw = LETTER_STEP[base.letter] + diatonicSteps;
  const targetLetter = LETTERS[((targetStepRaw % 7) + 7) % 7];
  const octavesCrossed = Math.floor(targetStepRaw / 7);
  const targetOctave = base.octave + octavesCrossed;

  const expectedMidi = pitchToMidi(base) + intervalSemitones(iv) * sign;
  const naturalMidi = pitchToMidi({ letter: targetLetter, accidental: 'n', octave: targetOctave });
  const diff = expectedMidi - naturalMidi;

  const accidental = DIFF_TO_ACCIDENTAL[diff];
  if (!accidental) {
    throw new Error(`Interval ${iv.quality}${iv.number} ${direction} from ${base.letter}${base.accidental}${base.octave} needs accidental adjustment of ${diff} semitones`);
  }

  return { letter: targetLetter, accidental, octave: targetOctave };
}

const QUALITY_NAME: Record<IntervalQuality, string> = {
  P: 'Perfect',
  M: 'Major',
  m: 'Minor',
  A: 'Augmented',
  d: 'Diminished',
};

const NUMBER_NAME: Record<IntervalNumber, string> = {
  1: 'Unison',
  2: 'Second',
  3: 'Third',
  4: 'Fourth',
  5: 'Fifth',
  6: 'Sixth',
  7: 'Seventh',
  8: 'Octave',
};

export function intervalDisplayName(iv: Interval): string {
  return `${QUALITY_NAME[iv.quality]} ${NUMBER_NAME[iv.number]}`;
}

export const BASIC_SEVEN: readonly Interval[] = [
  { quality: 'M', number: 2 },
  { quality: 'M', number: 3 },
  { quality: 'P', number: 4 },
  { quality: 'P', number: 5 },
  { quality: 'M', number: 6 },
  { quality: 'M', number: 7 },
  { quality: 'P', number: 8 },
];

export const ALL_SIMPLE_INTERVALS: readonly Interval[] = [
  { quality: 'm', number: 2 },
  { quality: 'M', number: 2 },
  { quality: 'm', number: 3 },
  { quality: 'M', number: 3 },
  { quality: 'P', number: 4 },
  { quality: 'A', number: 4 },
  { quality: 'P', number: 5 },
  { quality: 'm', number: 6 },
  { quality: 'M', number: 6 },
  { quality: 'm', number: 7 },
  { quality: 'M', number: 7 },
  { quality: 'P', number: 8 },
];
