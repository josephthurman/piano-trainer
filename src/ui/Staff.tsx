import { useEffect, useRef } from 'react';
import {
  Accidental,
  Formatter,
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

function clefForPosition(position: StaffPosition): 'treble' | 'bass' {
  const minMidi = Math.min(...position.map((sp) => pitchToMidi(sp.pitch)));
  return minMidi >= 60 ? 'treble' : 'bass';
}

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

    const trebleChords: StaveNote[] = [];
    const bassChords: StaveNote[] = [];
    for (const pos of positions) {
      if (pos.length === 0) continue;
      const clef = clefForPosition(pos);
      const chord = makeChord(pos, clef);
      if (clef === 'treble') trebleChords.push(chord);
      else bassChords.push(chord);
    }

    let trebleVoice: Voice | null = null;
    let bassVoice: Voice | null = null;
    if (trebleChords.length > 0) {
      trebleVoice = new Voice({ numBeats: trebleChords.length * 4, beatValue: 4 });
      trebleVoice.addTickables(trebleChords);
    }
    if (bassChords.length > 0) {
      bassVoice = new Voice({ numBeats: bassChords.length * 4, beatValue: 4 });
      bassVoice.addTickables(bassChords);
    }

    const voices: Voice[] = [];
    if (trebleVoice) voices.push(trebleVoice);
    if (bassVoice) voices.push(bassVoice);

    if (voices.length > 0) {
      const formatter = new Formatter();
      voices.forEach((v) => formatter.joinVoices([v]));
      formatter.format(voices, staveWidth - 80);
      if (trebleVoice) trebleVoice.draw(ctx, treble);
      if (bassVoice) bassVoice.draw(ctx, bass);
    }

    return () => {
      container.innerHTML = '';
    };
  }, [positions, width, height]);

  return <div ref={containerRef} className="inline-block bg-white rounded" />;
}
