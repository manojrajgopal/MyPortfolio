'use client';

import { useFrame } from '@react-three/fiber';
import { useRef, useState, type ReactNode } from 'react';
import type { Group } from 'three';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import type { SceneId } from '@/types/scene';

interface SceneGroupProps {
  readonly id: SceneId;
  /** How far ahead of the window the chapter is built, in global progress. */
  readonly preload?: number;
  readonly children: ReactNode;
}

/**
 * Mounts a chapter of the world only while the camera is anywhere near it,
 * and hides it the moment it is out of range.
 *
 * Chapters are separated far enough along -Z that exponential fog dissolves
 * them into the dark before they leave range — the cross-fade between
 * chapters is the atmosphere itself, not an opacity animation.
 */
export function SceneGroup({ id, preload = 0.06, children }: SceneGroupProps): React.JSX.Element {
  const engine = getScrollEngine();
  const group = useRef<Group>(null);
  const mounted = useRef(engine.isNear(id, preload));
  const [active, setActive] = useState(mounted.current);

  useFrame(() => {
    const near = engine.isNear(id, preload);
    if (near !== mounted.current) {
      mounted.current = near;
      setActive(near);
    }
    const node = group.current;
    if (node) node.visible = engine.isNear(id, preload * 0.6);
  });

  return <group ref={group}>{active ? children : null}</group>;
}
