'use client';

import { useEffect, useRef } from 'react';
import { useSceneScope } from '@/components/experience/SceneContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { clamp } from '@/lib/utils/clamp';
import { cn } from '@/lib/utils/cn';

interface CountUpProps {
  readonly value: number;
  readonly suffix?: string;
  readonly prefix?: string;
  readonly decimals?: number;
  /** Where the count begins inside the chapter, 0–1. */
  readonly from?: number;
  readonly span?: number;
  readonly className?: string;
}

/**
 * A figure that counts up to its real value as the camera reaches it.
 *
 * Tied to scroll rather than to a timer, so the number tracks the scrollbar
 * both ways and always lands on exactly the measured figure — the 85% here is
 * the same 85% the arc in the world behind it is drawn to.
 */
export function CountUp({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  from = 0.12,
  span = 0.4,
  className,
}: CountUpProps): React.JSX.Element {
  const scope = useSceneScope();
  const reducedMotion = useReducedMotion();
  const node = useRef<HTMLSpanElement>(null);
  const final = `${prefix}${value.toFixed(decimals)}${suffix}`;

  useEffect(() => {
    const element = node.current;
    if (!element) return;

    if (reducedMotion) {
      element.textContent = final;
      return;
    }

    let frame = 0;
    let previous = '';

    const tick = () => {
      frame = requestAnimationFrame(tick);
      const local = scope.read();
      const progress = clamp((local - from) / span);
      // Ease out so the last few units settle rather than snap.
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = `${prefix}${(value * eased).toFixed(decimals)}${suffix}`;
      if (next !== previous) {
        previous = next;
        element.textContent = next;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [decimals, final, from, prefix, reducedMotion, scope, span, suffix, value]);

  return (
    <>
      <span ref={node} className={cn('counter', className)} aria-hidden="true">
        {prefix}
        {(0).toFixed(decimals)}
        {suffix}
      </span>
      <span className="visually-hidden">{final}</span>
    </>
  );
}
