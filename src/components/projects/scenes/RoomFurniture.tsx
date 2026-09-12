'use client';

import { useMemo, type ReactNode } from 'react';
import type { Material } from 'three';

interface PieceProps {
  readonly material: Material;
  readonly position: readonly [number, number, number];
  readonly rotation?: number;
  readonly scale?: number;
}

/**
 * Furniture, built from primitives.
 *
 * The inpainting scene only works if the room reads as a room — a box on the
 * floor is not a sofa, and an audience cannot tell that a sofa has been
 * replaced by a different sofa unless both are recognisably furniture. Each
 * piece here is assembled from a handful of parts and shares one material, so
 * the dissolve front runs across the whole object at once.
 */

export function Sofa({ material, position, rotation = 0, scale = 1 }: PieceProps): ReactNode {
  return (
    <group position={[...position]} rotation={[0, rotation, 0]} scale={scale}>
      {/* Seat */}
      <mesh material={material} position={[0, 0.26, 0]}>
        <boxGeometry args={[2.1, 0.26, 0.86]} />
      </mesh>
      {/* Back */}
      <mesh material={material} position={[0, 0.62, -0.34]}>
        <boxGeometry args={[2.1, 0.52, 0.18]} />
      </mesh>
      {/* Arms */}
      {[-1, 1].map((side) => (
        <mesh key={side} material={material} position={[side * 0.98, 0.46, 0]}>
          <boxGeometry args={[0.16, 0.4, 0.86]} />
        </mesh>
      ))}
      {/* Legs */}
      {[
        [-0.9, -0.34],
        [0.9, -0.34],
        [-0.9, 0.34],
        [0.9, 0.34],
      ].map(([x, z]) => (
        <mesh key={`${x}:${z}`} material={material} position={[x!, 0.07, z!]}>
          <boxGeometry args={[0.07, 0.14, 0.07]} />
        </mesh>
      ))}
    </group>
  );
}

export function Table({ material, position, rotation = 0, scale = 1 }: PieceProps): ReactNode {
  return (
    <group position={[...position]} rotation={[0, rotation, 0]} scale={scale}>
      <mesh material={material} position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.52, 0.52, 0.06, 24]} />
      </mesh>
      <mesh material={material} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.42, 12]} />
      </mesh>
      <mesh material={material} position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.3, 0.32, 0.04, 20]} />
      </mesh>
    </group>
  );
}

export function FloorLamp({ material, position, scale = 1 }: PieceProps): ReactNode {
  return (
    <group position={[...position]} scale={scale}>
      <mesh material={material} position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.22, 0.24, 0.05, 20]} />
      </mesh>
      <mesh material={material} position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 1.56, 10]} />
      </mesh>
      <mesh material={material} position={[0, 1.68, 0]}>
        <coneGeometry args={[0.3, 0.36, 20, 1, true]} />
      </mesh>
    </group>
  );
}

export function Shelf({ material, position, rotation = 0, scale = 1 }: PieceProps): ReactNode {
  const shelves = useMemo(() => [0.3, 0.78, 1.26], []);
  return (
    <group position={[...position]} rotation={[0, rotation, 0]} scale={scale}>
      {[-1, 1].map((side) => (
        <mesh key={side} material={material} position={[side * 0.62, 0.78, 0]}>
          <boxGeometry args={[0.06, 1.56, 0.3]} />
        </mesh>
      ))}
      {shelves.map((y) => (
        <mesh key={y} material={material} position={[0, y, 0]}>
          <boxGeometry args={[1.3, 0.05, 0.3]} />
        </mesh>
      ))}
    </group>
  );
}

export function Rug({ material, position, rotation = 0, scale = 1 }: PieceProps): ReactNode {
  return (
    <mesh
      material={material}
      position={[...position]}
      rotation={[-Math.PI / 2, 0, rotation]}
      scale={scale}
    >
      <planeGeometry args={[2.6, 1.7]} />
    </mesh>
  );
}

export function Plant({ material, position, scale = 1 }: PieceProps): ReactNode {
  return (
    <group position={[...position]} scale={scale}>
      <mesh material={material} position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.16, 0.12, 0.32, 14]} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh
            key={i}
            material={material}
            position={[Math.cos(angle) * 0.12, 0.52, Math.sin(angle) * 0.12]}
            rotation={[Math.cos(angle) * 0.5, angle, Math.sin(angle) * 0.5]}
          >
            <coneGeometry args={[0.07, 0.5, 6]} />
          </mesh>
        );
      })}
    </group>
  );
}
