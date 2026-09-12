'use client';

import { education } from '@/data/education/education';
import { CELL_Z } from '@/lib/three/cameraRig';
import { hex } from '@/lib/three/palette';
import { scaleCount, type PerformanceProfile } from '@/lib/three/performance';
import { DustField } from '@/components/world/primitives/DustField';
import { LightShaft } from '@/components/world/primitives/LightShaft';
import { Monolith } from '@/components/world/primitives/Monolith';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { smoothstep } from '@/lib/utils/clamp';

interface EducationSceneProps {
  readonly profile: PerformanceProfile;
  readonly reducedMotion: boolean;
}

/** Tallest and most recent first — the camera flies past them in order. */
const LAYOUT = [
  { x: -5.4, z: 14, rotation: 0.24 },
  { x: 5.8, z: -8, rotation: -0.3 },
  { x: -4.6, z: -30, rotation: 0.18 },
] as const;

const MAX_HEIGHT = 26;

/**
 * Chapter 08 — Education.
 *
 * Three standing structures in an empty plain, scaled by how far each stage
 * carried him. The camera moves between them; hard architectural light falls
 * from above. Every year and institution is named in the overlay, not here.
 */
export function EducationScene({
  profile,
  reducedMotion,
}: EducationSceneProps): React.JSX.Element {
  const engine = getScrollEngine();

  return (
    <group position={[0, -4, CELL_Z.education]}>
      {education.map((entry, index) => {
        const layout = LAYOUT[index] ?? LAYOUT[0];
        const delay = index * 0.2;

        return (
          <group key={entry.id}>
            <Monolith
              width={3.4}
              height={MAX_HEIGHT * entry.elevation}
              depth={3.4}
              position={[layout.x, 0, layout.z]}
              rotation={layout.rotation}
              color={hex.graphite}
              seam={index === 0 ? hex.copperLift : hex.bronze}
              seamIntensity={index === 0 ? 1.4 : 0.7}
              windows={10 - index * 2}
              getRise={() =>
                smoothstep(delay, delay + 0.42, engine.localProgress('education'))
              }
            />

            {/* One shaft per structure, falling on its lit face. */}
            <LightShaft
              width={4.2}
              height={MAX_HEIGHT * entry.elevation + 6}
              color={hex.parchment}
              opacity={0.05}
              position={[layout.x + 1.6, MAX_HEIGHT * entry.elevation * 0.5, layout.z]}
            />
          </group>
        );
      })}

      {/* Ground: a dark plane that catches just enough light to exist. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -8]}>
        <planeGeometry args={[90, 120]} />
        <meshStandardMaterial color={hex.void} roughness={0.94} metalness={0.1} />
      </mesh>

      <DustField
        count={scaleCount(650, profile, 130)}
        spread={[28, 20, 50]}
        color={hex.silver}
        opacity={0.24}
        size={9}
        rise={0.12}
        still={reducedMotion}
      />
    </group>
  );
}
