import type { ReactNode } from 'react';
import { useSessionStore } from '../../session/store.ts';

export function CorrectFeedback() {
  return (
    <div className="text-green-400 font-semibold text-xl flex items-center gap-2">
      <span aria-hidden>✓</span>
      <span>Correct</span>
    </div>
  );
}

export function WrongFeedback({ children }: { children?: ReactNode }) {
  const advance = useSessionStore((s) => s.advance);
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="text-red-400 font-medium">Incorrect</div>
      {children}
      <button
        type="button"
        onClick={advance}
        className="rounded-md bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold px-6 py-2 mt-2"
      >
        Next
      </button>
    </div>
  );
}
