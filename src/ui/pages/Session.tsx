import { useCallback, useEffect } from 'react';
import { useNotes } from '../../midi/noteStream.ts';
import type { MidiNoteEvent } from '../../midi/types.ts';
import {
  selectCorrectCount,
  selectCurrentExercise,
  useSessionStore,
} from '../../session/store.ts';
import { IntervalExerciseView } from '../exercises/IntervalExerciseView.tsx';
import { ChordExerciseView } from '../exercises/ChordExerciseView.tsx';

export function Session() {
  const status = useSessionStore((s) => s.status);
  const current = useSessionStore(selectCurrentExercise);
  const correctCount = useSessionStore(selectCorrectCount);
  const totalCount = useSessionStore((s) => s.config.sessionLength);
  const currentIndex = useSessionStore((s) => s.currentIndex);
  const recordNoteDown = useSessionStore((s) => s.recordNoteDown);
  const advance = useSessionStore((s) => s.advance);

  useEffect(() => {
    if (status !== 'feedback_correct') return;
    const id = window.setTimeout(() => advance(), 700);
    return () => window.clearTimeout(id);
  }, [status, advance]);

  const onNote = useCallback(
    (ev: MidiNoteEvent) => {
      if (ev.type === 'note_on') recordNoteDown(ev.note);
    },
    [recordNoteDown],
  );
  useNotes(onNote);

  if (!current) return null;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="w-full flex items-center justify-between text-sm">
        <span className="text-neutral-400">
          Exercise <span className="text-neutral-200 font-medium">{currentIndex + 1}</span> / {totalCount}
        </span>
        <span className="text-green-400">✓ {correctCount}</span>
      </div>

      {current.kind === 'interval' ? (
        <IntervalExerciseView exercise={current} />
      ) : (
        <ChordExerciseView exercise={current} />
      )}
    </div>
  );
}
