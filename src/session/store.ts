import { create } from 'zustand';
import { pitchToMidi } from '../music/pitch.ts';
import { BASIC_SEVEN } from '../music/interval.ts';
import type { IntervalExercise } from './generator.ts';
import { generateExercises } from './generator.ts';

export type SessionStatus =
  | 'idle'
  | 'prompt'
  | 'feedback_correct'
  | 'feedback_wrong'
  | 'complete';

export type Attempt = {
  exerciseId: string;
  correct: boolean;
  playedMidi: [number, number];
  timestamp: number;
};

export type SessionConfig = {
  sessionLength: number;
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
};

const DEFAULT_CONFIG: SessionConfig = { sessionLength: 15 };

export const useSessionStore = create<SessionState>()((set, get) => ({
  status: 'idle',
  config: DEFAULT_CONFIG,
  exercises: [],
  currentIndex: 0,
  attempts: [],
  pendingInput: [],

  startSession: () => {
    const { config } = get();
    const exercises = generateExercises(config.sessionLength, {
      intervals: BASIC_SEVEN,
      direction: 'up',
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

    const attempt: Attempt = {
      exerciseId: current.id,
      correct,
      playedMidi: [playedBase, playedTarget],
      timestamp: Date.now(),
    };
    const nextAttempts = [...attempts, attempt];

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
}));

export const selectCurrentExercise = (s: SessionState): IntervalExercise | null =>
  s.exercises[s.currentIndex] ?? null;

export const selectCorrectCount = (s: SessionState): number =>
  s.attempts.filter((a) => a.correct).length;

export const selectLastAttempt = (s: SessionState): Attempt | null =>
  s.attempts[s.attempts.length - 1] ?? null;
