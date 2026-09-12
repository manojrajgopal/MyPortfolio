'use client';

import { CELL_Z } from '@/lib/three/cameraRig';
import { hex } from '@/lib/three/palette';
import { scaleCount, type PerformanceProfile } from '@/lib/three/performance';
import { DustField } from '@/components/world/primitives/DustField';
import { LightShaft } from '@/components/world/primitives/LightShaft';
import { Monolith } from '@/components/world/primitives/Monolith';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { smoothstep } from '@/lib/utils/clamp';
import { CodeLattice } from './CodeLattice';

interface EngineeringSceneProps {
  readonly profile: PerformanceProfile;
  readonly reducedMotion: boolean;
}

/** Supporting structures, each rising on its own beat. */
const TOWERS = [
  { x: -11, z: -8, w: 2.4, h: 22, d: 2.4, delay: 0 },
  { x: 12, z: -14, w: 3.1, h: 30, d: 3.1, delay: 0.12 },
  { x: -16, z: -22, w: 1.8, h: 16, d: 1.8, delay: 0.24 },
  { x: 18, z: -30, w: 2.6, h: 38, d: 2.6, delay: 0.36 },
  { x: -6, z: -36, w: 4.2, h: 26, d: 4.2, delay: 0.48 },
] as const;

/**
 * Chapter 03 — Engineering.
 *
 * Loose fragments converge into a lattice at the centre while structures
 * rise around it. Nothing here is ornament: the assembly is the argument.
 */
export function EngineeringScene({
  profile,
  reducedMotion,
}: EngineeringSceneProps): React.JSX.Element {
  const engine = getScrollEngine();

  return (
    <group position={[0, -2.4, CELL_Z.engineering]}>
      <CodeLattice count={scaleCount(120, profile, 40)} reducedMotion={reducedMotion} />

      {TOWERS.map((tower) => (
        <Monolith
          key={`${tower.x}:${tower.z}`}
          width={tower.w}
          height={tower.h}
          depth={tower.d}
          position={[tower.x, 0, tower.z]}
          color={hex.obsidian}
          seam={hex.copper}
          seamIntensity={0.9}
          getRise={() =>
            smoothstep(tower.delay, tower.delay + 0.38, engine.localProgress('engineering'))
          }
        />
      ))}

      {/* Hard architectural light falling between the structures. */}
      <LightShaft
        width={7}
        height={40}
        color={hex.parchment}
        opacity={0.09}
        position={[6, 12, -18]}
        rotation={[0, 0.2, -0.08]}
      />
      <LightShaft
        width={5}
        height={34}
        color={hex.copperLift}
        opacity={0.07}
        position={[-9, 10, -26]}
        rotation={[0, -0.3, 0.1]}
      />

      <DustField
        count={scaleCount(600, profile, 120)}
        spread={[28, 16, 32]}
        color={hex.silver}
        opacity={0.26}
        size={9}
        rise={0.14}
        still={reducedMotion}
      />
    </group>
  );
}
