import { describe, it, expect } from 'vitest';
import { pitch } from './pitch.ts';
import {
  applyInterval,
  BASIC_SEVEN,
  interval,
  intervalDisplayName,
  intervalSemitones,
} from './interval.ts';

describe('intervalSemitones', () => {
  it('matches the standard intervals', () => {
    expect(intervalSemitones(interval('P', 1))).toBe(0);
    expect(intervalSemitones(interval('m', 2))).toBe(1);
    expect(intervalSemitones(interval('M', 2))).toBe(2);
    expect(intervalSemitones(interval('m', 3))).toBe(3);
    expect(intervalSemitones(interval('M', 3))).toBe(4);
    expect(intervalSemitones(interval('P', 4))).toBe(5);
    expect(intervalSemitones(interval('A', 4))).toBe(6);
    expect(intervalSemitones(interval('P', 5))).toBe(7);
    expect(intervalSemitones(interval('m', 6))).toBe(8);
    expect(intervalSemitones(interval('M', 6))).toBe(9);
    expect(intervalSemitones(interval('m', 7))).toBe(10);
    expect(intervalSemitones(interval('M', 7))).toBe(11);
    expect(intervalSemitones(interval('P', 8))).toBe(12);
  });

  it('rejects invalid quality for perfect intervals', () => {
    expect(() => intervalSemitones(interval('M', 5))).toThrow();
    expect(() => intervalSemitones(interval('P', 3))).toThrow();
  });
});

describe('applyInterval — ascending enharmonic correctness', () => {
  it('M3 above C4 is E4', () => {
    expect(applyInterval(pitch('C', 'n', 4), interval('M', 3))).toEqual(pitch('E', 'n', 4));
  });

  it('M3 above E4 is G#4 (NOT Ab4)', () => {
    expect(applyInterval(pitch('E', 'n', 4), interval('M', 3))).toEqual(pitch('G', '#', 4));
  });

  it('M3 above Db4 is F4 (NOT E#4)', () => {
    expect(applyInterval(pitch('D', 'b', 4), interval('M', 3))).toEqual(pitch('F', 'n', 4));
  });

  it('M3 above C#4 is E#4 (NOT F4) — spelling must match the base', () => {
    expect(applyInterval(pitch('C', '#', 4), interval('M', 3))).toEqual(pitch('E', '#', 4));
  });

  it('P5 above C4 is G4', () => {
    expect(applyInterval(pitch('C', 'n', 4), interval('P', 5))).toEqual(pitch('G', 'n', 4));
  });

  it('P5 above Ab4 is Eb5', () => {
    expect(applyInterval(pitch('A', 'b', 4), interval('P', 5))).toEqual(pitch('E', 'b', 5));
  });

  it('P5 above F#4 is C#5', () => {
    expect(applyInterval(pitch('F', '#', 4), interval('P', 5))).toEqual(pitch('C', '#', 5));
  });

  it('m3 above A4 is C5 (octave crosses)', () => {
    expect(applyInterval(pitch('A', 'n', 4), interval('m', 3))).toEqual(pitch('C', 'n', 5));
  });

  it('M7 above C4 is B4', () => {
    expect(applyInterval(pitch('C', 'n', 4), interval('M', 7))).toEqual(pitch('B', 'n', 4));
  });

  it('M7 above B4 is A#5', () => {
    expect(applyInterval(pitch('B', 'n', 4), interval('M', 7))).toEqual(pitch('A', '#', 5));
  });

  it('P8 above C4 is C5', () => {
    expect(applyInterval(pitch('C', 'n', 4), interval('P', 8))).toEqual(pitch('C', 'n', 5));
  });

  it('P8 above F#3 is F#4', () => {
    expect(applyInterval(pitch('F', '#', 3), interval('P', 8))).toEqual(pitch('F', '#', 4));
  });
});

describe('applyInterval — descending', () => {
  it('P4 below D4 is A3', () => {
    expect(applyInterval(pitch('D', 'n', 4), interval('P', 4), 'down')).toEqual(pitch('A', 'n', 3));
  });

  it('M3 below G4 is Eb4', () => {
    expect(applyInterval(pitch('G', 'n', 4), interval('M', 3), 'down')).toEqual(pitch('E', 'b', 4));
  });

  it('P5 below C4 is F3', () => {
    expect(applyInterval(pitch('C', 'n', 4), interval('P', 5), 'down')).toEqual(pitch('F', 'n', 3));
  });

  it('P8 below C5 is C4', () => {
    expect(applyInterval(pitch('C', 'n', 5), interval('P', 8), 'down')).toEqual(pitch('C', 'n', 4));
  });
});

describe('intervalDisplayName', () => {
  it('formats as "Quality Number"', () => {
    expect(intervalDisplayName(interval('M', 3))).toBe('Major Third');
    expect(intervalDisplayName(interval('P', 5))).toBe('Perfect Fifth');
    expect(intervalDisplayName(interval('m', 2))).toBe('Minor Second');
    expect(intervalDisplayName(interval('P', 8))).toBe('Perfect Octave');
  });
});

describe('BASIC_SEVEN', () => {
  it('has the 7 basic intervals of a major scale', () => {
    expect(BASIC_SEVEN).toHaveLength(7);
    expect(BASIC_SEVEN.map((iv) => intervalDisplayName(iv))).toEqual([
      'Major Second',
      'Major Third',
      'Perfect Fourth',
      'Perfect Fifth',
      'Major Sixth',
      'Major Seventh',
      'Perfect Octave',
    ]);
  });
});
