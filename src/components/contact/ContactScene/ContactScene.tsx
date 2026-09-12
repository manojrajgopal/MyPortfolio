'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { ACESFilmicToneMapping, FogExp2, type Group, type Mesh } from 'three';
import { hex } from '@/lib/three/palette';
import { detectPerformance, scaleCount } from '@/lib/three/performance';
import { DustField } from '@/components/world/primitives/DustField';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * A separate, much smaller world for the contact route.
 *
 * One object: a signal beacon — nested rings turning around a warm core,
 * with a pulse that travels outward. It is the same visual language as the
 * main experience at a fraction of the cost.
 */
export function ContactScene(): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const profile = useMemo(detectPerformance, []);

  return (
    <div className="world" aria-hidden="true">
      <Canvas
        dpr={[profile.dpr[0], Math.min(profile.dpr[1], 1.75)]}
        camera={{ fov: 40, position: [0, 0.4, 7.4], near: 0.1, far: 60 }}
        gl={{ antialias: profile.tier !== 'low', alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.94;
          scene.fog = new FogExp2(hex.void, 0.052);
        }}
      >
        <color attach="background" args={[hex.obsidian]} />
        <ambientLight intensity={0.34} color={hex.stone} />
        <directionalLight position={[-6, 4, 6]} intensity={1.2} color={hex.ember} />
        <directionalLight position={[8, -2, -4]} intensity={0.6} color={hex.emerald} />

        {/* Set low and slightly right, so it reads between the two columns of
            the page rather than behind the words of either one. */}
        <group position={[0.9, -1.9, 0.4]} scale={1.15}>
          <Beacon reducedMotion={reducedMotion} />
        </group>

        <DustField
          count={scaleCount(500, profile, 110)}
          spread={[14, 9, 12]}
          color={hex.champagne}
          opacity={0.32}
          size={10}
          rise={0.14}
          still={reducedMotion}
        />
      </Canvas>
    </div>
  );
}

function Beacon({ reducedMotion }: { readonly reducedMotion: boolean }): React.JSX.Element {
  const root = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const core = useRef<Mesh>(null);

  useFrame((state) => {
    if (reducedMotion) return;
    const time = state.clock.elapsedTime;
    if (root.current) {
      root.current.rotation.y = time * 0.12;
      root.current.rotation.x = Math.sin(time * 0.2) * 0.14;
    }
    if (inner.current) {
      inner.current.rotation.z = -time * 0.24;
      inner.current.rotation.x = time * 0.16;
    }
    if (core.current) {
      const pulse = 1 + Math.sin(time * 1.4) * 0.06;
      core.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={root}>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.62, 1]} />
        <meshStandardMaterial
          color={hex.bronze}
          emissive={hex.copperDeep}
          emissiveIntensity={0.55}
          roughness={0.34}
          metalness={0.94}
          flatShading
        />
      </mesh>

      <group ref={inner}>
        <mesh>
          <torusGeometry args={[1.5, 0.02, 8, 128]} />
          <meshStandardMaterial
            color={hex.copperLift}
            emissive={hex.copper}
            emissiveIntensity={0.8}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[2.2, 0.014, 8, 128]} />
          <meshStandardMaterial
            color={hex.champagne}
            emissive={hex.champagne}
            emissiveIntensity={0.45}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[0, Math.PI / 3, Math.PI / 5]}>
          <torusGeometry args={[3, 0.011, 8, 128]} />
          <meshStandardMaterial
            color={hex.emeraldLift}
            emissive={hex.emerald}
            emissiveIntensity={0.4}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}
