'use client';

import { useCallback, useSyncExternalStore } from 'react';

/** SSR-safe media query subscription. Server always resolves to `false`. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined') return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export const useHasFinePointer = (): boolean =>
  useMediaQuery('(hover: hover) and (pointer: fine)');
