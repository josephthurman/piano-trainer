export type IntervalSet = 'basic' | 'all';
export type DirectionMode = 'up' | 'down' | 'both';

export type SessionConfig = {
  sessionLength: number;
  intervalSet: IntervalSet;
  direction: DirectionMode;
};

const SETTINGS_KEY = 'piano-trainer:settings:v1';

export const DEFAULT_CONFIG: SessionConfig = {
  sessionLength: 15,
  intervalSet: 'basic',
  direction: 'up',
};

const VALID_LENGTHS = [5, 10, 15, 20, 25] as const;

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
