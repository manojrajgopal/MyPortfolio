'use client';

import { useEffect, useState } from 'react';
import { getThemeStore, type ResolvedTheme } from '@/lib/theme/themeStore';

/**
 * The active theme, for components that must re-render when it changes.
 *
 * Most of the world reads the theme inside its frame loop and needs no
 * re-render. This is for the exception: surfaces whose *colour* is a React
 * prop — the walls of an enclosed set, a floor plane — which have to be
 * re-created rather than tweaked. Theme changes are rare, so a render is the
 * right cost here.
 *
 * Starts on `dark` so the first client render matches the prerendered HTML,
 * then corrects in an effect.
 */
export function useResolvedTheme(): ResolvedTheme {
  const store = getThemeStore();
  const [theme, setTheme] = useState<ResolvedTheme>('dark');

  useEffect(() => {
    setTheme(store.getResolved());
    return store.subscribe(setTheme);
  }, [store]);

  return theme;
}

/** Pick between a dark-world and a light-world colour. */
export function useThemeHex(dark: number, light: number): number {
  return useResolvedTheme() === 'light' ? light : dark;
}
