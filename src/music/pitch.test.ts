import { describe, it, expect } from 'vitest';
import { midiToPitch, pitch, pitchDisplayName, pitchEquals, pitchEqualsEnharmonic, pitchToMidi } from './pitch.ts';

describe('pitchToMidi', () => {
  it('middle C (C4) is 60', () => {
    expect(pitchToMidi(pitch('C', 'n', 4))).toBe(60);
  });

  it('A4 (concert pitch) is 69', () => {
    expect(pitchToMidi(pitch('A', 'n', 4))).toBe(69);
  });

  it('C#4 is 61', () => {
    expect(pitchToMidi(pitch('C', '#', 4))).toBe(61);
  });

  it('Db4 is 61 — enharmonic to C#4', () => {
    expect(pitchToMidi(pitch('D', 'b', 4))).toBe(61);
  });

  it('Fb4 is 64 — enharmonic to E4', () => {
    expect(pitchToMidi(pitch('F', 'b', 4))).toBe(64);
  });

  it('B#4 is 72 — enharmonic to C5', () => {
    expect(pitchToMidi(pitch('B', '#', 4))).toBe(72);
  });

  it('crosses octaves correctly: C-1 is 0, G9 is 127', () => {
    expect(pitchToMidi(pitch('C', 'n', -1))).toBe(0);
    expect(pitchToMidi(pitch('G', 'n', 9))).toBe(127);
  });
});

describe('midiToPitch', () => {
  it('60 is C4', () => {
    expect(midiToPitch(60)).toEqual(pitch('C', 'n', 4));
  });

  it('61 is C#4 (prefers sharps)', () => {
    expect(midiToPitch(61)).toEqual(pitch('C', '#', 4));
  });

  it('round-trips every MIDI value', () => {
    for (let m = 0; m <= 127; m++) {
      expect(pitchToMidi(midiToPitch(m))).toBe(m);
    }
  });
});

describe('pitchEquals vs pitchEqualsEnharmonic', () => {
  it('C#4 and Db4 are enharmonic but not equal', () => {
    const cs = pitch('C', '#', 4);
    const db = pitch('D', 'b', 4);
    expect(pitchEquals(cs, db)).toBe(false);
    expect(pitchEqualsEnharmonic(cs, db)).toBe(true);
  });

  it('C4 and C4 are both equal and enharmonic', () => {
    expect(pitchEquals(pitch('C', 'n', 4), pitch('C', 'n', 4))).toBe(true);
    expect(pitchEqualsEnharmonic(pitch('C', 'n', 4), pitch('C', 'n', 4))).toBe(true);
  });
});

describe('pitchDisplayName', () => {
  it('renders accidentals with Unicode symbols', () => {
    expect(pitchDisplayName(pitch('C', 'n', 4))).toBe('C');
    expect(pitchDisplayName(pitch('C', '#', 4))).toBe('C♯');
    expect(pitchDisplayName(pitch('D', 'b', 4))).toBe('D♭');
  });

  it('includes octave when requested', () => {
    expect(pitchDisplayName(pitch('C', 'n', 4), true)).toBe('C4');
    expect(pitchDisplayName(pitch('F', '#', 3), true)).toBe('F♯3');
  });
});
