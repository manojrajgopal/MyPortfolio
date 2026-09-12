'use client';

import { useThree } from '@react-three/fiber';

import { CELL_Z } from '@/lib/three/cameraRig';
import { hex } from '@/lib/three/palette';
import { scaleCount, type PerformanceProfile } from '@/lib/three/performance';
import { DustField } from '@/components/world/primitives/DustField';
import { LightShaft } from '@/components/world/primitives/LightShaft';
import { Ridgeline } from '@/components/world/primitives/Ridgeline';
import { useThemeHex } from '@/hooks/useResolvedTheme';
import { EnergyOrb } from './EnergyOrb';

interface HeroSceneProps {
  readonly profile: PerformanceProfile;
  readonly reducedMotion: boolean;
}

/**
 * Chapter 01 — Arrival.
 *
 * A dark chamber with one thing in it: an orb of nested energy shells turning
 * against each other. The ranges that used to describe a landscape here are
 * pulled back to a single low silhouette, so the orb is unmistakably the
 * source of light in the frame rather than one object among several.
 */
export function HeroScene({ profile, reducedMotion }: HeroSceneProps): React.JSX.Element {
  const z = CELL_Z.intro;

  /**
   * The orb is held right of the name on a wide frame. A portrait frame is far
   * narrower in world units, so the same offset puts it outside the shot
   * entirely — it centres instead, and rises above the type, which sits at the
   * bottom of the frame on a phone.
   */
  const { width, height } = useThree((state) => state.size);
  const portrait = Math.max(0, Math.min(1, (1.05 - width / Math.max(1, height)) / 0.55));
  // Further out than the old artifact needed: the orb is a wide, bright disc
  // and at 3.4 it sat directly on the last letter of the name.
  const offsetX = 5.3 * (1 - portrait);
  const offsetY = 1.9 + portrait * 1.1;

  /**
   * A portrait frame sees far more of the world vertically, so the range that
   * sits politely along the horizon on a wide screen climbs into the middle of
   * the shot and swallows the type beneath it. It drops away, and the orb
   * gives back a little scale.
   */
  const ridgeDrop = portrait * 7;
  const orbScale = 1 - portrait * 0.22;

  /**
   * Obsidian is right for the dark chamber, where the range is a silhouette
   * the orb picks out. On paper it turns into a grey slab filling the bottom
   * of the frame, swallowing the scroll cue and the chapter marker. The light
   * world takes a warm sand instead, so the floor still reads but stays inside
   * the paper's own value range.
   */
  const ridgeColor = useThemeHex(hex.obsidian, hex.champagne);

  return (
    <group position={[0, 0, z]}>
      <group position={[offsetX, offsetY, 0]} scale={orbScale}>
        <EnergyOrb reducedMotion={reducedMotion} profile={profile} />
      </group>

      {/* Two shafts crossing behind the orb, reading as the chamber it hangs
          in. Both take the orb's colour rather than the old distant sunrise. */}
      <LightShaft
        width={14}
        height={40}
        color={hex.ember}
        opacity={0.1}
        position={[offsetX - 5.5, 3, -13]}
        rotation={[0, 0.42, 0.2]}
        pulse={reducedMotion ? 0 : 0.3}
      />
      <LightShaft
        width={10}
        height={34}
        color={hex.copperLift}
        opacity={0.07}
        position={[offsetX + 4.5, 2, -16]}
        rotation={[0, -0.36, -0.16]}
        pulse={reducedMotion ? 0 : 0.22}
      />

      {/* One low range, far enough down to read as a floor the light falls on
          rather than as a landscape competing with the orb. */}
      <Ridgeline
        width={200}
        depth={70}
        segments={Math.round(profile.segments * 0.6)}
        height={9}
        seed={29}
        color={ridgeColor}
        position={[0, -11 - ridgeDrop * 1.2, -30]}
      />

      {/* Motes take the orb's warmth, so the air around it belongs to it.
          Smaller and fainter than the other chapters use: the orb now carries
          its own halo of orbiting sparks, and dust at the old size read as
          pale discs competing with them rather than as suspended air. */}
      <DustField
        count={scaleCount(620, profile, 140)}
        spread={[30, 16, 34]}
        color={hex.ember}
        opacity={0.2}
        size={7}
        rise={0.18}
        still={reducedMotion}
      />
    </group>
  );
}
