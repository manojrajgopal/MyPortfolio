'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, type InstancedMesh, Object3D } from 'three';
import { experiences } from '@/data/experience/experience';
import { CELL_Z } from '@/lib/three/cameraRig';
import { hex } from '@/lib/three/palette';
import { scaleCount, type PerformanceProfile } from '@/lib/three/performance';
import { DustField } from '@/components/world/primitives/DustField';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { ExperienceNode } from './ExperienceNode';

interface ExperienceSceneProps {
  readonly profile: PerformanceProfile;
  readonly reducedMotion: boolean;
}

/** The rail runs from the entrance of the chapter to its exit. */
const RAIL = { from: 46, to: -62 } as const;
const RAIL_LENGTH = RAIL.from - RAIL.to;

/**
 * Chapter 04 — Experience.
 *
 * Not a vertical timeline. A rail through space with a station for each role;
 * the camera flies down it, and the two entries arrive in sequence. Light
 * pulses run ahead of the camera along the rail, so the path always reads as
 * leading somewhere.
 */
export function ExperienceScene({
  profile,
  reducedMotion,
}: ExperienceSceneProps): React.JSX.Element {
  const pulses = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const engine = getScrollEngine();

  const pulseCount = scaleCount(26, profile, 8);

  useFrame((state) => {
    const node = pulses.current;
    if (!node) return;

    const time = reducedMotion ? engine.localProgress('experience') * 12 : state.clock.elapsedTime;

    for (let i = 0; i < pulseCount; i += 1) {
      const offset = (i / pulseCount) * RAIL_LENGTH;
      const travel = (offset + time * 9) % RAIL_LENGTH;
      const z = RAIL.from - travel;
      // Fade at both ends so pulses appear to emerge and dissolve.
      const edge = Math.min(travel, RAIL_LENGTH - travel) / 18;
      const scale = 0.05 + Math.min(1, edge) * 0.09;

      dummy.position.set(0, -1.9, z);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      node.setMatrixAt(i, dummy.matrix);
    }
    node.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[0, 0, CELL_Z.experience]}>
      {/* The rail itself: one long, very thin emissive bar. */}
      <mesh position={[0, -1.9, (RAIL.from + RAIL.to) / 2]}>
        <boxGeometry args={[0.05, 0.05, RAIL_LENGTH]} />
        <meshStandardMaterial
          color={hex.copperDeep}
          emissive={hex.copper}
          emissiveIntensity={0.85}
          roughness={0.4}
          metalness={0.9}
          toneMapped={false}
        />
      </mesh>

      {/* Sleepers — rhythm, and a sense of speed while travelling. */}
      <Sleepers count={scaleCount(40, profile, 14)} />

      <instancedMesh ref={pulses} args={[undefined, undefined, pulseCount]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          color={hex.ember}
          transparent
          opacity={0.9}
          blending={AdditiveBlending}
          fog={false}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>

      {experiences.map((entry, index) => (
        <ExperienceNode
          key={entry.id}
          id={entry.id}
          z={14 - index * 42}
          side={index % 2 === 0 ? 1 : -1}
          arrival={0.34 + index * 0.34}
          reducedMotion={reducedMotion}
        />
      ))}

      <DustField
        count={scaleCount(500, profile, 100)}
        spread={[22, 12, 60]}
        color={hex.bronze}
        opacity={0.3}
        size={10}
        rise={0.1}
        still={reducedMotion}
      />
    </group>
  );
}

/** Evenly spaced crossbars under the rail. */
function Sleepers({ count }: { count: number }): React.JSX.Element {
  const mesh = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  useFrame(() => {
    const node = mesh.current;
    if (!node || node.userData.placed) return;
    for (let i = 0; i < count; i += 1) {
      const z = RAIL.from - (i / (count - 1)) * RAIL_LENGTH;
      dummy.position.set(0, -1.96, z);
      dummy.scale.set(1.7, 0.02, 0.05);
      dummy.updateMatrix();
      node.setMatrixAt(i, dummy.matrix);
    }
    node.instanceMatrix.needsUpdate = true;
    node.userData.placed = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hex.stone} roughness={0.7} metalness={0.4} />
    </instancedMesh>
  );
}
