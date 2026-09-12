'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { AdditiveBlending, type Group, type Mesh, type MeshBasicMaterial } from 'three';
import { CELL_Z } from '@/lib/three/cameraRig';
import { hex } from '@/lib/three/palette';
import { scaleCount, type PerformanceProfile } from '@/lib/three/performance';
import { softSprite } from '@/lib/three/textures';
import { DustField } from '@/components/world/primitives/DustField';
import { Ridgeline } from '@/components/world/primitives/Ridgeline';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { smoothstep } from '@/lib/utils/clamp';

interface IdentitySceneProps {
  readonly profile: PerformanceProfile;
  readonly reducedMotion: boolean;
}

/**
 * Chapter 02 — Identity.
 *
 * The frame opens out. Four ranges recede into the fog and a low sun comes
 * up behind them: same curiosity, bigger horizons. The camera passes through
 * a slow arc of light on its way out of the chapter.
 */
export function IdentityScene({
  profile,
  reducedMotion,
}: IdentitySceneProps): React.JSX.Element {
  const engine = getScrollEngine();
  const glow = useRef<Mesh>(null);
  const arc = useRef<Group>(null);

  useFrame((state) => {
    const local = engine.localProgress('identity');
    const time = reducedMotion ? 0 : state.clock.elapsedTime;

    if (glow.current) {
      const material = glow.current.material as MeshBasicMaterial;
      // The sun rises as the chapter plays.
      material.opacity = 0.2 + smoothstep(0, 0.85, local) * 0.5;
      glow.current.position.y = -2 + smoothstep(0, 1, local) * 4.6;
      glow.current.scale.setScalar(26 + local * 10);
    }

    if (arc.current) {
      arc.current.rotation.z = time * 0.05 + local * 0.7;
      arc.current.rotation.x = 0.12 + Math.sin(time * 0.14) * 0.04;
    }
  });

  return (
    <group position={[0, 0, CELL_Z.identity]}>
      {/* The sun: one sprite, never a lens flare. */}
      <mesh ref={glow} position={[0, -2, -54]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={softSprite()}
          color={hex.ember}
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={AdditiveBlending}
          fog={false}
          toneMapped={false}
        />
      </mesh>

      {/* Four ranges, each further and paler — depth from atmosphere alone. */}
      <Ridgeline
        width={180}
        depth={60}
        segments={profile.segments}
        height={7}
        seed={3}
        color={hex.obsidian}
        position={[-10, -8, -8]}
      />
      <Ridgeline
        width={240}
        depth={70}
        segments={Math.round(profile.segments * 0.8)}
        height={11}
        seed={17}
        color={hex.graphite}
        position={[8, -9, -26]}
      />
      <Ridgeline
        width={320}
        depth={80}
        segments={Math.round(profile.segments * 0.6)}
        height={16}
        seed={41}
        color={hex.ash}
        position={[-6, -10, -44]}
      />
      <Ridgeline
        width={420}
        depth={70}
        segments={Math.round(profile.segments * 0.4)}
        height={22}
        seed={59}
        color={hex.stone}
        position={[4, -12, -66]}
        opacity={0.55}
      />

      {/* The arc the camera flies through — an aperture, not an ornament. */}
      <group ref={arc} position={[0, 2.2, -22]}>
        <mesh>
          <torusGeometry args={[13, 0.035, 8, 128]} />
          <meshStandardMaterial
            color={hex.copperLift}
            emissive={hex.copper}
            emissiveIntensity={1.6}
            roughness={0.3}
            metalness={0.9}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 3]}>
          <torusGeometry args={[17.5, 0.018, 6, 96]} />
          <meshStandardMaterial
            color={hex.champagne}
            emissive={hex.champagne}
            emissiveIntensity={0.7}
            roughness={0.4}
            metalness={0.7}
            toneMapped={false}
          />
        </mesh>
      </group>

      <DustField
        count={scaleCount(700, profile, 140)}
        spread={[44, 18, 46]}
        color={hex.champagne}
        opacity={0.3}
        size={11}
        rise={0.2}
        still={reducedMotion}
      />
    </group>
  );
}
