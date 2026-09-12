'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { AdditiveBlending, type Mesh, type MeshBasicMaterial } from 'three';
import { CELL_Z } from '@/lib/three/cameraRig';
import { hex } from '@/lib/three/palette';
import { scaleCount, type PerformanceProfile } from '@/lib/three/performance';
import { softSprite } from '@/lib/three/textures';
import { DustField } from '@/components/world/primitives/DustField';
import { Ridgeline } from '@/components/world/primitives/Ridgeline';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { smoothstep } from '@/lib/utils/clamp';

interface FinalSceneProps {
  readonly profile: PerformanceProfile;
  readonly reducedMotion: boolean;
}

/**
 * Chapter 12 — Horizon.
 *
 * The last frame deliberately has the least in it. The structures, networks
 * and vaults are gone; what is left is the range from the opening shot, lit
 * from the far side, with the camera lifting away from it.
 *
 * Same curiosity, bigger horizons.
 */
export function FinalScene({ profile, reducedMotion }: FinalSceneProps): React.JSX.Element {
  const engine = getScrollEngine();
  const sun = useRef<Mesh>(null);
  const glow = useRef<Mesh>(null);

  useFrame((state) => {
    const local = engine.localProgress('final');
    const time = reducedMotion ? 0 : state.clock.elapsedTime;
    const rise = smoothstep(0, 0.9, local);

    if (sun.current) {
      sun.current.position.y = -1.2 + rise * 3.4;
      sun.current.scale.setScalar(14 + rise * 9);
      (sun.current.material as MeshBasicMaterial).opacity = 0.3 + rise * 0.5;
    }

    if (glow.current) {
      glow.current.scale.setScalar(42 + rise * 24 + Math.sin(time * 0.3) * 1.2);
      (glow.current.material as MeshBasicMaterial).opacity = 0.1 + rise * 0.2;
    }
  });

  return (
    <group position={[0, 0, CELL_Z.final]}>
      {/* Atmospheric bloom behind the range. */}
      <mesh ref={glow} position={[0, 0, -78]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={softSprite()}
          color={hex.copperDeep}
          transparent
          opacity={0.1}
          depthWrite={false}
          blending={AdditiveBlending}
          fog={false}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={sun} position={[0, -1.2, -70]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={softSprite()}
          color={hex.ember}
          transparent
          opacity={0.3}
          depthWrite={false}
          blending={AdditiveBlending}
          fog={false}
          toneMapped={false}
        />
      </mesh>

      {/* Three ranges, and nothing else. */}
      <Ridgeline
        width={260}
        depth={70}
        segments={profile.segments}
        height={10}
        seed={11}
        color={hex.void}
        position={[0, -6, -24]}
      />
      <Ridgeline
        width={360}
        depth={80}
        segments={Math.round(profile.segments * 0.7)}
        height={17}
        seed={29}
        color={hex.obsidian}
        position={[-14, -8, -46]}
      />
      <Ridgeline
        width={460}
        depth={80}
        segments={Math.round(profile.segments * 0.5)}
        height={24}
        seed={53}
        color={hex.graphite}
        position={[10, -10, -66]}
        opacity={0.6}
      />

      <DustField
        count={scaleCount(540, profile, 120)}
        spread={[50, 18, 40]}
        color={hex.ember}
        opacity={0.28}
        size={10}
        rise={0.1}
        still={reducedMotion}
      />
    </group>
  );
}
