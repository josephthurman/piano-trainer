import { describe, expect, it } from 'vitest';
import type { PitchClass } from './pitch.ts';
import { pitch, pitchDisplayName } from './pitch.ts';
import type { Chord } from './chord.ts';
import {
  chordDisplayName,
  chordTones,
  chordVoicingNear,
  diatonicTriad,
  evaluateChord,
  isChordAttemptReady,
  romanNumeral,
  spellPlayedNote,
} from './chord.ts';

const pc = (letter: PitchClass['letter'], accidental: PitchClass['accidental'] = 'n'): PitchClass => ({
  letter,
  accidental,
});

const C_MAJOR: Chord = { root: pc('C'), quality: 'major' };
const B_FLAT_MAJOR: Chord = { root: pc('B', 'b'), quality: 'major' };

const names = (chord: Chord, octave?: number) =>
  chordTones(chord, octave).map((p) => pitchDisplayName(p, true));

describe('chordTones', () => {
  it('spells major triads from the root', () => {
    expect(names(C_MAJOR)).toEqual(['C4', 'E4', 'G4']);
    expect(names({ root: pc('F'), quality: 'major' })).toEqual(['F4', 'A4', 'C5']);
    expect(names({ root: pc('D'), quality: 'major' })).toEqual(['D4', 'F♯4', 'A4']);
  });

  it('uses flats for B♭ major, not A♯', () => {
    expect(names(B_FLAT_MAJOR, 3)).toEqual(['B♭3', 'D4', 'F4']);
  });

  it('spells minor and diminished triads', () => {
    expect(names({ root: pc('D'), quality: 'minor' })).toEqual(['D4', 'F4', 'A4']);
    expect(names({ root: pc('B'), quality: 'diminished' })).toEqual(['B4', 'D5', 'F5']);
  });
});

describe('diatonicTriad (major keys)', () => {
  const name = (tonic: PitchClass, degree: 1 | 2 | 4 | 5 | 7) =>
    chordDisplayName(diatonicTriad(tonic, degree));

  it('I, IV, V of C major', () => {
    expect([1, 4, 5].map((d) => name(pc('C'), d as 1 | 4 | 5))).toEqual([
      'C major', 'F major', 'G major',
    ]);
  });

  it('I, IV, V of F major (IV is B♭)', () => {
    expect([1, 4, 5].map((d) => name(pc('F'), d as 1 | 4 | 5))).toEqual([
      'F major', 'B♭ major', 'C major',
    ]);
  });

  it('I, IV, V of G major (V is D)', () => {
    expect([1, 4, 5].map((d) => name(pc('G'), d as 1 | 4 | 5))).toEqual([
      'G major', 'C major', 'D major',
    ]);
  });

  it('ii and vii° get minor and diminished qualities', () => {
    expect(name(pc('C'), 2)).toBe('D minor');
    expect(name(pc('C'), 7)).toBe('B diminished');
  });
});

describe('romanNumeral', () => {
  it('cases by quality', () => {
    expect(romanNumeral(1, 'major')).toBe('I');
    expect(romanNumeral(4, 'major')).toBe('IV');
    expect(romanNumeral(5, 'major')).toBe('V');
    expect(romanNumeral(2, 'minor')).toBe('ii');
    expect(romanNumeral(7, 'diminished')).toBe('vii°');
  });
});

describe('evaluateChord', () => {
  it('accepts close root position in any octave', () => {
    expect(evaluateChord(C_MAJOR, [48, 52, 55])).toEqual({ correct: true }); // C3 E3 G3
    expect(evaluateChord(C_MAJOR, [60, 64, 67])).toEqual({ correct: true }); // C4 E4 G4
    expect(evaluateChord(C_MAJOR, [72, 76, 79])).toEqual({ correct: true }); // C5 E5 G5
  });

  it('accepts open voicings and doublings as long as the root is lowest', () => {
    expect(evaluateChord(C_MAJOR, [48, 55, 64])).toEqual({ correct: true }); // C3 G3 E4
    expect(evaluateChord(C_MAJOR, [48, 52, 55, 60])).toEqual({ correct: true }); // + C4
    expect(evaluateChord(C_MAJOR, [36, 60, 64, 67])).toEqual({ correct: true }); // C2 bass
  });

  it('ignores arrival order and repeated notes', () => {
    expect(evaluateChord(C_MAJOR, [67, 64, 60])).toEqual({ correct: true });
    expect(evaluateChord(C_MAJOR, [60, 64, 64, 67, 60])).toEqual({ correct: true });
  });

  it('grades B♭ major from MIDI regardless of spelling', () => {
    expect(evaluateChord(B_FLAT_MAJOR, [58, 62, 65])).toEqual({ correct: true }); // B♭3 D4 F4
  });

  it('rejects inversions with the bass note identified', () => {
    expect(evaluateChord(C_MAJOR, [52, 55, 60])).toEqual({
      correct: false,
      reason: 'not_root_position',
      bassMidi: 52,
    }); // E3 G3 C4 — first inversion
    expect(evaluateChord(C_MAJOR, [55, 60, 64])).toEqual({
      correct: false,
      reason: 'not_root_position',
      bassMidi: 55,
    }); // G3 C4 E4 — second inversion
  });

  it('reports extra and missing notes', () => {
    // C E F♯ — F♯ instead of G
    expect(evaluateChord(C_MAJOR, [60, 64, 66])).toEqual({
      correct: false,
      reason: 'wrong_notes',
      extra: [66],
      missing: [pc('G')],
    });
    // C E G B♭ — an extra seventh
    expect(evaluateChord(C_MAJOR, [60, 64, 67, 70])).toEqual({
      correct: false,
      reason: 'wrong_notes',
      extra: [70],
      missing: [],
    });
    // B major instead of B♭ major
    expect(evaluateChord(B_FLAT_MAJOR, [59, 63, 66])).toMatchObject({
      correct: false,
      reason: 'wrong_notes',
      missing: [pc('B', 'b'), pc('D'), pc('F')],
    });
  });

  it('reports wrong notes before inversion when both apply', () => {
    expect(evaluateChord(C_MAJOR, [52, 55, 60, 62])).toMatchObject({ reason: 'wrong_notes' });
  });
});

describe('isChordAttemptReady', () => {
  it('waits for three distinct pitch classes', () => {
    expect(isChordAttemptReady(C_MAJOR, [])).toBe(false);
    expect(isChordAttemptReady(C_MAJOR, [60, 64])).toBe(false);
    expect(isChordAttemptReady(C_MAJOR, [48, 60, 64])).toBe(false); // C3 C4 E4 — only C and E
    expect(isChordAttemptReady(C_MAJOR, [60, 64, 67])).toBe(true);
    expect(isChordAttemptReady(C_MAJOR, [60, 61, 62])).toBe(true); // wrong, but gradable
  });
});

describe('spellPlayedNote', () => {
  it('uses the chord spelling for chord tones', () => {
    expect(spellPlayedNote(B_FLAT_MAJOR, 58)).toEqual(pitch('B', 'b', 3));
    expect(spellPlayedNote(B_FLAT_MAJOR, 70)).toEqual(pitch('B', 'b', 4));
  });

  it('spells black-key wrong notes as an altered neighbouring chord tone', () => {
    expect(spellPlayedNote(C_MAJOR, 63)).toEqual(pitch('E', 'b', 4)); // minor 3rd → E♭, not D♯
    expect(spellPlayedNote(C_MAJOR, 61)).toEqual(pitch('C', '#', 4));
    expect(spellPlayedNote(C_MAJOR, 66)).toEqual(pitch('G', 'b', 4)); // flattened 5th
  });

  it('keeps white-key wrong notes natural', () => {
    expect(spellPlayedNote(C_MAJOR, 62)).toEqual(pitch('D', 'n', 4));
    expect(spellPlayedNote(B_FLAT_MAJOR, 59)).toEqual(pitch('B', 'n', 3));
  });
});

describe('chordVoicingNear', () => {
  it('puts the root nearest the given note', () => {
    expect(chordVoicingNear(C_MAJOR, 52).map((p) => pitchDisplayName(p, true))).toEqual([
      'C3', 'E3', 'G3',
    ]); // near E3 → C3, not C4
    expect(chordVoicingNear(B_FLAT_MAJOR, 50).map((p) => pitchDisplayName(p, true))).toEqual([
      'B♭2', 'D3', 'F3',
    ]); // near D3 → B♭2
  });
});
