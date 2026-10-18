import { useSessionStore } from '../../session/store.ts';
import type { DirectionMode, IntervalSet } from '../../session/settings.ts';

const SESSION_LENGTHS = [5, 10, 15, 20, 25] as const;

type SegmentProps<T extends string | number> = {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
};

function Segmented<T extends string | number>({ value, options, onChange }: SegmentProps<T>) {
  return (
    <div className="inline-flex rounded-md bg-neutral-900 border border-neutral-800 p-1">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 text-sm rounded ${
              selected
                ? 'bg-amber-500 text-neutral-950 font-semibold'
                : 'text-neutral-300 hover:text-neutral-100'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
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

      <div className="flex flex-col gap-5">
        <Row label="Session length" hint="Number of exercises per session">
          <Segmented
            value={config.sessionLength}
            options={SESSION_LENGTHS.map((n) => ({ value: n, label: String(n) }))}
            onChange={(v) => updateConfig({ sessionLength: v })}
          />
        </Row>

        <Row label="Interval set" hint="Which intervals can appear">
          <Segmented<IntervalSet>
            value={config.intervalSet}
            options={[
              { value: 'basic', label: 'Basic 7' },
              { value: 'all', label: 'All simple' },
            ]}
            onChange={(v) => updateConfig({ intervalSet: v })}
          />
        </Row>

        <Row label="Direction" hint="Ascending plays up, descending plays down from the base">
          <Segmented<DirectionMode>
            value={config.direction}
            options={[
              { value: 'up', label: 'Ascending' },
              { value: 'down', label: 'Descending' },
              { value: 'both', label: 'Both' },
            ]}
            onChange={(v) => updateConfig({ direction: v })}
          />
        </Row>
      </div>

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
