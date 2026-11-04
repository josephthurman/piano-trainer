import type { Pitch, PitchClass } from '../music/pitch.ts';
import type { Interval } from '../music/interval.ts';
import type { Chord, ScaleDegree } from '../music/chord.ts';

/**
 * v2 lives under its own key rather than overwriting v1 in place: a stale tab still
 * running the v1 build treats unknown versions as empty and would clobber the whole
 * history on its next write. The v1 key is read for migration and otherwise left alone.
 */
const STORAGE_KEY = 'piano-trainer:v2';
const LEGACY_V1_KEY = 'piano-trainer:v1';
const SCHEMA_VERSION = 2 as const;

export type StoredIntervalAttempt = {
  kind: 'interval';
  base: Pitch;
  interval: Interval;
  direction: 'up' | 'down';
  playedMidi: [number, number];
  correct: boolean;
  timestamp: number;
};

export type StoredChordAttempt = {
  kind: 'chord';
  tonic: PitchClass;
  degree: ScaleDegree;
  chord: Chord;
  /** In the order played, including any repeats. */
  playedMidi: number[];
  correct: boolean;
  timestamp: number;
};

export type StoredAttempt = StoredIntervalAttempt | StoredChordAttempt;

export type StoredData = {
  version: typeof SCHEMA_VERSION;
  attempts: StoredAttempt[];
};

function empty(): StoredData {
  return { version: SCHEMA_VERSION, attempts: [] };
}

export function parseStoredData(raw: string | null): StoredData {
  if (!raw) return empty();
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.version === SCHEMA_VERSION && Array.isArray(parsed.attempts)) {
      return parsed as StoredData;
    }
    return empty();
  } catch {
    return empty();
  }
}

/** v1 held interval attempts only, with no `kind` tag. */
export function migrateV1(raw: string | null): StoredData {
  if (!raw) return empty();
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || !Array.isArray(parsed.attempts)) return empty();
    return {
      version: SCHEMA_VERSION,
      attempts: parsed.attempts.map((a: Omit<StoredIntervalAttempt, 'kind'>) => ({
        ...a,
        kind: 'interval',
      })),
    };
  } catch {
    return empty();
  }
}

export function loadStoredData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) return parseStoredData(raw);
    return migrateV1(localStorage.getItem(LEGACY_V1_KEY));
  } catch {
    return empty();
  }
}

export function appendStoredAttempt(attempt: StoredAttempt): void {
  const data = loadStoredData();
  data.attempts.push(attempt);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // quota exceeded or storage disabled — silently drop
  }
}

export function exportStoredDataToFile(): void {
  const data = loadStoredData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `piano-trainer-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
