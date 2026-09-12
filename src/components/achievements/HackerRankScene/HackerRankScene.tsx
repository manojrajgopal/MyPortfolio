'use client';

import { CELL_Z } from '@/lib/three/cameraRig';
import { hex } from '@/lib/three/palette';
import { scaleCount, type PerformanceProfile } from '@/lib/three/performance';
import { DustField } from '@/components/world/primitives/DustField';
import { CertificationSeal } from './CertificationSeal';

interface HackerRankSceneProps {
  readonly profile: PerformanceProfile;
  readonly reducedMotion: boolean;
}

/**
 * Chapter 10 — Achievement.
 *
 * One object in an empty frame. No set, no supporting structure: the seal
 * closes, and the chapter ends. It is held in the upper half so the wording
 * sits clear beneath it rather than across it.
 */
export function HackerRankScene({
  profile,
  reducedMotion,
}: HackerRankSceneProps): React.JSX.Element {
  return (
    <group position={[0, 3.6, CELL_Z.achievement]}>
      <CertificationSeal
        reducedMotion={reducedMotion}
        notchCount={profile.tier === 'low' ? 18 : 32}
      />

      <DustField
        count={scaleCount(300, profile, 70)}
        spread={[9, 7, 6]}
        color={hex.emeraldLift}
        opacity={0.28}
        size={7}
        rise={0.05}
        still={reducedMotion}
      />
    </group>
  );
}
