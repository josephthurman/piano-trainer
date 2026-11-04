import { useEffect, useMemo } from 'react';
import { midiPitchClass, pitchClassDisplayName, pitchDisplayName } from '../../music/pitch.ts';
import type { Chord, ChordEvaluation } from '../../music/chord.ts';
import {
  chordDisplayName,
  chordVoicingNear,
  evaluateChord,
  isChordAttemptReady,
  majorKeyDisplayName,
  romanNumeral,
  spellPlayedNote,
} from '../../music/chord.ts';
import type { ChordExercise } from '../../session/generator.ts';
import { selectLastAttempt, useSessionStore } from '../../session/store.ts';
import { Staff, type StaffPosition } from '../Staff.tsx';
import { CorrectFeedback, WrongFeedback } from './Feedback.tsx';

/**
 * A chord arrives as several MIDI note-ons a few milliseconds apart. Once enough
 * distinct notes are in, wait this long with no new note before grading, so a
 * slightly late bass note or a doubled octave still counts as part of the chord.
 */
const CHORD_SETTLE_MS = 250;

function sortedUnique(midi: readonly number[]): number[] {
  return [...new Set(midi)].sort((a, b) => a - b);
}

function explain(chord: Chord, evaluation: Exclude<ChordEvaluation, { correct: true }>): string[] {
  if (evaluation.reason === 'not_root_position') {
    return [
      `Right notes, but ${pitchClassDisplayName(chord.root)} needs to be the lowest note (root position).`,
    ];
  }
  const lines: string[] = [];
  if (evaluation.extra.length > 0) {
    const byPitchClass = new Map(evaluation.extra.map((m) => [midiPitchClass(m), m]));
    const names = [...byPitchClass.values()].map((m) => pitchClassDisplayName(spellPlayedNote(chord, m)));
    lines.push(`Not in ${chordDisplayName(chord)}: ${names.join(', ')}`);
  }
  if (evaluation.missing.length > 0) {
    lines.push(`Missing: ${evaluation.missing.map(pitchClassDisplayName).join(', ')}`);
  }
  return lines;
}

export function ChordExerciseView({ exercise }: { exercise: ChordExercise }) {
  const status = useSessionStore((s) => s.status);
  const lastAttempt = useSessionStore(selectLastAttempt);
  const pendingInput = useSessionStore((s) => s.pendingInput);
  const submitChordAttempt = useSessionStore((s) => s.submitChordAttempt);
  const { chord } = exercise;

  // Every new note changes pendingInput, which re-runs this effect; React runs the
  // previous effect's cleanup first, cancelling its timer. So grading fires
  // CHORD_SETTLE_MS after the *last* note — a debounce.
  useEffect(() => {
    if (status !== 'prompt' || !isChordAttemptReady(chord, pendingInput)) return;
    const id = window.setTimeout(submitChordAttempt, CHORD_SETTLE_MS);
    return () => window.clearTimeout(id);
  }, [status, chord, pendingInput, submitChordAttempt]);

  const inFeedback = status === 'feedback_correct' || status === 'feedback_wrong';
  const played = useMemo(
    () => (inFeedback && lastAttempt ? sortedUnique(lastAttempt.playedMidi) : []),
    [inFeedback, lastAttempt],
  );
  const evaluation = useMemo(
    () => (status === 'feedback_wrong' ? evaluateChord(chord, played) : null),
    [status, chord, played],
  );

  const positions = useMemo<StaffPosition[]>(() => {
    if (status === 'feedback_correct') {
      return [played.map((m) => ({ pitch: spellPlayedNote(chord, m), color: 'green' }))];
    }
    if (evaluation && !evaluation.correct) {
      const isMistake = (m: number) =>
        evaluation.reason === 'wrong_notes' ? evaluation.extra.includes(m) : m === evaluation.bassMidi;
      const yours: StaffPosition = played.map((m) => ({
        pitch: spellPlayedNote(chord, m),
        color: isMistake(m) ? 'red' : 'black',
      }));
      const answer: StaffPosition = chordVoicingNear(chord, played[0] ?? 60).map((pitch) => ({
        pitch,
        color: 'green',
      }));
      return [yours, answer];
    }
    return [];
  }, [status, evaluation, played, chord]);

  const heard = sortedUnique(pendingInput)
    .map((m) => pitchDisplayName(spellPlayedNote(chord, m), true))
    .join(' ');

  return (
    <>
      <Staff positions={positions} />

      <div className="flex flex-col items-center gap-1">
        <div className="text-2xl font-medium">{chordDisplayName(chord)}</div>
        <div className="text-sm text-neutral-500">
          {romanNumeral(exercise.degree, chord.quality)} in {majorKeyDisplayName(exercise.tonic)}
        </div>
      </div>

      {status === 'prompt' && (
        <div className="text-neutral-500 text-sm">
          {pendingInput.length === 0 ? (
            'Play the chord in root position, any octave…'
          ) : (
            <>
              Heard: <span className="font-mono text-neutral-300">{heard}</span>
            </>
          )}
        </div>
      )}

      {status === 'feedback_correct' && <CorrectFeedback />}

      {evaluation && !evaluation.correct && (
        <WrongFeedback>
          {explain(chord, evaluation).map((line) => (
            <div key={line} className="text-neutral-200">
              {line}
            </div>
          ))}
          <div className="text-sm text-neutral-400">
            Left: what you played, wrong notes in red. Right: the correct chord.
          </div>
        </WrongFeedback>
      )}
    </>
  );
}
