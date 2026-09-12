'use client';

import { useCallback, useRef, type ReactNode } from 'react';
import { useHasFinePointer } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface MagneticProps {
  readonly children: ReactNode;
  /** How far the element is allowed to travel toward the cursor, in px. */
  readonly strength?: number;
  readonly className?: string;
}

/**
 * Pulls its child a little way toward the cursor.
 *
 * Applied only to genuinely interactive things, and only on precise
 * pointers — a magnetic effect on a touch device is just a layout shift.
 */
export function Magnetic({
  children,
  strength = 14,
  className,
}: MagneticProps): React.JSX.Element {
  const ref = useRef<HTMLSpanElement>(null);
  const fine = useHasFinePointer();
  const reducedMotion = useReducedMotion();
  const enabled = fine && !reducedMotion;

  const onMove = useCallback(
    (event: React.PointerEvent<HTMLSpanElement>) => {
      const node = ref.current;
      if (!node || !enabled) return;
      const rect = node.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      node.style.transform = `translate3d(${(dx / rect.width) * strength}px, ${
        (dy / rect.height) * strength
      }px, 0)`;
    },
    [enabled, strength],
  );

  const reset = useCallback(() => {
    const node = ref.current;
    if (node) node.style.transform = 'translate3d(0, 0, 0)';
  }, []);

  return (
    <span
      ref={ref}
      className={className}
      onPointerMove={enabled ? onMove : undefined}
      onPointerLeave={enabled ? reset : undefined}
      style={{ display: 'inline-flex', transition: 'transform 500ms cubic-bezier(0.16,1,0.3,1)' }}
    >
      {children}
    </span>
  );
}
