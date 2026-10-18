import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNotes } from '../../midi/noteStream.ts';
import type { MidiNoteEvent } from '../../midi/types.ts';
import { midiToPitch, pitchDisplayName, pitchToMidi } from '../../music/pitch.ts';
import { intervalDisplayName } from '../../music/interval.ts';
import { Staff, type StaffPosition } from '../Staff.tsx';
import {
  selectCorrectCount,
  selectCurrentExercise,
  selectLastAttempt,
  useSessionStore,
} from '../../session/store.ts';

export function Session() {
  const status = useSessionStore((s) => s.status);
  const current = useSessionStore(selectCurrentExercise);
  const lastAttempt = useSessionStore(selectLastAttempt);
  const correctCount = useSessionStore(selectCorrectCount);
  const totalCount = useSessionStore((s) => s.config.sessionLength);
  const currentIndex = useSessionStore((s) => s.currentIndex);
  const pendingInput = useSessionStore((s) => s.pendingInput);
  const recordNoteDown = useSessionStore((s) => s.recordNoteDown);
  const advance = useSessionStore((s) => s.advance);
  const [showNoteName, setShowNoteName] = useState(false);

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

  const positions = useMemo<StaffPosition[]>(() => {
    if (!current) return [];
    if (status === 'feedback_correct') {
      return [
        [{ pitch: current.base, color: 'green' }],
        [{ pitch: current.target, color: 'green' }],
      ];
    }
    if (status === 'feedback_wrong' && lastAttempt) {
      const [playedBase, playedTarget] = lastAttempt.playedMidi;
      const basePos: StaffPosition = [{ pitch: current.base, color: 'black' }];
      if (playedBase !== pitchToMidi(current.base)) {
        basePos.push({ pitch: midiToPitch(playedBase), color: 'red' });
      }
      const targetPos: StaffPosition = [{ pitch: current.target, color: 'black' }];
      if (playedTarget !== pitchToMidi(current.target)) {
        targetPos.push({ pitch: midiToPitch(playedTarget), color: 'red' });
      }
      return [basePos, targetPos];
    }
    return [[{ pitch: current.base, color: 'black' }]];
  }, [current, status, lastAttempt]);

  if (!current) return null;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="w-full flex items-center justify-between text-sm">
        <span className="text-neutral-400">
          Exercise <span className="text-neutral-200 font-medium">{currentIndex + 1}</span> / {totalCount}
        </span>
        <span className="text-green-400">✓ {correctCount}</span>
      </div>

      <Staff positions={positions} />

      <div className="text-2xl font-medium">
        {intervalDisplayName(current.interval)}
        <span className="text-neutral-500 ml-2">↑</span>
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
            Base: {pitchDisplayName(current.base, true)}
          </div>
        )}
      </div>

      {status === 'prompt' && (
        <div className="text-neutral-500 text-sm">
          {pendingInput.length === 0 ? 'Play the base note…' : 'Now play the interval…'}
        </div>
      )}

      {status === 'feedback_correct' && (
        <div className="text-green-400 font-semibold text-xl flex items-center gap-2">
          <span aria-hidden>✓</span>
          <span>Correct</span>
        </div>
      )}

      {status === 'feedback_wrong' && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-red-400 font-medium">Incorrect</div>
          <div className="text-sm text-neutral-400">Correct notes in black, your notes in red.</div>
          <button
            type="button"
            onClick={advance}
            className="rounded-md bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold px-6 py-2 mt-2"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
