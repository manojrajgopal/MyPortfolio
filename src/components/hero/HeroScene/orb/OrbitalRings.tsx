'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  Color,
  NormalBlending,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
} from 'three';
import { hex } from '@/lib/three/palette';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { orbBeats } from './beats';

interface OrbitalRingsProps {
  readonly light: boolean;
  readonly reducedMotion: boolean;
  /** Ring count, already scaled for the device. */
  readonly count: number;
  readonly segments: number;
}

interface RingSpec {
  readonly radius: number;
  readonly thickness: number;
  readonly tilt: readonly [number, number, number];
  readonly speed: number;
  readonly color: number;
  /** How many nodes ride this ring. */
  readonly nodes: number;
}

const SPECS: readonly RingSpec[] = [
  { radius: 1.42, thickness: 0.012, tilt: [1.2, 0.3, 0.1], speed: 0.42, color: hex.ember, nodes: 3 },
  { radius: 1.62, thickness: 0.008, tilt: [-0.5, 0.9, 0.6], speed: -0.31, color: hex.copperLift, nodes: 2 },
  { radius: 1.86, thickness: 0.014, tilt: [0.4, -1.1, -0.3], speed: 0.24, color: hex.champagne, nodes: 4 },
  { radius: 2.15, thickness: 0.006, tilt: [-1.35, 0.15, 0.85], speed: -0.18, color: hex.ember, nodes: 2 },
  { radius: 2.48, thickness: 0.009, tilt: [0.85, 1.4, -0.7], speed: 0.14, color: hex.copperLift, nodes: 3 },
];

/**
 * A gyroscope of thin rings around the orb, each on its own axis and its own
 * clock. They read as an apparatus containing the energy rather than as
 * decoration, which is what stops the sphere from looking like a lamp.
 *
 * Scroll drives two things the rings could not do on their own: they swing in
 * from scattered angles as the film ignites, and at the alignment beat they
 * abandon their individual tilts and settle onto one shared plane — the moment
 * the artifact looks designed rather than chaotic.
 */
export function OrbitalRings({
  light,
  reducedMotion,
  count,
  segments,
}: OrbitalRingsProps): React.JSX.Element {
  const engine = getScrollEngine();
  const root = useRef<Group>(null);
  const rings = useRef<(Group | null)[]>([]);

  const specs = useMemo(() => SPECS.slice(0, Math.max(2, count)), [count]);

  /**
   * Nodes ride the ring at fixed angles, so they are positioned once and then
   * carried by the ring's own rotation — no per-node maths in the frame loop.
   */
  const nodePositions = useMemo(
    () =>
      specs.map((spec) =>
        Array.from({ length: spec.nodes }, (_, i) => {
          const angle = (i / spec.nodes) * Math.PI * 2 + spec.radius;
          return [Math.cos(angle) * spec.radius, Math.sin(angle) * spec.radius, 0] as const;
        }),
      ),
    [specs],
  );

  useFrame((state) => {
    const time = reducedMotion ? 0 : state.clock.elapsedTime;
    const beats = orbBeats(engine.localProgress('intro'));

    if (root.current) {
      // The whole cage leans as the chapter runs, then draws in at the end.
      root.current.rotation.z = beats.align * 0.34;
      root.current.scale.setScalar(1 + beats.disperse * 0.16 - beats.collapse * 0.28);
    }

    specs.forEach((spec, index) => {
      const node = rings.current[index];
      if (!node) return;

      // Alignment folds each ring's own tilt away toward a shared plane, so
      // the scattered gyroscope resolves into one disc.
      const settle = 1 - beats.align;
      node.rotation.x = spec.tilt[0] * settle + Math.PI / 2 * beats.align;
      node.rotation.z = spec.tilt[2] * settle;

      // Ignition swings them in; after that each turns at its own rate.
      node.rotation.y = spec.tilt[1] * settle + time * spec.speed * beats.ignite;

      const material = (node.children[0] as Mesh | undefined)?.material as
        | MeshBasicMaterial
        | undefined;
      if (material) {
        const flicker = 0.82 + Math.sin(time * 1.7 + index * 2.1) * 0.18;
        material.opacity =
          (light ? 0.42 : 0.7) * beats.ignite * flicker * (0.6 + beats.charge * 0.5);
      }
    });
  });

  return (
    <group ref={root}>
      {specs.map((spec, index) => (
        <group
          key={spec.radius}
          ref={(node) => {
            rings.current[index] = node;
          }}
        >
          <mesh>
            <torusGeometry args={[spec.radius, spec.thickness, 3, segments]} />
            <meshBasicMaterial
              color={light ? new Color(spec.color).multiplyScalar(0.55) : spec.color}
              transparent
              opacity={0}
              depthWrite={false}
              blending={light ? NormalBlending : AdditiveBlending}
              toneMapped={light}
              fog={false}
            />
          </mesh>

          {/* Charge nodes riding the ring — the detail that sells rotation,
              because a smooth torus turning on its own axis looks still. */}
          {nodePositions[index]!.map((position, n) => (
            <mesh key={n} position={[...position]}>
              <sphereGeometry args={[spec.thickness * 3.6, 8, 8]} />
              <meshBasicMaterial
                color={light ? new Color(hex.copperDeep) : hex.ivory}
                transparent
                opacity={light ? 0.75 : 0.95}
                depthWrite={false}
                blending={light ? NormalBlending : AdditiveBlending}
                toneMapped={light}
                fog={false}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
