'use client';

import type { CSSProperties } from 'react';

interface BeatSequenceProps {
  readonly beats: readonly string[];
}

/**
 * The five verbs, as a sequence rather than a list.
 *
 * All five are present from the start as outlines; a fill sweeps across them
 * one at a time as the chapter plays, so the words read as beats in a cut
 * instead of items appearing on a page. Both layers come from the same
 * `--t`, so nothing here needs a scroll listener.
 */
export function BeatSequence({ beats }: BeatSequenceProps): React.JSX.Element {
  return (
    <p className="beats" aria-label={beats.join(', ')}>
      {beats.map((beat, index) => {
        // Each word owns a slice of the chapter, in order.
        const at = (index / beats.length) * 0.78;
        const style = { ['--beat-at' as string]: at } as CSSProperties;

        return (
          <span key={beat} className="beats__word" style={style} aria-hidden="true">
            <span className="beat">{beat}</span>
            <span className="beat beat--filled">{beat}</span>
          </span>
        );
      })}
    </p>
  );
}
