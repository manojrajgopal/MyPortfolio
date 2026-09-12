'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group, Mesh, MeshStandardMaterial } from 'three';
import { languages } from '@/data/languages/languages';
import { CELL_Z } from '@/lib/three/cameraRig';
import { hex } from '@/lib/three/palette';
import { scaleCount, type PerformanceProfile } from '@/lib/three/performance';
import { DustField } from '@/components/world/primitives/DustField';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { smoothstep } from '@/lib/utils/clamp';

interface LanguageSceneProps {
  readonly profile: PerformanceProfile;
  readonly reducedMotion: boolean;
}

const TONES = [hex.copperLift, hex.champagne, hex.bronze, hex.silver] as const;

/**
 * Chapter 11 — Languages.
 *
 * Four concentric arcs, each drawn to the reach of one language. Almost
 * nothing moves; it is a held beat between the achievement and the horizon.
 */
export function LanguageScene({
  profile,
  reducedMotion,
}: LanguageSceneProps): React.JSX.Element {
  const engine = getScrollEngine();
  const group = useRef<Group>(null);
  const arcs = useRef<(Mesh | null)[]>([]);

  useFrame((state) => {
    const local = engine.localProgress('languages');
    const time = reducedMotion ? 0 : state.clock.elapsedTime;

    if (group.current) group.current.rotation.z = time * 0.02;

    arcs.current.forEach((arc, index) => {
      if (!arc) return;
      const draw = smoothstep(index * 0.12, index * 0.12 + 0.4, local);
      arc.scale.setScalar(draw);
      const material = arc.material as MeshStandardMaterial;
      material.emissiveIntensity = 0.4 + draw * 1.1;
      material.opacity = draw * 0.9;
    });
  });

  return (
    // Held to the right so the four names keep the left of the frame.
    <group position={[3.4, 2.2, CELL_Z.languages]}>
      <group ref={group}>
        {languages.map((language, index) => (
          <mesh
            key={language.id}
            ref={(node) => {
              arcs.current[index] = node;
            }}
            rotation={[0, 0, Math.PI * 0.5]}
          >
            <torusGeometry
              args={[1.1 + index * 0.52, 0.012, 6, 96, Math.PI * 1.5 * language.level]}
            />
            <meshStandardMaterial
              color={TONES[index % TONES.length]}
              emissive={TONES[index % TONES.length]}
              emissiveIntensity={0.8}
              roughness={0.34}
              metalness={0.86}
              transparent
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      <DustField
        count={scaleCount(280, profile, 60)}
        spread={[9, 6, 7]}
        color={hex.parchment}
        opacity={0.2}
        size={7}
        rise={0.06}
        still={reducedMotion}
      />
    </group>
  );
}
