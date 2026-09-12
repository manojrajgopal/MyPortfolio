'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { mapRange } from '@/lib/utils/clamp';
import type { SceneId } from '@/types/scene';

export interface SceneScope {
  readonly id: SceneId;
  /** Progress through whatever stretch of the film this content belongs to. */
  readonly read: () => number;
}

const SceneContext = createContext<SceneScope | null>(null);

/**
 * Which stretch of the film a piece of content belongs to.
 *
 * Text effects that need a number rather than a CSS variable — a scramble, a
 * counter — read progress through this instead of being told their window by
 * every caller. Content nested inside a narrower band (one project inside the
 * projects chapter) sees that band's progress, not the whole chapter's, so a
 * figure counts up as its own set arrives rather than as the chapter opens.
 */
export function useSceneScope(): SceneScope {
  const scope = useContext(SceneContext);
  if (!scope) throw new Error('useSceneScope must be used inside a SceneStage');
  return scope;
}

export function SceneScopeProvider({
  id,
  children,
}: {
  readonly id: SceneId;
  readonly children: ReactNode;
}): React.JSX.Element {
  const scope = useMemo<SceneScope>(
    () => ({ id, read: () => getScrollEngine().localProgress(id) }),
    [id],
  );
  return <SceneContext.Provider value={scope}>{children}</SceneContext.Provider>;
}

/** Narrows the scope to a slice of the surrounding chapter. */
export function SceneBandProvider({
  from,
  to,
  children,
}: {
  readonly from: number;
  readonly to: number;
  readonly children: ReactNode;
}): React.JSX.Element {
  const parent = useSceneScope();
  const scope = useMemo<SceneScope>(
    () => ({ id: parent.id, read: () => mapRange(parent.read(), from, to) }),
    [from, parent, to],
  );
  return <SceneContext.Provider value={scope}>{children}</SceneContext.Provider>;
}
