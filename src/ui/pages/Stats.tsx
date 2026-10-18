import { useMemo } from 'react';
import { pitchDisplayName } from '../../music/pitch.ts';
import { intervalDisplayName } from '../../music/interval.ts';
import { useSessionStore } from '../../session/store.ts';
import { loadStoredData } from '../../session/storage.ts';
import {
  aggregate,
  baseKey,
  cellAccuracy,
  intervalKey,
  type StatCell,
} from '../../session/stats.ts';

function pct(c: StatCell): string {
  if (c.attempts === 0) return '—';
  return `${Math.round(cellAccuracy(c) * 100)}%`;
}

function cellColor(c: StatCell): string {
  if (c.attempts === 0) return 'bg-neutral-900 text-neutral-600';
  const acc = cellAccuracy(c);
  if (acc >= 0.9) return 'bg-emerald-700/60 text-emerald-100';
  if (acc >= 0.7) return 'bg-lime-700/50 text-lime-100';
  if (acc >= 0.5) return 'bg-amber-700/50 text-amber-100';
  return 'bg-red-800/60 text-red-100';
}

export function Stats() {
  const reset = useSessionStore((s) => s.reset);

  const { overall, byInterval, byBaseAndInterval, seenIntervals, seenBases } = useMemo(() => {
    const data = loadStoredData();
    return aggregate(data.attempts);
  }, []);

  const hasData = overall.attempts > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Stats</h2>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium px-4 py-2 text-sm"
        >
          Home
        </button>
      </div>

      {!hasData && (
        <div className="text-neutral-400 text-center py-12">
          No attempts yet. Play a session and come back.
        </div>
      )}

      {hasData && (
        <>
          <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-5 flex items-baseline gap-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-neutral-500">Overall</div>
              <div className="text-4xl font-bold">{pct(overall)}</div>
            </div>
            <div className="text-neutral-400">
              <span className="text-neutral-200 font-medium">{overall.correct}</span> /{' '}
              {overall.attempts} correct
            </div>
          </div>

          <section>
            <h3 className="text-sm uppercase tracking-wider text-neutral-500 mb-2">
              By interval
            </h3>
            <div className="rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-neutral-900 text-neutral-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Interval</th>
                    <th className="text-right px-4 py-2 font-medium">Attempts</th>
                    <th className="text-right px-4 py-2 font-medium">Correct</th>
                    <th className="text-right px-4 py-2 font-medium">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {seenIntervals.map((iv) => {
                    const cell = byInterval.get(intervalKey(iv)) ?? { attempts: 0, correct: 0 };
                    return (
                      <tr key={intervalKey(iv)} className="border-t border-neutral-800">
                        <td className="px-4 py-2">{intervalDisplayName(iv)}</td>
                        <td className="px-4 py-2 text-right text-neutral-400">{cell.attempts}</td>
                        <td className="px-4 py-2 text-right text-neutral-400">{cell.correct}</td>
                        <td className="px-4 py-2 text-right font-medium">{pct(cell)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="text-sm uppercase tracking-wider text-neutral-500 mb-2">
              By base note × interval
            </h3>
            <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-3 overflow-x-auto">
              <table className="text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-neutral-900 px-2 py-1 text-neutral-500 font-medium text-left">
                      Base
                    </th>
                    {seenIntervals.map((iv) => (
                      <th
                        key={intervalKey(iv)}
                        className="px-2 py-1 text-neutral-400 font-medium text-center min-w-[48px]"
                      >
                        {intervalKey(iv)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {seenBases.map((base) => (
                    <tr key={baseKey(base)}>
                      <td className="sticky left-0 bg-neutral-900 px-2 py-1 text-neutral-200 font-mono">
                        {pitchDisplayName(base)}
                      </td>
                      {seenIntervals.map((iv) => {
                        const cell = byBaseAndInterval.get(
                          `${baseKey(base)}|${intervalKey(iv)}`,
                        ) ?? { attempts: 0, correct: 0 };
                        return (
                          <td
                            key={intervalKey(iv)}
                            className={`px-2 py-1 text-center ${cellColor(cell)}`}
                            title={`${cell.correct}/${cell.attempts}`}
                          >
                            {pct(cell)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-neutral-500 mt-2">
              Octaves aggregated. Hover a cell to see correct/attempts.
            </div>
          </section>
        </>
      )}
    </div>
  );
}
