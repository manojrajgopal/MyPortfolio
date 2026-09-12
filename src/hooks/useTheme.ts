'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getThemeStore,
  type ResolvedTheme,
  type ThemePreference,
} from '@/lib/theme/themeStore';

interface ThemeState {
  readonly preference: ThemePreference;
  readonly resolved: ResolvedTheme;
  readonly setTheme: (preference: ThemePreference) => void;
  readonly cycleTheme: () => void;
}

/**
 * React's view of the theme.
 *
 * The store is the source of truth and applies the document attribute itself;
 * this only mirrors it for components that need to render differently (the
 * toggle's label, an icon). Re-renders happen on theme change only.
 */
export function useTheme(): ThemeState {
  const store = getThemeStore();

  /**
   * Seeded with the same values the server rendered, never with the stored
   * choice. Reading localStorage during the first client render makes that
   * render disagree with the prerendered HTML, and React discards the tree.
   * The real value arrives in the effect below, one frame later.
   */
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [resolved, setResolved] = useState<ResolvedTheme>('dark');

  useEffect(() => {
    store.initialise();
    setPreference(store.getPreference());
    setResolved(store.getResolved());

    return store.subscribe((nextResolved, nextPreference) => {
      setResolved(nextResolved);
      setPreference(nextPreference);
    });
  }, [store]);

  return {
    preference,
    resolved,
    setTheme: useCallback((next: ThemePreference) => store.set(next), [store]),
    cycleTheme: useCallback(() => store.cycle(), [store]),
  };
}
