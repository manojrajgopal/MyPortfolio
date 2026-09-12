'use client';

import { useThree } from '@react-three/fiber';

import { CELL_Z } from '@/lib/three/cameraRig';
import { hex } from '@/lib/three/palette';
import { scaleCount, type PerformanceProfile } from '@/lib/three/performance';
import { DustField } from '@/components/world/primitives/DustField';
import { LightShaft } from '@/components/world/primitives/LightShaft';
import { Ridgeline } from '@/components/world/primitives/Ridgeline';
import { HeroArtifact } from './HeroArtifact';

interface HeroSceneProps {
  readonly profile: PerformanceProfile;
  readonly reducedMotion: boolean;
}

/**
 * Chapter 01 — Arrival.
 *
 * Near-total darkness, one warm source a long way off, a range of ridges
 * barely separating ground from sky, and an object assembling itself at the
 * centre. The camera starts ninety units out and closes in.
 */
export function HeroScene({ profile, reducedMotion }: HeroSceneProps): React.JSX.Element {
  const z = CELL_Z.intro;

  /**
   * The artifact is held right of the name on a wide frame. A portrait frame
   * is far narrower in world units, so the same offset puts it outside the
   * shot entirely — it centres instead, and rises above the type, which sits
   * at the bottom of the frame on a phone.
   */
  const { width, height } = useThree((state) => state.size);
  const portrait = Math.max(0, Math.min(1, (1.05 - width / Math.max(1, height)) / 0.55));
  const offsetX = 3.4 * (1 - portrait);
  const offsetY = 1.5 + portrait * 1.3;

  /**
   * A portrait frame sees far more of the world vertically, so the ranges
   * that sit politely along the horizon on a wide screen climb into the
   * middle of the shot and swallow the type beneath it. They drop away, and
   * the artifact gives back a little scale.
   */
  const ridgeDrop = portrait * 7;
  const artifactScale = 1 - portrait * 0.22;

  return (
    <group position={[0, 0, z]}>
      {/* Held up and to the right: the name owns the left of the frame. */}
      <group position={[offsetX, offsetY, 0]} scale={artifactScale}>
        <HeroArtifact
          shardCount={scaleCount(140, profile, 32)}
          detail={profile.tier === 'low' ? 0 : 1}
          reducedMotion={reducedMotion}
        />
      </group>

      {/* A single distant source, off to the left, behind everything. */}
      <LightShaft
        width={16}
        height={46}
        color={hex.ember}
        opacity={0.12}
        position={[-13, 4, -12]}
        rotation={[0, 0.4, 0.16]}
        pulse={reducedMotion ? 0 : 0.32}
      />

      {/* Ground plane implied, never stated. */}
      <Ridgeline
        width={140}
        depth={70}
        segments={profile.segments}
        height={8}
        seed={11}
        color={hex.obsidian}
        position={[0, -8 - ridgeDrop, -18]}
      />
      <Ridgeline
        width={200}
        depth={70}
        segments={Math.round(profile.segments * 0.6)}
        height={14}
        seed={29}
        color={hex.graphite}
        position={[0, -10 - ridgeDrop * 1.2, -32]}
      />

      <DustField
        count={scaleCount(520, profile, 120)}
        spread={[30, 16, 34]}
        color={hex.parchment}
        opacity={0.3}
        size={12}
        rise={0.16}
        still={reducedMotion}
      />
    </group>
  );
}
