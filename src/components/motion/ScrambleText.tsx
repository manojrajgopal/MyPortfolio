'use client';

import { useEffect, useRef } from 'react';
import { useSceneScope } from '@/components/experience/SceneContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { clamp } from '@/lib/utils/clamp';

interface ScrambleTextProps {
  readonly children: string;
  /** Where the resolve begins inside the chapter, 0–1. */
  readonly from?: number;
  readonly span?: number;
  readonly className?: string;
}

/** Glyphs the scramble draws from — technical, never decorative. */
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>[]{}=+*#%$&';

/**
 * Metadata that resolves character by character as the chapter arrives.
 *
 * Reserved for the small technical voice of the interface — chapter names,
 * labels, counts — where a line of settling glyphs reads as a system coming
 * into focus. Anything longer than a few words is a paragraph, and paragraphs
 * are never scrambled.
 *
 * The text is written straight to the DOM each frame, so this never triggers
 * a React render, and the real string stays in the accessibility tree.
 */
export function ScrambleText({
  children,
  from = 0.02,
  span = 0.26,
  className,
}: ScrambleTextProps): React.JSX.Element {
  const scope = useSceneScope();
  const reducedMotion = useReducedMotion();
  const node = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = node.current;
    if (!element) return;

    if (reducedMotion) {
      element.textContent = children;
      return;
    }

    const characters = Array.from(children);
    // A fixed seed per character keeps the noise stable while scrubbing.
    const seeds = characters.map(() => Math.floor(Math.random() * GLYPHS.length));
    let frame = 0;
    let previous = '';

    const tick = () => {
      frame = requestAnimationFrame(tick);

      const local = scope.read();
      const progress = clamp((local - from) / span);
      const resolved = progress * characters.length;
      const churn = Math.floor(performance.now() / 45);

      let output = '';
      for (let i = 0; i < characters.length; i += 1) {
        const character = characters[i]!;
        if (character === ' ' || i < resolved - 1) {
          output += character;
        } else if (i < resolved + 3) {
          output += GLYPHS[(seeds[i]! + churn + i) % GLYPHS.length];
        } else {
          output += ' ';
        }
      }

      if (output !== previous) {
        previous = output;
        element.textContent = output;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [children, from, reducedMotion, scope, span]);

  return (
    <>
      <span ref={node} className={className} aria-hidden="true" />
      <span className="visually-hidden">{children}</span>
    </>
  );
}
