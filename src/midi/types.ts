export type MidiNoteEvent =
  | { type: 'note_on'; note: number; velocity: number; time: number }
  | { type: 'note_off'; note: number; time: number };

export type MidiStatus = 'unsupported' | 'idle' | 'requesting' | 'denied' | 'ready';
