export type NoteLetter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
export type Accidental = 'bb' | 'b' | 'n' | '#' | '##';

export type Pitch = {
  letter: NoteLetter;
  accidental: Accidental;
  octave: number;
};

/** A spelled note without an octave, e.g. B♭ — used for chord roots and keys. */
export type PitchClass = {
  letter: NoteLetter;
  accidental: Accidental;
};

export const LETTERS: readonly NoteLetter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const LETTER_SEMITONES: Record<NoteLetter, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

export const LETTER_STEP: Record<NoteLetter, number> = {
  C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6,
};

export const ACCIDENTAL_SEMITONES: Record<Accidental, number> = {
  bb: -2, b: -1, n: 0, '#': 1, '##': 2,
};

export function pitch(letter: NoteLetter, accidental: Accidental, octave: number): Pitch {
  return { letter, accidental, octave };
}

export function pitchToMidi(p: Pitch): number {
  return (p.octave + 1) * 12 + LETTER_SEMITONES[p.letter] + ACCIDENTAL_SEMITONES[p.accidental];
}

/** 0–11, C = 0. Enharmonic spellings (A♯ / B♭) share a number. */
export function pitchClassOf(pc: PitchClass): number {
  return (((LETTER_SEMITONES[pc.letter] + ACCIDENTAL_SEMITONES[pc.accidental]) % 12) + 12) % 12;
}

export function midiPitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

/** Spell a MIDI note with a specific letter/accidental, e.g. 58 as B♭3 rather than A♯3. */
export function spellMidi(midi: number, spelling: PitchClass): Pitch {
  const offset = midi - LETTER_SEMITONES[spelling.letter] - ACCIDENTAL_SEMITONES[spelling.accidental];
  if (offset % 12 !== 0) {
    throw new Error(`MIDI ${midi} cannot be spelled as ${spelling.letter}${spelling.accidental}`);
  }
  return { letter: spelling.letter, accidental: spelling.accidental, octave: offset / 12 - 1 };
}

const DEFAULT_SPELLINGS: ReadonlyArray<{ letter: NoteLetter; accidental: Accidental }> = [
  { letter: 'C', accidental: 'n' },
  { letter: 'C', accidental: '#' },
  { letter: 'D', accidental: 'n' },
  { letter: 'D', accidental: '#' },
  { letter: 'E', accidental: 'n' },
  { letter: 'F', accidental: 'n' },
  { letter: 'F', accidental: '#' },
  { letter: 'G', accidental: 'n' },
  { letter: 'G', accidental: '#' },
  { letter: 'A', accidental: 'n' },
  { letter: 'A', accidental: '#' },
  { letter: 'B', accidental: 'n' },
];

export function midiToPitch(midi: number): Pitch {
  const octave = Math.floor(midi / 12) - 1;
  const semitone = ((midi % 12) + 12) % 12;
  const base = DEFAULT_SPELLINGS[semitone];
  return { letter: base.letter, accidental: base.accidental, octave };
}

const ACCIDENTAL_SYMBOL: Record<Accidental, string> = {
  bb: '\u{1D12B}',
  b: '♭',
  n: '',
  '#': '♯',
  '##': '\u{1D12A}',
};

export function pitchClassDisplayName(pc: PitchClass): string {
  return `${pc.letter}${ACCIDENTAL_SYMBOL[pc.accidental]}`;
}

export function pitchDisplayName(p: Pitch, includeOctave = false): string {
  const name = pitchClassDisplayName(p);
  return includeOctave ? `${name}${p.octave}` : name;
}

export function pitchEquals(a: Pitch, b: Pitch): boolean {
  return a.letter === b.letter && a.accidental === b.accidental && a.octave === b.octave;
}

export function pitchEqualsEnharmonic(a: Pitch, b: Pitch): boolean {
  return pitchToMidi(a) === pitchToMidi(b);
}
