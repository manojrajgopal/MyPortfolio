'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { Mesh } from 'three';
import { skillGroups } from '@/data/skills/skills';
import { CELL_Z } from '@/lib/three/cameraRig';
import { hex } from '@/lib/three/palette';
import { createRimMaterial } from '@/lib/three/rimMaterial';
import { scaleCount, type PerformanceProfile } from '@/lib/three/performance';
import { DustField } from '@/components/world/primitives/DustField';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { smoothstep } from '@/lib/utils/clamp';
import { SkillsOrbit } from './SkillsOrbit';

interface SkillsUniverseProps {
  readonly profile: PerformanceProfile;
  readonly reducedMotion: boolean;
}

/**
 * Chapter 07 — The technology constellation.
 *
 * Seven shells around one core. Nothing is measured, ranked or given a
 * percentage; a technology is either in the sky or it is not. The camera
 * orbits the whole system while the overlay names what is in each shell.
 */
export function SkillsUniverse({
  profile,
  reducedMotion,
}: SkillsUniverseProps): React.JSX.Element {
  const engine = getScrollEngine();
  const core = useRef<Mesh>(null);
  const halo = useRef<Mesh>(null);

  /**
   * The core is a machined object, not a light source. It was previously
   * emissive enough to clear the bloom threshold, which turned the centre of
   * the chapter into a sun and swallowed the type in front of it.
   */
  const coreMaterial = useMemo(
    () =>
      createRimMaterial({
        color: hex.copperDeep,
        emissive: hex.ember,
        emissiveIntensity: 0.32,
        roughness: 0.3,
        metalness: 0.94,
        rim: 1.4,
        rimPower: 2.1,
        rimColor: hex.ember,
        flatShading: true,
      }),
    [],
  );

  useEffect(() => () => coreMaterial.dispose(), [coreMaterial]);

  useFrame((state) => {
    const local = engine.localProgress('skills');
    const time = reducedMotion ? 0 : state.clock.elapsedTime;
    const ignition = smoothstep(0, 0.24, local);

    if (core.current) {
      core.current.rotation.y = time * 0.14;
      core.current.rotation.x = time * 0.06;
      core.current.scale.setScalar(0.5 + ignition * 0.5);
      coreMaterial.emissiveIntensity = 0.22 + ignition * 0.34 + Math.sin(time * 0.9) * 0.05;
      coreMaterial.userData.rim.uRim.value = 1.2 + Math.sin(time * 0.6) * 0.3;
    }

    if (halo.current) {
      halo.current.rotation.z = -time * 0.08;
      halo.current.scale.setScalar(ignition);
    }
  });

  return (
    // Set low and slightly left so the orbits sweep behind the type rather
    // than sitting on top of it.
    <group position={[-1.2, 0.5, CELL_Z.skills]}>
      {/* The core: the person at the centre of the system. */}
      <mesh ref={core} material={coreMaterial}>
        <icosahedronGeometry args={[0.66, 1]} />
      </mesh>

      <mesh ref={halo} rotation={[Math.PI / 2.6, 0, 0]}>
        <torusGeometry args={[1.2, 0.006, 4, 96]} />
        <meshStandardMaterial
          color={hex.champagne}
          emissive={hex.champagne}
          emissiveIntensity={0.5}
          toneMapped={false}
        />
      </mesh>

      {skillGroups.map((group, index) => (
        <SkillsOrbit
          key={group.id}
          group={group}
          order={index}
          total={skillGroups.length}
          reducedMotion={reducedMotion}
        />
      ))}

      {/* Starfield: still, so the orbits read as the only moving thing. */}
      <DustField
        count={scaleCount(1100, profile, 220)}
        spread={[40, 26, 40]}
        color={hex.parchment}
        opacity={0.42}
        size={7}
        still
      />
    </group>
  );
}
