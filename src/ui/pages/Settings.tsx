import { useSessionStore } from '../../session/store.ts';
import type { ChordSet, DirectionMode, IntervalSet } from '../../session/settings.ts';
import { CHORD_SETS, DIRECTION_LABELS, INTERVAL_SET_LABELS } from '../../session/settings.ts';
import { Segmented } from '../Segmented.tsx';

const SESSION_LENGTHS = [5, 10, 15, 20, 25] as const;

function optionsFrom<T extends string>(labels: Record<T, string>): { value: T; label: string }[] {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}

export function Settings() {
  const config = useSessionStore((s) => s.config);
  const updateConfig = useSessionStore((s) => s.updateConfig);
  const reset = useSessionStore((s) => s.reset);
  const exportData = useSessionStore((s) => s.exportData);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Settings</h2>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium px-4 py-2 text-sm"
        >
          Home
        </button>
      </div>

      <Row label="Session length" hint="Number of exercises per session">
        <Segmented
          value={config.sessionLength}
          options={SESSION_LENGTHS.map((n) => ({ value: n, label: String(n) }))}
          onChange={(v) => updateConfig({ sessionLength: v })}
        />
      </Row>

      <Section title="Intervals">
        <Row label="Interval set" hint="Which intervals can appear">
          <Segmented<IntervalSet>
            value={config.intervalSet}
            options={optionsFrom(INTERVAL_SET_LABELS)}
            onChange={(v) => updateConfig({ intervalSet: v })}
          />
        </Row>

        <Row label="Direction" hint="Ascending plays up, descending plays down from the base">
          <Segmented<DirectionMode>
            value={config.direction}
            options={optionsFrom(DIRECTION_LABELS)}
            onChange={(v) => updateConfig({ direction: v })}
          />
        </Row>
      </Section>

      <Section title="Chords">
        <Row label="Chord set" hint="Which keys and chords can appear">
          <Segmented<ChordSet>
            value={config.chordSet}
            options={(Object.keys(CHORD_SETS) as ChordSet[]).map((id) => ({
              value: id,
              label: CHORD_SETS[id].label,
            }))}
            onChange={(v) => updateConfig({ chordSet: v })}
          />
        </Row>
      </Section>

      <div className="border-t border-neutral-800 pt-5 flex flex-col gap-2">
        <div className="text-sm text-neutral-500">Data</div>
        <div>
          <button
            type="button"
            onClick={exportData}
            className="rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium px-4 py-2 text-sm"
          >
            Export data as JSON
          </button>
        </div>
        <div className="text-xs text-neutral-500">
          Downloads your full attempt history. Settings are not included.
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <div className="text-sm font-medium text-neutral-200">{label}</div>
        {hint && <div className="text-xs text-neutral-500">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-neutral-800 pt-5 flex flex-col gap-5">
      <h3 className="text-xs uppercase tracking-wider text-neutral-500">{title}</h3>
      {children}
    </section>
  );
}
