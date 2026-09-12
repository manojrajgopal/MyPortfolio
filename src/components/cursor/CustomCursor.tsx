'use client';

import { useEffect, useRef } from 'react';
import { useHasFinePointer } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { damp } from '@/lib/utils/lerp';
import styles from './CustomCursor.module.css';

/** Elements that make the cursor open up into a ring. */
const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, [tabindex]:not([tabindex="-1"])';

/**
 * A two-part cursor: a hard dot that tracks exactly, and a ring that trails
 * behind it and opens over anything interactive.
 *
 * Rendered only for precise pointers, and never when reduced motion is on —
 * the system cursor comes back in both cases.
 */
export function CustomCursor(): React.JSX.Element | null {
  const fine = useHasFinePointer();
  const reducedMotion = useReducedMotion();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  const enabled = fine && !reducedMotion;

  useEffect(() => {
    if (!enabled) return;

    document.documentElement.classList.add('has-custom-cursor');

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const trail = { x: target.x, y: target.y };
    let frame = 0;
    let last = performance.now();

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      if (dot.current) {
        dot.current.style.translate = `${event.clientX}px ${event.clientY}px`;
      }
    };

    const onOver = (event: PointerEvent) => {
      const node = event.target as Element | null;
      const active = Boolean(node?.closest?.(INTERACTIVE));
      ring.current?.setAttribute('data-active', String(active));
    };

    const onDown = () => ring.current?.setAttribute('data-pressed', 'true');
    const onUp = () => ring.current?.setAttribute('data-pressed', 'false');
    const onLeave = () => ring.current?.setAttribute('data-hidden', 'true');
    const onEnter = () => ring.current?.setAttribute('data-hidden', 'false');

    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      trail.x = damp(trail.x, target.x, 0.0000004, dt);
      trail.y = damp(trail.y, target.y, 0.0000004, dt);
      if (ring.current) ring.current.style.translate = `${trail.x}px ${trail.y}px`;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('pointerenter', onEnter);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('pointerenter', onEnter);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className={`${styles.layer} cursor-layer`} aria-hidden="true">
      <div ref={ring} className={styles.ring} data-active="false" data-pressed="false" />
      <div ref={dot} className={styles.dot} />
    </div>
  );
}
