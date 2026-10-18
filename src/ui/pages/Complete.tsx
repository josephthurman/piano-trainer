import { selectCorrectCount, useSessionStore } from '../../session/store.ts';

export function Complete() {
  const correctCount = useSessionStore(selectCorrectCount);
  const totalCount = useSessionStore((s) => s.config.sessionLength);
  const reset = useSessionStore((s) => s.reset);
  const startSession = useSessionStore((s) => s.startSession);
  const percent = Math.round((correctCount / totalCount) * 100);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <h2 className="text-2xl font-semibold">Session complete</h2>
      <div className="text-6xl font-bold">
        {correctCount}
        <span className="text-neutral-500 text-4xl font-normal"> / {totalCount}</span>
      </div>
      <div className="text-xl text-neutral-400">{percent}%</div>
      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={startSession}
          className="rounded-md bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold px-6 py-3"
        >
          Start another
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium px-6 py-3"
        >
          Home
        </button>
      </div>
    </div>
  );
}
