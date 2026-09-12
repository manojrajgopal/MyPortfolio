'use client';

import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Object3D, type InstancedMesh } from 'three';
import { hex } from '@/lib/three/palette';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { clamp, smoothstep } from '@/lib/utils/clamp';

interface CodeLatticeProps {
  readonly count: number;
  readonly reducedMotion: boolean;
}

interface Fragment {
  /** Where the fragment drifts before it is placed. */
  readonly loose: [number, number, number];
  readonly looseRotation: [number, number, number];
  /** Where it belongs once the system is assembled. */
  readonly placed: [number, number, number];
  readonly length: number;
  readonly axis: 0 | 1 | 2;
  readonly order: number;
  readonly copper: boolean;
}

const GRID = { x: 5, y: 6, z: 4 } as const;
/** Hoisted so the per-instance colour pass never allocates. */
const WARM = new Color(hex.parchment);
const SPACING = { x: 2.1, y: 1.15, z: 2.1 } as const;

/**
 * Loose fragments of code assembling into a structure.
 *
 * Each bar starts adrift with a random attitude, then snaps onto a
 * rectilinear frame as the chapter plays — the literal reading of turning
 * ideas into something scalable. Fragments land in order from the base up,
 * so the structure builds rather than appearing.
 */
export function CodeLattice({ count, reducedMotion }: CodeLatticeProps): React.JSX.Element {
  const engine = getScrollEngine();
  const mesh = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const tint = useMemo(() => new Color(), []);

  const fragments = useMemo<Fragment[]>(() => {
    const list: Fragment[] = [];
    for (let i = 0; i < count; i += 1) {
      const gx = i % GRID.x;
      const gy = Math.floor(i / GRID.x) % GRID.y;
      const gz = Math.floor(i / (GRID.x * GRID.y)) % GRID.z;
      const axis: 0 | 1 | 2 = (i % 7 === 0 ? 1 : i % 3 === 0 ? 2 : 0) as 0 | 1 | 2;

      list.push({
        loose: [
          (Math.random() * 2 - 1) * 26,
          (Math.random() * 2 - 1) * 16,
          (Math.random() * 2 - 1) * 26,
        ],
        looseRotation: [
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
        ],
        placed: [
          (gx - (GRID.x - 1) / 2) * SPACING.x,
          gy * SPACING.y,
          (gz - (GRID.z - 1) / 2) * SPACING.z,
        ],
        length: axis === 1 ? 0.9 : 0.6 + Math.random() * 1.5,
        axis,
        // Lower rows settle first.
        order: (gy / GRID.y) * 0.72 + Math.random() * 0.2,
        copper: i % 11 === 0,
      });
    }
    return list;
  }, [count]);

  // Seed instanceColor before the first render so the shader compiles with
  // per-instance colour support already enabled.
  useLayoutEffect(() => {
    const node = mesh.current;
    if (!node) return;
    for (let i = 0; i < count; i += 1) {
      node.setColorAt(i, tint.setHex(hex.stone));
    }
    if (node.instanceColor) node.instanceColor.needsUpdate = true;
  }, [count, tint]);

  useFrame((state) => {
    const node = mesh.current;
    if (!node) return;

    const local = engine.localProgress('engineering');
    const time = reducedMotion ? 0 : state.clock.elapsedTime;

    for (let i = 0; i < fragments.length; i += 1) {
      const fragment = fragments[i]!;

      // Per-fragment assembly window, staggered by `order`.
      const settle = smoothstep(fragment.order * 0.55, fragment.order * 0.55 + 0.4, local);

      const driftX = Math.sin(time * 0.3 + i) * 0.5 * (1 - settle);
      const driftY = Math.cos(time * 0.24 + i * 1.3) * 0.5 * (1 - settle);

      dummy.position.set(
        fragment.loose[0] * (1 - settle) + fragment.placed[0] * settle + driftX,
        fragment.loose[1] * (1 - settle) + fragment.placed[1] * settle + driftY,
        fragment.loose[2] * (1 - settle) + fragment.placed[2] * settle,
      );

      // Attitude resolves to axis-aligned as the fragment finds its place.
      const target: [number, number, number] =
        fragment.axis === 0
          ? [0, 0, 0]
          : fragment.axis === 1
            ? [0, 0, Math.PI / 2]
            : [0, Math.PI / 2, 0];

      dummy.rotation.set(
        fragment.looseRotation[0] * (1 - settle) + target[0] * settle,
        fragment.looseRotation[1] * (1 - settle) + target[1] * settle,
        fragment.looseRotation[2] * (1 - settle) + target[2] * settle,
      );

      const thickness = 0.055 + settle * 0.02;
      dummy.scale.set(fragment.length * (0.4 + settle * 0.6), thickness, thickness);
      dummy.updateMatrix();
      node.setMatrixAt(i, dummy.matrix);

      // Fragments warm up as they lock in; a few stay copper throughout.
      const heat = clamp(settle * 0.9 + (fragment.copper ? 0.6 : 0));
      tint.setHex(fragment.copper ? hex.copper : hex.stone);
      tint.lerp(WARM, heat * 0.35);
      node.setColorAt(i, tint);
    }

    node.instanceMatrix.needsUpdate = true;
    if (node.instanceColor) node.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.42} metalness={0.72} flatShading />
    </instancedMesh>
  );
}
