import { describe, expect, it } from 'vitest';
import { chordDisplayName, chordEquals } from '../music/chord.ts';
import { CHORD_SETS } from './settings.ts';
import { chordItems, generateChordExercises } from './generator.ts';

function seededRng(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

describe('basic chord set', () => {
  const { tonics, degrees } = CHORD_SETS.basic;
  const items = chordItems(tonics, degrees);

  it('is I, IV, V in C, F and G major', () => {
    expect(items).toHaveLength(9);
    const exercises = generateChordExercises(200, { items, rng: seededRng(1) });
    const chords = new Set(exercises.map((e) => chordDisplayName(e.chord)));
    expect([...chords].sort()).toEqual([
      'B♭ major', 'C major', 'D major', 'F major', 'G major',
    ]);
  });

  it('never asks for the same chord twice in a row', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const exercises = generateChordExercises(25, { items, rng: seededRng(seed) });
      for (let i = 1; i < exercises.length; i++) {
        expect(chordEquals(exercises[i].chord, exercises[i - 1].chord)).toBe(false);
      }
    }
  });

  it('allows repeats when the pool has only one chord', () => {
    const only = chordItems([{ letter: 'C', accidental: 'n' }], [1]);
    const exercises = generateChordExercises(3, { items: only });
    expect(exercises.map((e) => chordDisplayName(e.chord))).toEqual([
      'C major', 'C major', 'C major',
    ]);
  });
});
