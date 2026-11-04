import { useMemo, useState } from 'react';
import { midiToPitch, pitchDisplayName, pitchToMidi } from '../../music/pitch.ts';
import { intervalDisplayName } from '../../music/interval.ts';
import type { IntervalExercise } from '../../session/generator.ts';
import { selectLastAttempt, useSessionStore } from '../../session/store.ts';
import { Staff, type StaffPosition } from '../Staff.tsx';
import { CorrectFeedback, WrongFeedback } from './Feedback.tsx';

export function IntervalExerciseView({ exercise }: { exercise: IntervalExercise }) {
  const status = useSessionStore((s) => s.status);
  const lastAttempt = useSessionStore(selectLastAttempt);
  const pendingInput = useSessionStore((s) => s.pendingInput);
  const [showNoteName, setShowNoteName] = useState(false);

  const positions = useMemo<StaffPosition[]>(() => {
    if (status === 'feedback_correct') {
      return [
        [{ pitch: exercise.base, color: 'green' }],
        [{ pitch: exercise.target, color: 'green' }],
      ];
    }
    if (status === 'feedback_wrong' && lastAttempt) {
      const [playedBase, playedTarget] = lastAttempt.playedMidi;
      const basePos: StaffPosition = [{ pitch: exercise.base, color: 'black' }];
      if (playedBase !== pitchToMidi(exercise.base)) {
        basePos.push({ pitch: midiToPitch(playedBase), color: 'red' });
      }
      const targetPos: StaffPosition = [{ pitch: exercise.target, color: 'black' }];
      if (playedTarget !== pitchToMidi(exercise.target)) {
        targetPos.push({ pitch: midiToPitch(playedTarget), color: 'red' });
      }
      return [basePos, targetPos];
    }
    return [[{ pitch: exercise.base, color: 'black' }]];
  }, [exercise, status, lastAttempt]);

  return (
    <>
      <Staff positions={positions} />

      <div className="text-2xl font-medium">
        {intervalDisplayName(exercise.interval)}
        <span className="text-neutral-500 ml-2">{exercise.direction === 'down' ? '↓' : '↑'}</span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => setShowNoteName((v) => !v)}
          className="text-sm text-neutral-400 underline hover:text-neutral-200"
        >
          {showNoteName ? 'Hide' : 'Show'} note name
        </button>
        {showNoteName && (
          <div className="text-lg font-mono text-neutral-200">
            Base: {pitchDisplayName(exercise.base, true)}
          </div>
        )}
      </div>

      {status === 'prompt' && (
        <div className="text-neutral-500 text-sm">
          {pendingInput.length === 0 ? 'Play the base note…' : 'Now play the interval…'}
        </div>
      )}

      {status === 'feedback_correct' && <CorrectFeedback />}

      {status === 'feedback_wrong' && (
        <WrongFeedback>
          <div className="text-sm text-neutral-400">Correct notes in black, your notes in red.</div>
        </WrongFeedback>
      )}
    </>
  );
}
