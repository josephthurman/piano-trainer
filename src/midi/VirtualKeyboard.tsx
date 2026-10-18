import { useCallback, useMemo, useState } from 'react';
import { publishNote } from './noteStream.ts';

const WHITE_SEMITONES = new Set([0, 2, 4, 5, 7, 9, 11]);

function isWhite(midi: number): boolean {
  return WHITE_SEMITONES.has(((midi % 12) + 12) % 12);
}

type Props = {
  startMidi?: number;
  endMidi?: number;
};

export function VirtualKeyboard({ startMidi = 48, endMidi = 72 }: Props) {
  const [pressed, setPressed] = useState<Set<number>>(() => new Set());

  const { allNotes, whites, whiteIndexOf, whiteCount } = useMemo(() => {
    const allNotes: number[] = [];
    for (let m = startMidi; m <= endMidi; m++) allNotes.push(m);
    const whites = allNotes.filter(isWhite);
    const whiteIndexOf = new Map<number, number>();
    whites.forEach((m, i) => whiteIndexOf.set(m, i));
    return { allNotes, whites, whiteIndexOf, whiteCount: whites.length };
  }, [startMidi, endMidi]);

  const press = useCallback((midi: number) => {
    setPressed((prev) => {
      if (prev.has(midi)) return prev;
      const next = new Set(prev);
      next.add(midi);
      return next;
    });
    publishNote({ type: 'note_on', note: midi, velocity: 100, time: performance.now() });
  }, []);

  const release = useCallback((midi: number) => {
    setPressed((prev) => {
      if (!prev.has(midi)) return prev;
      const next = new Set(prev);
      next.delete(midi);
      return next;
    });
    publishNote({ type: 'note_off', note: midi, time: performance.now() });
  }, []);

  const whiteWidth = 100 / whiteCount;
  const blackWidth = whiteWidth * 0.6;
  const blackOffset = whiteWidth * 0.3;

  return (
    <div
      className="relative w-full select-none"
      style={{ height: '160px', touchAction: 'none' }}
    >
      <div className="absolute inset-0 flex">
        {whites.map((m) => (
          <button
            key={m}
            type="button"
            aria-label={`MIDI ${m}`}
            className={`flex-1 border border-neutral-300 rounded-b-md transition-colors ${
              pressed.has(m) ? 'bg-amber-200' : 'bg-white hover:bg-neutral-50'
            }`}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              press(m);
            }}
            onPointerUp={() => release(m)}
            onPointerCancel={() => release(m)}
            onPointerLeave={(e) => {
              if (e.buttons > 0) release(m);
            }}
          />
        ))}
      </div>
      {allNotes
        .filter((m) => !isWhite(m))
        .map((m) => {
          const prevWhiteIndex = whiteIndexOf.get(m - 1);
          if (prevWhiteIndex === undefined) return null;
          const left = (prevWhiteIndex + 1) * whiteWidth - blackOffset;
          return (
            <button
              key={m}
              type="button"
              aria-label={`MIDI ${m}`}
              className={`absolute top-0 rounded-b-md z-10 transition-colors ${
                pressed.has(m) ? 'bg-amber-700' : 'bg-neutral-900 hover:bg-neutral-800'
              }`}
              style={{
                left: `${left}%`,
                width: `${blackWidth}%`,
                height: '60%',
              }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                press(m);
              }}
              onPointerUp={() => release(m)}
              onPointerCancel={() => release(m)}
              onPointerLeave={(e) => {
                if (e.buttons > 0) release(m);
              }}
            />
          );
        })}
    </div>
  );
}
