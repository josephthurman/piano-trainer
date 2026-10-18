import type { Pitch } from '../music/pitch.ts';
import type { Interval } from '../music/interval.ts';

const STORAGE_KEY = 'piano-trainer:v1';
const SCHEMA_VERSION = 1 as const;

export type StoredAttempt = {
  base: Pitch;
  interval: Interval;
  direction: 'up' | 'down';
  playedMidi: [number, number];
  correct: boolean;
  timestamp: number;
};

export type StoredData = {
  version: typeof SCHEMA_VERSION;
  attempts: StoredAttempt[];
};

const EMPTY: StoredData = { version: SCHEMA_VERSION, attempts: [] };

export function loadStoredData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY, attempts: [] };
    const parsed = JSON.parse(raw);
    if (parsed?.version === SCHEMA_VERSION && Array.isArray(parsed.attempts)) {
      return parsed as StoredData;
    }
    return { ...EMPTY, attempts: [] };
  } catch {
    return { ...EMPTY, attempts: [] };
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
