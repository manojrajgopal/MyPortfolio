'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Object3D,
  type Group,
  type InstancedMesh,
  type LineBasicMaterial,
  type LineSegments,
  type Mesh,
  type MeshStandardMaterial,
} from 'three';
import { hex } from '@/lib/three/palette';
import type { SkillGroup } from '@/types/skill';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { interaction } from '@/lib/state/interactionStore';
import { smoothstep } from '@/lib/utils/clamp';
import { damp } from '@/lib/utils/lerp';

interface SkillsOrbitProps {
  readonly group: SkillGroup;
  /** Position of this shell in the chapter, 0 = innermost. */
  readonly order: number;
  readonly total: number;
  readonly reducedMotion: boolean;
}

const ACCENT: Record<SkillGroup['accent'], number> = {
  copper: hex.copperLift,
  emerald: hex.emeraldLift,
  champagne: hex.champagne,
  silver: hex.silver,
};

const BASE_RADIUS = 2.3;

/**
 * One orbital shell of the constellation: a group of technologies circling
 * the core on an inclined ring.
 *
 * When the matching group is focused in the overlay, the shell tilts level,
 * expands, and its nodes brighten — the skill list and the sky are the same
 * object seen two ways.
 */
export function SkillsOrbit({
  group,
  order,
  total,
  reducedMotion,
}: SkillsOrbitProps): React.JSX.Element {
  const engine = getScrollEngine();
  const shell = useRef<Group>(null);
  const nodes = useRef<InstancedMesh>(null);
  const ring = useRef<Mesh>(null);
  const spokes = useRef<LineSegments>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const focus = useRef(0);

  const radius = BASE_RADIUS * group.orbit;
  const accent = ACCENT[group.accent];

  /** Fixed angular offsets so nodes never overlap between renders. */
  const offsets = useMemo(
    () => group.nodes.map((_, index) => (index / group.nodes.length) * Math.PI * 2),
    [group.nodes],
  );

  /**
   * Spokes from the core out to each node. They make the shell read as a
   * structure the technologies belong to rather than beads on a ring.
   */
  const spokeGeometry = useMemo(() => {
    const positions = new Float32Array(offsets.length * 6);
    offsets.forEach((angle, index) => {
      positions[index * 6] = 0;
      positions[index * 6 + 1] = 0;
      positions[index * 6 + 2] = 0;
      positions[index * 6 + 3] = Math.cos(angle) * radius;
      positions[index * 6 + 4] = 0;
      positions[index * 6 + 5] = Math.sin(angle) * radius;
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    return geometry;
  }, [offsets, radius]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const local = engine.localProgress('skills');
    const time = reducedMotion ? 0 : state.clock.elapsedTime;

    // Shells arrive from the inside out.
    const arrive = smoothstep((order / total) * 0.4, (order / total) * 0.4 + 0.3, local);
    const focused = interaction.state.skillGroup === group.id ? 1 : 0;
    focus.current = damp(focus.current, focused, 0.0006, dt);

    const node = shell.current;
    if (node) {
      node.rotation.x = group.inclination * (1 - focus.current * 0.9);
      node.rotation.y = time * (0.06 + order * 0.012) + order;
      node.scale.setScalar(arrive * (1 + focus.current * 0.12));
    }

    if (ring.current) {
      const material = ring.current.material as MeshStandardMaterial;
      material.opacity = (0.12 + focus.current * 0.5) * arrive;
    }

    const mesh = nodes.current;
    if (mesh) {
      for (let i = 0; i < offsets.length; i += 1) {
        const angle = offsets[i]! + time * 0.1;
        const wobble = Math.sin(time * 0.6 + i * 1.7) * 0.12;

        dummy.position.set(
          Math.cos(angle) * radius,
          wobble + focus.current * 0.1,
          Math.sin(angle) * radius,
        );
        dummy.rotation.set(time * 0.4 + i, angle, 0);
        dummy.scale.setScalar(0.075 + focus.current * 0.06);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;

      const material = mesh.material as MeshStandardMaterial;
      material.emissiveIntensity = 0.8 + focus.current * 2.4;
    }

    if (spokes.current) {
      spokes.current.rotation.y = time * 0.1;
      (spokes.current.material as LineBasicMaterial).opacity =
        (0.04 + focus.current * 0.24) * arrive;
    }
  });

  return (
    <group ref={shell}>
      {/* The orbit path itself — barely there until the group is focused. */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.006, radius + 0.006, 128]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.7}
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={AdditiveBlending}
          fog={false}
          toneMapped={false}
        />
      </mesh>

      <lineSegments ref={spokes} geometry={spokeGeometry}>
        <lineBasicMaterial
          color={accent}
          transparent
          opacity={0.04}
          depthWrite={false}
          blending={AdditiveBlending}
          fog={false}
          toneMapped={false}
        />
      </lineSegments>

      <instancedMesh
        ref={nodes}
        args={[undefined, undefined, group.nodes.length]}
        frustumCulled={false}
      >
        {/* Octahedra read as cut stones at this scale; spheres read as dots. */}
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.8}
          roughness={0.34}
          metalness={0.7}
          flatShading
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
