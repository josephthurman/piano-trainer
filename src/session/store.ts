import { create } from 'zustand';
import { pitchToMidi } from '../music/pitch.ts';
import { ALL_SIMPLE_INTERVALS, BASIC_SEVEN } from '../music/interval.ts';
import { evaluateChord, isChordAttemptReady } from '../music/chord.ts';
import type { Exercise } from './generator.ts';
import { chordItems, generateChordExercises, generateExercises } from './generator.ts';
import type { StoredAttempt } from './storage.ts';
import { appendStoredAttempt, exportStoredDataToFile, loadStoredData } from './storage.ts';
import { chordItemKey } from './stats.ts';
import {
  chordItemWeights,
  intervalWeights,
  pickWeighted,
  pickWeightedInterval,
} from './weighting.ts';
import type { SessionConfig } from './settings.ts';
import { CHORD_SETS, loadSettings, saveSettings } from './settings.ts';

export type { SessionConfig } from './settings.ts';

export type LessonType = 'interval' | 'chord';

export type SessionStatus =
  | 'idle'
  | 'prompt'
  | 'feedback_correct'
  | 'feedback_wrong'
  | 'complete'
  | 'stats'
  | 'settings';

export type Attempt = {
  correct: boolean;
  playedMidi: number[];
  timestamp: number;
};

type SessionState = {
  status: SessionStatus;
  config: SessionConfig;
  /** The lesson most recently started; also the default tab on the Stats page. */
  lesson: LessonType;
  exercises: Exercise[];
  currentIndex: number;
  attempts: Attempt[];
  pendingInput: number[];

  startSession: (lesson: LessonType) => void;
  recordNoteDown: (midi: number) => void;
  /** Grade the notes collected so far for the current chord exercise. */
  submitChordAttempt: () => void;
  advance: () => void;
  reset: () => void;
  exportData: () => void;
  viewStats: () => void;
  viewSettings: () => void;
  updateConfig: (patch: Partial<SessionConfig>) => void;
};

function buildIntervalExercises(config: SessionConfig, history: StoredAttempt[]): Exercise[] {
  const intervals = config.intervalSet === 'all' ? ALL_SIMPLE_INTERVALS : BASIC_SEVEN;
  const weights = intervalWeights(intervals, history);
  return generateExercises(config.sessionLength, {
    intervals,
    direction: config.direction,
    pickInterval: (xs) => pickWeightedInterval(xs, weights),
  });
}

function buildChordExercises(config: SessionConfig, history: StoredAttempt[]): Exercise[] {
  const { tonics, degrees } = CHORD_SETS[config.chordSet];
  const items = chordItems(tonics, degrees);
  const weights = chordItemWeights(items, history);
  return generateChordExercises(config.sessionLength, {
    items,
    pickItem: (xs) => pickWeighted(xs, chordItemKey, weights),
  });
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  status: 'idle',
  config: loadSettings(),
  lesson: 'interval',
  exercises: [],
  currentIndex: 0,
  attempts: [],
  pendingInput: [],

  startSession: (lesson) => {
    const { config } = get();
    const history = loadStoredData().attempts;
    const exercises =
      lesson === 'chord'
        ? buildChordExercises(config, history)
        : buildIntervalExercises(config, history);
    set({
      status: 'prompt',
      lesson,
      exercises,
      currentIndex: 0,
      attempts: [],
      pendingInput: [],
    });
  },

  recordNoteDown: (midi: number) => {
    const { status, pendingInput, exercises, currentIndex, attempts } = get();
    if (status !== 'prompt') return;

    const current = exercises[currentIndex];
    const nextInput = [...pendingInput, midi];

    // Chord notes just accumulate; the chord view decides when to grade them.
    if (current.kind === 'chord') {
      set({ pendingInput: nextInput });
      return;
    }

    if (nextInput.length < 2) {
      set({ pendingInput: nextInput });
      return;
    }

    const expectedBase = pitchToMidi(current.base);
    const expectedTarget = pitchToMidi(current.target);
    const [playedBase, playedTarget] = nextInput;
    const correct = playedBase === expectedBase && playedTarget === expectedTarget;

    const timestamp = Date.now();
    const attempt: Attempt = {
      correct,
      playedMidi: [playedBase, playedTarget],
      timestamp,
    };
    const nextAttempts = [...attempts, attempt];

    appendStoredAttempt({
      kind: 'interval',
      base: current.base,
      interval: current.interval,
      direction: current.direction,
      playedMidi: [playedBase, playedTarget],
      correct,
      timestamp,
    });

    set({
      status: correct ? 'feedback_correct' : 'feedback_wrong',
      attempts: nextAttempts,
      pendingInput: [],
    });
  },

  submitChordAttempt: () => {
    const { status, pendingInput, exercises, currentIndex, attempts } = get();
    const current = exercises[currentIndex];
    if (status !== 'prompt' || current?.kind !== 'chord') return;
    if (!isChordAttemptReady(current.chord, pendingInput)) return;

    const { correct } = evaluateChord(current.chord, pendingInput);
    const timestamp = Date.now();
    const playedMidi = [...pendingInput];

    appendStoredAttempt({
      kind: 'chord',
      tonic: current.tonic,
      degree: current.degree,
      chord: current.chord,
      playedMidi,
      correct,
      timestamp,
    });

    set({
      status: correct ? 'feedback_correct' : 'feedback_wrong',
      attempts: [...attempts, { correct, playedMidi, timestamp }],
      pendingInput: [],
    });
  },

  advance: () => {
    const { status, exercises, currentIndex } = get();
    if (status !== 'feedback_correct' && status !== 'feedback_wrong') return;
    const isLast = currentIndex + 1 >= exercises.length;
    if (isLast) {
      set({ status: 'complete' });
    } else {
      set({
        status: 'prompt',
        currentIndex: currentIndex + 1,
        pendingInput: [],
      });
    }
  },

  reset: () => {
    set({
      status: 'idle',
      exercises: [],
      currentIndex: 0,
      attempts: [],
      pendingInput: [],
    });
  },

  exportData: () => {
    exportStoredDataToFile();
  },

  viewStats: () => {
    set({ status: 'stats' });
  },

  viewSettings: () => {
    set({ status: 'settings' });
  },

  updateConfig: (patch) => {
    const next = { ...get().config, ...patch };
    saveSettings(next);
    set({ config: next });
  },
}));

export const selectCurrentExercise = (s: SessionState): Exercise | null =>
  s.exercises[s.currentIndex] ?? null;

export const selectCorrectCount = (s: SessionState): number =>
  s.attempts.filter((a) => a.correct).length;

export const selectLastAttempt = (s: SessionState): Attempt | null =>
  s.attempts[s.attempts.length - 1] ?? null;
