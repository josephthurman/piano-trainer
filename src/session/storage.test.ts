import { describe, expect, it } from 'vitest';
import { migrateV1, parseStoredData } from './storage.ts';

const v1Attempt = {
  base: { letter: 'C', accidental: 'n', octave: 4 },
  interval: { quality: 'M', number: 3 },
  direction: 'up',
  playedMidi: [60, 64],
  correct: true,
  timestamp: 123,
};

describe('migrateV1', () => {
  it('tags every v1 attempt as an interval attempt and keeps its fields', () => {
    const data = migrateV1(JSON.stringify({ version: 1, attempts: [v1Attempt, v1Attempt] }));
    expect(data.version).toBe(2);
    expect(data.attempts).toHaveLength(2);
    expect(data.attempts[0]).toEqual({ ...v1Attempt, kind: 'interval' });
  });

  it('returns empty data for missing or malformed input', () => {
    expect(migrateV1(null).attempts).toEqual([]);
    expect(migrateV1('not json').attempts).toEqual([]);
    expect(migrateV1(JSON.stringify({ version: 7, attempts: [v1Attempt] })).attempts).toEqual([]);
  });
});

describe('parseStoredData', () => {
  it('round-trips v2 data with mixed attempt kinds', () => {
    const v2 = {
      version: 2,
      attempts: [
        { ...v1Attempt, kind: 'interval' },
        {
          kind: 'chord',
          tonic: { letter: 'F', accidental: 'n' },
          degree: 4,
          chord: { root: { letter: 'B', accidental: 'b' }, quality: 'major' },
          playedMidi: [58, 62, 65],
          correct: true,
          timestamp: 456,
        },
      ],
    };
    expect(parseStoredData(JSON.stringify(v2))).toEqual(v2);
  });

  it('does not accept v1 data as v2', () => {
    expect(parseStoredData(JSON.stringify({ version: 1, attempts: [v1Attempt] })).attempts).toEqual(
      [],
    );
  });
});
