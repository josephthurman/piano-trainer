import { useCallback, useRef, useState } from 'react';
import { publishNote } from './noteStream.ts';
import type { MidiStatus } from './types.ts';

function parseAndPublish(event: MIDIMessageEvent): void {
  const data = event.data;
  if (!data || data.length < 2) return;
  const status = data[0] & 0xf0;
  const note = data[1];
  const velocity = data[2] ?? 0;
  if (status === 0x90 && velocity > 0) {
    publishNote({ type: 'note_on', note, velocity, time: event.timeStamp });
  } else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
    publishNote({ type: 'note_off', note, time: event.timeStamp });
  }
}

export function useMidi(): {
  status: MidiStatus;
  devices: string[];
  request: () => Promise<void>;
} {
  const [status, setStatus] = useState<MidiStatus>(() =>
    typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator ? 'idle' : 'unsupported',
  );
  const [devices, setDevices] = useState<string[]>([]);
  const accessRef = useRef<MIDIAccess | null>(null);

  const refreshDevices = useCallback((access: MIDIAccess) => {
    const names: string[] = [];
    access.inputs.forEach((input) => {
      if (input.state === 'connected') names.push(input.name ?? 'Unknown MIDI device');
    });
    setDevices(names);
  }, []);

  const bindInputs = useCallback((access: MIDIAccess) => {
    access.inputs.forEach((input) => {
      input.onmidimessage = parseAndPublish;
    });
  }, []);

  const request = useCallback(async () => {
    if (status === 'unsupported') return;
    setStatus('requesting');
    try {
      const access = await navigator.requestMIDIAccess({ sysex: false });
      accessRef.current = access;
      refreshDevices(access);
      bindInputs(access);
      access.onstatechange = () => {
        refreshDevices(access);
        bindInputs(access);
      };
      setStatus('ready');
    } catch {
      setStatus('denied');
    }
  }, [status, refreshDevices, bindInputs]);

  return { status, devices, request };
}
