'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { getSceneWindow, scenes } from '@/data/navigation/scenes';
import type { SceneDefinition, SceneId } from '@/types/scene';

/**
 * Registers a DOM section with the engine. The engine then writes
 * `--presence` and `--t` onto that element every frame, so the section
 * animates without any component re-rendering.
 */
export function useSceneSection(id: SceneId): (node: HTMLElement | null) => void {
  return useCallback(
    (node: HTMLElement | null) => {
      getScrollEngine().registerSection(id, node);
    },
    [id],
  );
}

/**
 * Registers an element against a slice of a chapter — used where several
 * panels share one chapter, as the four projects do.
 *
 * `from` and `to` are expressed in the chapter's own 0–1 local progress.
 */
export function useSceneBand(
  id: SceneId,
  key: string,
  from: number,
  to: number,
  shoulder = 0.18,
): (node: HTMLElement | null) => void {
  return useCallback(
    (node: HTMLElement | null) => {
      const { start, end } = getSceneWindow(id);
      const span = end - start;
      getScrollEngine().registerBand(
        `${id}:${key}`,
        node,
        start + span * from,
        start + span * to,
        shoulder,
      );
    },
    [id, key, from, to, shoulder],
  );
}

/** The chapter currently on screen. Re-renders only when the chapter changes. */
export function useActiveScene(): { index: number; scene: SceneDefinition } {
  const engine = getScrollEngine();
  const [index, setIndex] = useState(engine.state.sceneIndex);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setIndex(engine.state.sceneIndex);
    const unsubscribe = engine.onSceneChange((next) => {
      if (mounted.current) setIndex(next);
    });
    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, [engine]);

  return { index, scene: scenes[index] ?? scenes[0]! };
}
