import type { Pitch, PitchClass } from './pitch.ts';
import {
  midiPitchClass,
  midiToPitch,
  pitchClassDisplayName,
  pitchClassOf,
  pitchToMidi,
  spellMidi,
} from './pitch.ts';
import type { Interval } from './interval.ts';
import { applyInterval } from './interval.ts';

export type TriadQuality = 'major' | 'minor' | 'diminished';

export type Chord = {
  root: PitchClass;
  quality: TriadQuality;
};

export type ScaleDegree = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Intervals above the root for the 3rd and 5th of each triad. */
const TRIAD_INTERVALS: Record<TriadQuality, readonly [Interval, Interval]> = {
  major: [{ quality: 'M', number: 3 }, { quality: 'P', number: 5 }],
  minor: [{ quality: 'm', number: 3 }, { quality: 'P', number: 5 }],
  diminished: [{ quality: 'm', number: 3 }, { quality: 'd', number: 5 }],
};

/** Root-position, close-voiced triad with the root in `rootOctave`, e.g. B♭3 D4 F4. */
export function chordTones(chord: Chord, rootOctave = 4): Pitch[] {
  const root: Pitch = { ...chord.root, octave: rootOctave };
  return [root, ...TRIAD_INTERVALS[chord.quality].map((iv) => applyInterval(root, iv))];
}

function chordPitchClasses(chord: Chord): PitchClass[] {
  return chordTones(chord).map(({ letter, accidental }) => ({ letter, accidental }));
}

export function chordEquals(a: Chord, b: Chord): boolean {
  return (
    a.quality === b.quality &&
    a.root.letter === b.root.letter &&
    a.root.accidental === b.root.accidental
  );
}

const MAJOR_SCALE: readonly Interval[] = [
  { quality: 'P', number: 1 },
  { quality: 'M', number: 2 },
  { quality: 'M', number: 3 },
  { quality: 'P', number: 4 },
  { quality: 'P', number: 5 },
  { quality: 'M', number: 6 },
  { quality: 'M', number: 7 },
];

const MAJOR_KEY_TRIAD_QUALITIES: readonly TriadQuality[] = [
  'major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished',
];

/** The triad built on `degree` of the major key on `tonic` — e.g. IV of F major is B♭ major. */
export function diatonicTriad(tonic: PitchClass, degree: ScaleDegree): Chord {
  const root = applyInterval({ ...tonic, octave: 4 }, MAJOR_SCALE[degree - 1]);
  return {
    root: { letter: root.letter, accidental: root.accidental },
    quality: MAJOR_KEY_TRIAD_QUALITIES[degree - 1],
  };
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;

/** Upper case for major, lower case for minor, lower case + ° for diminished. */
export function romanNumeral(degree: ScaleDegree, quality: TriadQuality): string {
  const numeral = ROMAN[degree - 1];
  switch (quality) {
    case 'major': return numeral;
    case 'minor': return numeral.toLowerCase();
    case 'diminished': return `${numeral.toLowerCase()}°`;
  }
}

export function chordDisplayName(chord: Chord): string {
  return `${pitchClassDisplayName(chord.root)} ${chord.quality}`;
}

export function majorKeyDisplayName(tonic: PitchClass): string {
  return `${pitchClassDisplayName(tonic)} major`;
}

export type ChordEvaluation =
  | { correct: true }
  | {
      correct: false;
      reason: 'wrong_notes';
      /** Played MIDI notes that aren't in the chord. */
      extra: number[];
      /** Chord tones that weren't played in any octave. */
      missing: PitchClass[];
    }
  | {
      correct: false;
      reason: 'not_root_position';
      /** The lowest played note, which should have been the root. */
      bassMidi: number;
    };

/**
 * Grades a chord attempt. Correct means:
 *  - every chord tone was played in at least one octave,
 *  - nothing outside the chord was played, and
 *  - the lowest note is the root (root position).
 *
 * Octave, doublings, and open voicings are all accepted: C3 E3 G3, C4 E4 G4 C5,
 * and C3 G3 E4 are all correct for C major. Order of arrival doesn't matter.
 */
export function evaluateChord(chord: Chord, playedMidi: readonly number[]): ChordEvaluation {
  const notes = [...new Set(playedMidi)].sort((a, b) => a - b);
  const tones = chordPitchClasses(chord);
  const tonePcs = new Set(tones.map(pitchClassOf));
  const playedPcs = new Set(notes.map(midiPitchClass));

  const extra = notes.filter((m) => !tonePcs.has(midiPitchClass(m)));
  const missing = tones.filter((t) => !playedPcs.has(pitchClassOf(t)));
  if (extra.length > 0 || missing.length > 0) {
    return { correct: false, reason: 'wrong_notes', extra, missing };
  }
  if (midiPitchClass(notes[0]) !== pitchClassOf(chord.root)) {
    return { correct: false, reason: 'not_root_position', bassMidi: notes[0] };
  }
  return { correct: true };
}

/**
 * True once the player has played as many distinct pitch classes as the chord has
 * tones — the earliest point at which grading is meaningful. Fewer than that and
 * they're presumably still building the chord.
 */
export function isChordAttemptReady(chord: Chord, playedMidi: readonly number[]): boolean {
  const distinct = new Set(playedMidi.map(midiPitchClass));
  return distinct.size >= TRIAD_INTERVALS[chord.quality].length + 1;
}

/**
 * Spell a played note for display:
 *  - chord tones use the chord's own spelling (B♭, not A♯, in B♭ major);
 *  - a black key a semitone off a chord tone reads as that tone altered, so a
 *    minor third over C shows as E♭ (on the E line, next to the correct E), not D♯;
 *  - anything else uses the default spelling.
 */
export function spellPlayedNote(chord: Chord, midi: number): Pitch {
  const pc = midiPitchClass(midi);
  const tones = chordPitchClasses(chord);
  const tone = tones.find((t) => pitchClassOf(t) === pc);
  if (tone) return spellMidi(midi, tone);

  const fallback = midiToPitch(midi);
  if (fallback.accidental === 'n') return fallback;
  for (const t of tones) {
    if (t.accidental !== 'n') continue;
    const tonePc = pitchClassOf(t);
    if (pc === (tonePc + 11) % 12) return spellMidi(midi, { letter: t.letter, accidental: 'b' });
    if (pc === (tonePc + 1) % 12) return spellMidi(midi, { letter: t.letter, accidental: '#' });
  }
  return fallback;
}

/** Root-position voicing whose root is the nearest one to `nearMidi` (ties go lower). */
export function chordVoicingNear(chord: Chord, nearMidi: number): Pitch[] {
  let bestOctave = 4;
  let bestDistance = Infinity;
  for (let octave = 1; octave <= 6; octave++) {
    const distance = Math.abs(pitchToMidi({ ...chord.root, octave }) - nearMidi);
    if (distance < bestDistance) {
      bestOctave = octave;
      bestDistance = distance;
    }
  }
  return chordTones(chord, bestOctave);
}
