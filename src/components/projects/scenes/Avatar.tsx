'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { hex } from '@/lib/three/palette';

interface AvatarProps {
  readonly reducedMotion: boolean;
}

/**
 * The 3D avatar, built from primitives rather than a downloaded mesh.
 *
 * Deliberately unresolved — a mannequin, not a person. It exists so the
 * garment has a body to land on, and it turns slowly so the try-on reads
 * from every angle.
 */
export function Avatar({ reducedMotion }: AvatarProps): React.JSX.Element {
  const root = useRef<Group>(null);

  useFrame((state) => {
    const node = root.current;
    if (!node || reducedMotion) return;
    const time = state.clock.elapsedTime;
    node.rotation.y = time * 0.22;
    // A slight shift of weight, so the figure is standing rather than parked.
    node.position.y = Math.sin(time * 0.6) * 0.012;
  });

  return (
    <group ref={root}>
      {/* Torso */}
      <mesh position={[0, 1.28, 0]}>
        <capsuleGeometry args={[0.26, 0.62, 4, 16]} />
        <meshStandardMaterial color={hex.silver} roughness={0.52} metalness={0.46} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.94, 0]}>
        <sphereGeometry args={[0.165, 20, 20]} />
        <meshStandardMaterial color={hex.parchment} roughness={0.48} metalness={0.42} />
      </mesh>

      {/* Arms */}
      {[-1, 1].map((side) => (
        <mesh key={`arm-${side}`} position={[side * 0.33, 1.24, 0]} rotation={[0, 0, side * 0.14]}>
          <capsuleGeometry args={[0.068, 0.66, 4, 10]} />
          <meshStandardMaterial color={hex.silver} roughness={0.52} metalness={0.46} />
        </mesh>
      ))}

      {/* Legs */}
      {[-1, 1].map((side) => (
        <mesh key={`leg-${side}`} position={[side * 0.13, 0.46, 0]}>
          <capsuleGeometry args={[0.088, 0.72, 4, 10]} />
          <meshStandardMaterial color={hex.bronze} roughness={0.6} metalness={0.44} />
        </mesh>
      ))}

      {/* Contact shadow stand-in — grounds the figure on the platform. */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 32]} />
        <meshBasicMaterial color={hex.void} transparent opacity={0.62} />
      </mesh>
    </group>
  );
}
