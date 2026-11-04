import type { PitchClass } from '../music/pitch.ts';
import type { ScaleDegree } from '../music/chord.ts';

export type IntervalSet = 'basic' | 'all';
export type DirectionMode = 'up' | 'down' | 'both';
export type ChordSet = 'basic';

export type SessionConfig = {
  sessionLength: number;
  intervalSet: IntervalSet;
  direction: DirectionMode;
  chordSet: ChordSet;
};

export const INTERVAL_SET_LABELS: Record<IntervalSet, string> = {
  basic: 'Basic 7',
  all: 'All simple',
};

export const DIRECTION_LABELS: Record<DirectionMode, string> = {
  up: 'Ascending',
  down: 'Descending',
  both: 'Both',
};

export type ChordSetDefinition = {
  label: string;
  /** Major keys to draw chords from. */
  tonics: readonly PitchClass[];
  /** Scale degrees to build triads on (1 = I, 4 = IV, …). */
  degrees: readonly ScaleDegree[];
};

/**
 * Chord difficulty tiers, analogous to the interval sets. Adding a tier (more
 * keys, or ii/iii/vi) is one entry here plus widening the ChordSet type.
 */
export const CHORD_SETS: Record<ChordSet, ChordSetDefinition> = {
  basic: {
    label: 'I · IV · V in C, F, G',
    tonics: [
      { letter: 'C', accidental: 'n' },
      { letter: 'F', accidental: 'n' },
      { letter: 'G', accidental: 'n' },
    ],
    degrees: [1, 4, 5],
  },
};

const SETTINGS_KEY = 'piano-trainer:settings:v1';

export const DEFAULT_CONFIG: SessionConfig = {
  sessionLength: 15,
  intervalSet: 'basic',
  direction: 'up',
  chordSet: 'basic',
};

const VALID_LENGTHS = [5, 10, 15, 20, 25] as const;

function isChordSet(value: unknown): value is ChordSet {
  return typeof value === 'string' && Object.hasOwn(CHORD_SETS, value);
}

export function loadSettings(): SessionConfig {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      sessionLength:
        typeof parsed.sessionLength === 'number' && VALID_LENGTHS.includes(parsed.sessionLength)
          ? parsed.sessionLength
          : DEFAULT_CONFIG.sessionLength,
      intervalSet: parsed.intervalSet === 'all' ? 'all' : 'basic',
      direction:
        parsed.direction === 'down'
          ? 'down'
          : parsed.direction === 'both'
            ? 'both'
            : 'up',
      chordSet: isChordSet(parsed.chordSet) ? parsed.chordSet : DEFAULT_CONFIG.chordSet,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveSettings(config: SessionConfig): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(config));
  } catch {
    // quota / disabled — silent
  }
}
