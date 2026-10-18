import { useSessionStore } from '../../session/store.ts';

export function Home() {
  const startSession = useSessionStore((s) => s.startSession);
  const sessionLength = useSessionStore((s) => s.config.sessionLength);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <h2 className="text-2xl font-semibold">Interval Trainer</h2>
      <p className="text-neutral-400 max-w-md">
        Each exercise shows a base note on the staff and names an interval. Play the base note on
        your piano, then the correct interval note. {sessionLength} exercises per session.
      </p>
      <button
        type="button"
        onClick={startSession}
        className="rounded-md bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold px-6 py-3 mt-4"
      >
        Start session
      </button>
    </div>
  );
}
