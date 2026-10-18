import { useEffect, useRef } from 'react';
import type { MidiNoteEvent } from './types.ts';

type Listener = (ev: MidiNoteEvent) => void;

const listeners = new Set<Listener>();

export function publishNote(ev: MidiNoteEvent): void {
  for (const l of listeners) l(ev);
}

export function useNotes(callback: Listener): void {
  const cbRef = useRef(callback);
  useEffect(() => {
    cbRef.current = callback;
  });
  useEffect(() => {
    const l: Listener = (ev) => cbRef.current(ev);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
}
