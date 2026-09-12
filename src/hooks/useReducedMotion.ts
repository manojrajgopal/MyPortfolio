'use client';

import { useMediaQuery } from './useMediaQuery';

/**
 * True when the visitor asked for less movement.
 * The story still plays; the camera drift, parallax and particles do not.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
