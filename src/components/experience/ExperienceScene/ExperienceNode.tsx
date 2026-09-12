'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group, Mesh, MeshStandardMaterial } from 'three';
import { hex } from '@/lib/three/palette';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { interaction } from '@/lib/state/interactionStore';
import { smoothstep } from '@/lib/utils/clamp';
import { damp } from '@/lib/utils/lerp';

interface ExperienceNodeProps {
  readonly id: string;
  /** Position of this station along the rail. */
  readonly z: number;
  /** Which side of the rail the structure is built on. */
  readonly side: 1 | -1;
  /** Local progress at which this station is level with the camera. */
  readonly arrival: number;
  readonly reducedMotion: boolean;
}

/**
 * A destination on the rail.
 *
 * A gantry frame with a suspended slab. It builds as the camera approaches
 * and leans toward the viewer when the matching entry in the overlay is
 * hovered — the DOM and the world are looking at the same object.
 */
export function ExperienceNode({
  id,
  z,
  side,
  arrival,
  reducedMotion,
}: ExperienceNodeProps): React.JSX.Element {
  const engine = getScrollEngine();
  const root = useRef<Group>(null);
  const slab = useRef<Mesh>(null);
  const ring = useRef<Mesh>(null);
  const focus = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const local = engine.localProgress('experience');
    const time = reducedMotion ? 0 : state.clock.elapsedTime;

    // Build as the camera closes in on this station.
    const build = smoothstep(arrival - 0.3, arrival - 0.02, local);
    const focused = interaction.state.experience === id ? 1 : 0;
    focus.current = damp(focus.current, focused, 0.0005, dt);

    const node = root.current;
    if (node) {
      node.scale.setScalar(0.6 + build * 0.4);
      // Leaning toward the rail — and further toward it when focused.
      node.rotation.y = side * (0.34 - focus.current * 0.26);
      node.position.x = side * (4.6 - focus.current * 1.3);
      node.position.y = -1 + build * 1 + Math.sin(time * 0.4 + z) * 0.06;
    }

    if (slab.current) {
      const material = slab.current.material as MeshStandardMaterial;
      material.emissiveIntensity = 0.12 + focus.current * 0.8;
      slab.current.position.z = focus.current * 0.7;
    }

    if (ring.current) {
      ring.current.rotation.z = time * 0.14 * side + build * Math.PI * 0.4;
      const material = ring.current.material as MeshStandardMaterial;
      material.emissiveIntensity = 0.5 + build * 1.2 + focus.current * 1.4;
    }
  });

  return (
    <group ref={root} position={[side * 4.6, 0, z]}>
      {/* Gantry: two uprights and a crossbeam. */}
      <mesh position={[-1.5, 1.6, 0]}>
        <boxGeometry args={[0.16, 6.4, 0.16]} />
        <meshStandardMaterial color={hex.stone} roughness={0.5} metalness={0.8} />
      </mesh>
      <mesh position={[1.5, 1.6, 0]}>
        <boxGeometry args={[0.16, 6.4, 0.16]} />
        <meshStandardMaterial color={hex.stone} roughness={0.5} metalness={0.8} />
      </mesh>
      <mesh position={[0, 4.7, 0]}>
        <boxGeometry args={[3.2, 0.14, 0.14]} />
        <meshStandardMaterial color={hex.bronze} roughness={0.44} metalness={0.9} />
      </mesh>

      {/* The suspended slab — the surface the overlay card is "printed" on. */}
      <mesh ref={slab} position={[0, 2.3, 0]}>
        <boxGeometry args={[3.4, 2.1, 0.08]} />
        <meshStandardMaterial
          color={hex.ash}
          emissive={hex.copper}
          emissiveIntensity={0.12}
          roughness={0.32}
          metalness={0.66}
        />
      </mesh>

      {/* Station marker. */}
      <mesh ref={ring} position={[0, 2.3, -0.3]}>
        <torusGeometry args={[1.9, 0.014, 6, 72]} />
        <meshStandardMaterial
          color={hex.copperLift}
          emissive={hex.copperLift}
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.9}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
