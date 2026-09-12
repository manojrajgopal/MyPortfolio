'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, DoubleSide, type Mesh, type MeshBasicMaterial } from 'three';
import { shaftGradient } from '@/lib/three/textures';

interface LightShaftProps {
  readonly width: number;
  readonly height: number;
  readonly color: number;
  readonly opacity?: number;
  readonly position?: readonly [number, number, number];
  readonly rotation?: readonly [number, number, number];
  /** Slow brightness breathing. Disabled for reduced motion. */
  readonly pulse?: number;
}

/**
 * A billboard-free volumetric suggestion: two crossed gradient planes read as
 * a shaft of light without any raymarching cost. Used where a single source
 * needs to be felt rather than seen.
 */
export function LightShaft({
  width,
  height,
  color,
  opacity = 0.22,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  pulse = 0,
}: LightShaftProps): React.JSX.Element {
  const first = useRef<Mesh>(null);
  const second = useRef<Mesh>(null);
  const texture = useMemo(() => shaftGradient(), []);

  useFrame((state) => {
    if (pulse <= 0) return;
    const value = opacity * (1 + Math.sin(state.clock.elapsedTime * pulse) * 0.18);
    const a = first.current?.material as MeshBasicMaterial | undefined;
    const b = second.current?.material as MeshBasicMaterial | undefined;
    if (a) a.opacity = value;
    if (b) b.opacity = value * 0.7;
  });

  return (
    <group position={[...position]} rotation={[...rotation]}>
      <mesh ref={first}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={texture}
          color={color}
          transparent
          opacity={opacity}
          depthWrite={false}
          blending={AdditiveBlending}
          fog={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={second} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[width * 0.8, height]} />
        <meshBasicMaterial
          map={texture}
          color={color}
          transparent
          opacity={opacity * 0.7}
          depthWrite={false}
          blending={AdditiveBlending}
          fog={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
