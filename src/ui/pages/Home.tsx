import type { LessonType } from '../../session/store.ts';
import { useSessionStore } from '../../session/store.ts';
import { CHORD_SETS, DIRECTION_LABELS, INTERVAL_SET_LABELS } from '../../session/settings.ts';

export function Home() {
  const startSession = useSessionStore((s) => s.startSession);
  const viewStats = useSessionStore((s) => s.viewStats);
  const viewSettings = useSessionStore((s) => s.viewSettings);
  const config = useSessionStore((s) => s.config);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div>
        <h2 className="text-2xl font-semibold">Choose a lesson</h2>
        <p className="text-neutral-400 mt-1">{config.sessionLength} exercises per session.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 w-full max-w-xl">
        <LessonCard
          lesson="interval"
          title="Intervals"
          description="See a base note on the staff and an interval name. Play the base note, then the interval note."
          difficulty={`${INTERVAL_SET_LABELS[config.intervalSet]} · ${DIRECTION_LABELS[config.direction]}`}
          onStart={startSession}
        />
        <LessonCard
          lesson="chord"
          title="Chords"
          description="See a chord name. Play the chord in root position — any octave, root on the bottom."
          difficulty={CHORD_SETS[config.chordSet].label}
          onStart={startSession}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={viewStats}
          className="rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium px-5 py-2"
        >
          View stats
        </button>
        <button
          type="button"
          onClick={viewSettings}
          className="rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium px-5 py-2"
        >
          Settings
        </button>
      </div>
    </div>
  );
}

function LessonCard({
  lesson,
  title,
  description,
  difficulty,
  onStart,
}: {
  lesson: LessonType;
  title: string;
  description: string;
  difficulty: string;
  onStart: (lesson: LessonType) => void;
}) {
  return (
    <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-5 flex flex-col gap-3 text-left">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-neutral-400 flex-1">{description}</p>
      <div className="text-xs text-neutral-500">{difficulty}</div>
      <button
        type="button"
        onClick={() => onStart(lesson)}
        className="rounded-md bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold px-5 py-2"
      >
        Start {title.toLowerCase()}
      </button>
    </div>
  );
}
