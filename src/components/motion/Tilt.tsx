'use client';

import { useCallback, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { useHasFinePointer } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface TiltProps {
  readonly children: ReactNode;
  /** Maximum rotation in degrees on each axis. */
  readonly max?: number;
  /** How far the surface lifts toward the viewer, in px. */
  readonly lift?: number;
  readonly className?: string;
}

/**
 * Real perspective on a surface, plus a specular sheen that tracks the
 * cursor. Writes CSS custom properties rather than re-rendering.
 */
export function Tilt({ children, max = 7, lift = 18, className }: TiltProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useHasFinePointer();
  const reducedMotion = useReducedMotion();
  const enabled = fine && !reducedMotion;

  const onMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const node = ref.current;
      if (!node || !enabled) return;
      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;

      node.style.setProperty('--ry', `${(px - 0.5) * max * 2}deg`);
      node.style.setProperty('--rx', `${(0.5 - py) * max * 2}deg`);
      node.style.setProperty('--lift', `${lift}px`);
      node.style.setProperty('--mx', `${px * 100}%`);
      node.style.setProperty('--my', `${py * 100}%`);
    },
    [enabled, lift, max],
  );

  const reset = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty('--rx', '0deg');
    node.style.setProperty('--ry', '0deg');
    node.style.setProperty('--lift', '0px');
  }, []);

  return (
    <div
      ref={ref}
      className={cn('tilt', className)}
      onPointerMove={enabled ? onMove : undefined}
      onPointerLeave={enabled ? reset : undefined}
    >
      {children}
      <span className="tilt__sheen" aria-hidden="true" />
    </div>
  );
}
