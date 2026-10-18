import { create } from 'zustand';
import { pitchToMidi } from '../music/pitch.ts';
import { ALL_SIMPLE_INTERVALS, BASIC_SEVEN } from '../music/interval.ts';
import type { IntervalExercise } from './generator.ts';
import { generateExercises } from './generator.ts';
import { appendStoredAttempt, exportStoredDataToFile, loadStoredData } from './storage.ts';
import { intervalWeights, pickWeightedInterval } from './weighting.ts';
import type { SessionConfig } from './settings.ts';
import { loadSettings, saveSettings } from './settings.ts';

export type { SessionConfig } from './settings.ts';

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
  playedMidi: [number, number];
  timestamp: number;
};

type SessionState = {
  status: SessionStatus;
  config: SessionConfig;
  exercises: IntervalExercise[];
  currentIndex: number;
  attempts: Attempt[];
  pendingInput: number[];

  startSession: () => void;
  recordNoteDown: (midi: number) => void;
  advance: () => void;
  reset: () => void;
  exportData: () => void;
  viewStats: () => void;
  viewSettings: () => void;
  updateConfig: (patch: Partial<SessionConfig>) => void;
};

export const useSessionStore = create<SessionState>()((set, get) => ({
  status: 'idle',
  config: loadSettings(),
  exercises: [],
  currentIndex: 0,
  attempts: [],
  pendingInput: [],

  startSession: () => {
    const { config } = get();
    const intervals =
      config.intervalSet === 'all' ? ALL_SIMPLE_INTERVALS : BASIC_SEVEN;
    const history = loadStoredData().attempts;
    const weights = intervalWeights(intervals, history);
    const exercises = generateExercises(config.sessionLength, {
      intervals,
      direction: config.direction,
      pickInterval: (xs) => pickWeightedInterval(xs, weights),
    });
    set({
      status: 'prompt',
      exercises,
      currentIndex: 0,
      attempts: [],
      pendingInput: [],
    });
  },

  recordNoteDown: (midi: number) => {
    const { status, pendingInput, exercises, currentIndex, attempts } = get();
    if (status !== 'prompt') return;

    const nextInput = [...pendingInput, midi];
    if (nextInput.length < 2) {
      set({ pendingInput: nextInput });
      return;
    }

    const current = exercises[currentIndex];
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

export const selectCurrentExercise = (s: SessionState): IntervalExercise | null =>
  s.exercises[s.currentIndex] ?? null;

export const selectCorrectCount = (s: SessionState): number =>
  s.attempts.filter((a) => a.correct).length;

export const selectLastAttempt = (s: SessionState): Attempt | null =>
  s.attempts[s.attempts.length - 1] ?? null;
