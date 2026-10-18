import type { MidiStatus as MidiStatusType } from '../midi/types.ts';

type Props = {
  status: MidiStatusType;
  devices: string[];
  onRequest: () => void;
};

export function MidiStatus({ status, devices, onRequest }: Props) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-xs">
        <div className="text-neutral-500 uppercase tracking-wider">MIDI</div>
        <div className="text-sm">
          {status === 'ready' && <span className="text-green-400">{devices[0] ?? 'Ready'}</span>}
          {status === 'idle' && <span className="text-neutral-400">Not enabled</span>}
          {status === 'requesting' && <span className="text-amber-300">Requesting…</span>}
          {status === 'denied' && <span className="text-red-400">Denied</span>}
          {status === 'unsupported' && <span className="text-red-400">Unsupported</span>}
        </div>
      </div>
      {status === 'idle' && (
        <button
          type="button"
          onClick={onRequest}
          className="rounded-md bg-amber-500 hover:bg-amber-400 text-neutral-950 font-medium px-3 py-1 text-sm"
        >
          Enable
        </button>
      )}
    </div>
  );
}
