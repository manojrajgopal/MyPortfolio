'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Object3D, type Group, type InstancedMesh, type Mesh, type MeshStandardMaterial } from 'three';
import { hex } from '@/lib/three/palette';

interface MonolithProps {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly position: readonly [number, number, number];
  readonly rotation?: number;
  /**
   * Growth from the ground, 0–1, read once per frame.
   * A getter rather than a prop so the owning chapter can drive it from
   * scroll without re-rendering anything.
   */
  readonly getRise?: () => number;
  readonly color?: number;
  readonly seam?: number;
  readonly seamIntensity?: number;
  /** Number of lit window slits up the face. 0 leaves the face blank. */
  readonly windows?: number;
}

/**
 * A standing structure: dark mass, a lit vertical seam, stepped setbacks and
 * a run of window slits up one face.
 *
 * The architectural language of the whole site is this shape at different
 * scales — a career milestone, a system module, a wall of the vault. The
 * detail exists so the silhouette reads as built rather than extruded: a
 * plain box at this size reads as a placeholder.
 */
export function Monolith({
  width,
  height,
  depth,
  position,
  rotation = 0,
  getRise,
  color = hex.graphite,
  seam = hex.copperLift,
  seamIntensity = 1.1,
  windows = 0,
}: MonolithProps): React.JSX.Element {
  const shell = useRef<Group>(null);
  const body = useRef<Mesh>(null);
  const light = useRef<Mesh>(null);
  const slits = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  /** Setbacks: the mass steps in twice on its way up. */
  const steps = useMemo(
    () => [
      { y: height * 0.62, w: width * 0.82, d: depth * 0.82, h: height * 0.3 },
      { y: height * 0.86, w: width * 0.58, d: depth * 0.58, h: height * 0.18 },
    ],
    [depth, height, width],
  );

  useFrame(() => {
    const rise = Math.max(0.001, getRise ? getRise() : 1);
    if (shell.current) shell.current.scale.y = rise;

    if (body.current) body.current.position.y = height / 2;
    if (light.current) {
      light.current.position.y = height / 2;
      (light.current.material as MeshStandardMaterial).emissiveIntensity = seamIntensity * rise;
    }

    const mesh = slits.current;
    if (!mesh || windows <= 0 || mesh.userData.placed) return;
    for (let i = 0; i < windows; i += 1) {
      const t = (i + 0.5) / windows;
      dummy.position.set(-width * 0.22, height * t * 0.9 + height * 0.04, depth / 2 + 0.008);
      dummy.scale.set(width * 0.1, height * 0.012, 0.01);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Second column on the same face.
      dummy.position.x = width * 0.14;
      dummy.updateMatrix();
      mesh.setMatrixAt(i + windows, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.userData.placed = true;
  });

  return (
    <group position={[position[0], 0, position[2]]} rotation={[0, rotation, 0]}>
      <group ref={shell}>
        {/* Plinth — grounds the mass instead of letting it float. */}
        <mesh position={[0, height * 0.008, 0]}>
          <boxGeometry args={[width * 1.16, height * 0.016, depth * 1.16]} />
          <meshStandardMaterial color={hex.void} roughness={0.9} metalness={0.2} />
        </mesh>

        <mesh ref={body}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial color={color} roughness={0.72} metalness={0.3} flatShading />
        </mesh>

        {/* Setbacks. */}
        {steps.map((step) => (
          <mesh key={step.y} position={[0, step.y + step.h / 2, 0]}>
            <boxGeometry args={[step.w, step.h, step.d]} />
            <meshStandardMaterial color={color} roughness={0.68} metalness={0.34} flatShading />
          </mesh>
        ))}

        {/* Entablature: a thin bright cap catching the overhead key. */}
        <mesh position={[0, height * 1.045, 0]}>
          <boxGeometry args={[width * 0.64, height * 0.012, depth * 0.64]} />
          <meshStandardMaterial
            color={hex.champagne}
            emissive={hex.champagne}
            emissiveIntensity={0.5}
            roughness={0.4}
            metalness={0.8}
            toneMapped={false}
          />
        </mesh>

        {/* The seam: a sliver of emissive on the leading edge. */}
        <mesh ref={light} position={[width / 2 + 0.012, 0, 0]}>
          <boxGeometry args={[0.03, height, depth * 0.16]} />
          <meshStandardMaterial
            color={seam}
            emissive={seam}
            emissiveIntensity={seamIntensity}
            roughness={0.4}
            toneMapped={false}
          />
        </mesh>

        {windows > 0 ? (
          <instancedMesh
            ref={slits}
            args={[undefined, undefined, windows * 2]}
            frustumCulled={false}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={hex.ember}
              emissive={hex.ember}
              emissiveIntensity={0.8}
              toneMapped={false}
              fog={false}
            />
          </instancedMesh>
        ) : null}
      </group>
    </group>
  );
}
