import { useMidi } from './midi/useMidi.ts';
import { VirtualKeyboard } from './midi/VirtualKeyboard.tsx';
import { MidiStatus } from './ui/MidiStatus.tsx';
import { Home } from './ui/pages/Home.tsx';
import { Session } from './ui/pages/Session.tsx';
import { Complete } from './ui/pages/Complete.tsx';
import { Stats } from './ui/pages/Stats.tsx';
import { Settings } from './ui/pages/Settings.tsx';
import { useSessionStore } from './session/store.ts';

export default function App() {
  const sessionStatus = useSessionStore((s) => s.status);
  const { status: midiStatus, devices, request } = useMidi();

  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-100 flex flex-col max-w-3xl mx-auto">
      <header className="p-4 border-b border-neutral-800 flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold tracking-tight">Piano Trainer</h1>
        <MidiStatus status={midiStatus} devices={devices} onRequest={() => void request()} />
      </header>

      <main className="flex-1 p-6">
        {sessionStatus === 'idle' && <Home />}
        {(sessionStatus === 'prompt' ||
          sessionStatus === 'feedback_correct' ||
          sessionStatus === 'feedback_wrong') && <Session />}
        {sessionStatus === 'complete' && <Complete />}
        {sessionStatus === 'stats' && <Stats />}
        {sessionStatus === 'settings' && <Settings />}
      </main>

      <footer className="p-4 border-t border-neutral-800">
        <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
          Virtual keyboard (C3–C5)
        </div>
        <VirtualKeyboard startMidi={48} endMidi={72} />
      </footer>
    </div>
  );
}
