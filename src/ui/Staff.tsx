import { useEffect, useRef } from 'react';
import {
  Accidental,
  Formatter,
  GhostNote,
  Renderer,
  Stave,
  StaveConnector,
  StaveNote,
  Voice,
} from 'vexflow';
import type { Pitch } from '../music/pitch.ts';
import { pitchToMidi } from '../music/pitch.ts';

export type NoteColor = 'black' | 'red' | 'green' | 'gray';

export type StyledPitch = {
  pitch: Pitch;
  color?: NoteColor;
};

export type StaffPosition = StyledPitch[];

type Props = {
  positions: StaffPosition[];
  width?: number;
  height?: number;
};

const COLOR_MAP: Record<NoteColor, string> = {
  black: '#111111',
  red: '#dc2626',
  green: '#16a34a',
  gray: '#737373',
};

function pitchToVexKey(p: Pitch): string {
  const letter = p.letter.toLowerCase();
  const acc = p.accidental === 'n' ? '' : p.accidental;
  return `${letter}${acc}/${p.octave}`;
}

const MIDDLE_C = 60;

function makeChord(position: StaffPosition, clef: 'treble' | 'bass'): StaveNote {
  const sorted = [...position].sort((a, b) => pitchToMidi(a.pitch) - pitchToMidi(b.pitch));
  const keys = sorted.map((sp) => pitchToVexKey(sp.pitch));
  const note = new StaveNote({ keys, duration: 'w', clef });
  sorted.forEach((sp, i) => {
    if (sp.pitch.accidental !== 'n') {
      note.addModifier(new Accidental(sp.pitch.accidental), i);
    }
    const color = COLOR_MAP[sp.color ?? 'black'];
    note.setKeyStyle(i, { fillStyle: color, strokeStyle: color });
  });
  return note;
}

export function Staff({ positions, width = 440, height = 220 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const ctx = renderer.getContext();

    const staveX = 30;
    const staveWidth = width - staveX - 15;
    const trebleY = 10;
    const bassY = height / 2 + 10;

    const treble = new Stave(staveX, trebleY, staveWidth);
    treble.addClef('treble').setContext(ctx).draw();

    const bass = new Stave(staveX, bassY, staveWidth);
    bass.addClef('bass').setContext(ctx).draw();

    new StaveConnector(treble, bass).setType('brace').setContext(ctx).draw();
    new StaveConnector(treble, bass).setType('singleLeft').setContext(ctx).draw();
    new StaveConnector(treble, bass).setType('singleRight').setContext(ctx).draw();

    // Each position is one column. Notes from middle C up go on the treble staff,
    // the rest on the bass staff; a staff with nothing in a column gets an invisible
    // ghost note so both voices have the same number of beats and columns line up.
    const trebleNotes: (StaveNote | GhostNote)[] = [];
    const bassNotes: (StaveNote | GhostNote)[] = [];
    for (const pos of positions) {
      if (pos.length === 0) continue;
      const upper = pos.filter((sp) => pitchToMidi(sp.pitch) >= MIDDLE_C);
      const lower = pos.filter((sp) => pitchToMidi(sp.pitch) < MIDDLE_C);
      trebleNotes.push(upper.length > 0 ? makeChord(upper, 'treble') : new GhostNote({ duration: 'w' }));
      bassNotes.push(lower.length > 0 ? makeChord(lower, 'bass') : new GhostNote({ duration: 'w' }));
    }

    if (trebleNotes.length > 0) {
      const trebleVoice = new Voice({ numBeats: trebleNotes.length * 4, beatValue: 4 });
      trebleVoice.addTickables(trebleNotes);
      const bassVoice = new Voice({ numBeats: bassNotes.length * 4, beatValue: 4 });
      bassVoice.addTickables(bassNotes);

      const formatter = new Formatter();
      formatter.joinVoices([trebleVoice]);
      formatter.joinVoices([bassVoice]);
      formatter.format([trebleVoice, bassVoice], staveWidth - 80);
      trebleVoice.draw(ctx, treble);
      bassVoice.draw(ctx, bass);
    }

    return () => {
      container.innerHTML = '';
    };
  }, [positions, width, height]);

  return <div ref={containerRef} className="inline-block bg-white rounded" />;
}
