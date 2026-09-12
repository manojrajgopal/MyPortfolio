'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  Object3D,
  type Group,
  type InstancedMesh,
  type Mesh,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
} from 'three';
import { hex } from '@/lib/three/palette';
import { scaleCount, type PerformanceProfile } from '@/lib/three/performance';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { clamp, mapRange, smoothstep } from '@/lib/utils/clamp';

interface VoiceSceneProps {
  readonly z: number;
  readonly from: number;
  readonly to: number;
  readonly profile: PerformanceProfile;
  readonly reducedMotion: boolean;
}

const RING_COUNT = 6;

/**
 * Project 03 — Voice Assistant.
 *
 * An utterance crossing a room, in three parts: a linear waveform running the
 * width of the frame, a radial analyser turning around the point of speech,
 * and rings expanding away from it. As the chapter plays the noise resolves
 * into a single clean carrier — the moment the assistant stops hearing sound
 * and starts understanding a command.
 */
export function VoiceScene({
  z,
  from,
  to,
  profile,
  reducedMotion,
}: VoiceSceneProps): React.JSX.Element {
  const engine = getScrollEngine();
  const bars = useRef<InstancedMesh>(null);
  const radial = useRef<InstancedMesh>(null);
  const radialGroup = useRef<Group>(null);
  const rings = useRef<(Mesh | null)[]>([]);
  const core = useRef<Mesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  const barCount = scaleCount(112, profile, 40);
  const radialCount = scaleCount(64, profile, 26);

  /** Fixed per-bar randomness so the waveform is noisy but never jittery. */
  const seeds = useMemo(
    () => Array.from({ length: Math.max(barCount, radialCount) }, () => Math.random() * Math.PI * 2),
    [barCount, radialCount],
  );

  useFrame((state) => {
    const local = mapRange(engine.localProgress('projects'), from, to);
    const time = reducedMotion ? local * 6 : state.clock.elapsedTime;

    const listening = smoothstep(0.04, 0.36, local);
    // Understanding: noise gives way to a single clean carrier.
    const understood = smoothstep(0.42, 0.9, local);

    const mesh = bars.current;
    if (mesh) {
      for (let i = 0; i < barCount; i += 1) {
        const u = i / (barCount - 1);
        const x = (u - 0.5) * 11;

        const noise =
          Math.sin(time * 5 + seeds[i]!) * 0.5 + Math.sin(time * 11.3 + seeds[i]! * 2.1) * 0.28;
        const carrier = Math.sin(u * Math.PI * 6 - time * 2.4) * Math.sin(u * Math.PI);

        const amplitude =
          listening * (noise * (1 - understood) + carrier * understood) * (0.5 + understood * 0.9);

        const height = 0.04 + Math.abs(amplitude) * 1.6;
        dummy.position.set(x, height / 2 - 0.6, 0);
        dummy.scale.set(0.032, height, 0.032);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }

    // Radial analyser: the same signal, wrapped around the source.
    const radialMesh = radial.current;
    if (radialMesh) {
      for (let i = 0; i < radialCount; i += 1) {
        const angle = (i / radialCount) * Math.PI * 2;
        const noise = Math.sin(time * 4.4 + seeds[i]!) * 0.5 + 0.5;
        const carrier = 0.5 + 0.5 * Math.sin(angle * 3 - time * 1.8);
        const amplitude = listening * (noise * (1 - understood) + carrier * understood);
        const length = 0.14 + amplitude * 0.62;

        dummy.position.set(
          Math.cos(angle) * (1.5 + length / 2),
          0,
          Math.sin(angle) * (1.5 + length / 2),
        );
        dummy.rotation.set(0, -angle, 0);
        dummy.scale.set(length, 0.024, 0.024);
        dummy.updateMatrix();
        radialMesh.setMatrixAt(i, dummy.matrix);
      }
      radialMesh.instanceMatrix.needsUpdate = true;
    }

    if (radialGroup.current) radialGroup.current.rotation.y = time * 0.12;

    rings.current.forEach((ring, index) => {
      if (!ring) return;
      const phase = (time * 0.3 + index / RING_COUNT) % 1;
      ring.scale.setScalar(0.4 + phase * 8);
      const material = ring.material as MeshBasicMaterial;
      material.opacity = clamp(1 - phase) * 0.28 * listening;
    });

    if (core.current) {
      const pulse = 1 + Math.sin(time * 2.2) * 0.14 * listening;
      core.current.scale.setScalar(pulse);
      (core.current.material as MeshStandardMaterial).emissiveIntensity =
        1.4 + listening * 1.4 + understood * 0.6;
    }
  });

  return (
    <group position={[0, 0, z]}>
      {/* Linear waveform. */}
      <instancedMesh ref={bars} args={[undefined, undefined, barCount]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={hex.champagne}
          emissive={hex.copperLift}
          emissiveIntensity={0.9}
          roughness={0.36}
          metalness={0.7}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Radial analyser around the source. */}
      <group ref={radialGroup} position={[0, -0.62, 0]}>
        <instancedMesh
          ref={radial}
          args={[undefined, undefined, radialCount]}
          frustumCulled={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={hex.emeraldLift}
            emissive={hex.emerald}
            emissiveIntensity={1}
            roughness={0.4}
            metalness={0.6}
            toneMapped={false}
          />
        </instancedMesh>

        {/* The ring the analyser stands on. */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.46, 1.5, 96]} />
          <meshStandardMaterial
            color={hex.bronze}
            emissive={hex.copperDeep}
            emissiveIntensity={0.7}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Rings expanding from the point of speech, flat to the floor. */}
      {Array.from({ length: RING_COUNT }, (_, index) => (
        <mesh
          key={index}
          ref={(node) => {
            rings.current[index] = node;
          }}
          position={[0, -0.63, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.97, 1, 84]} />
          <meshBasicMaterial
            color={hex.emeraldLift}
            transparent
            opacity={0}
            depthWrite={false}
            blending={AdditiveBlending}
            fog={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* The source: a small, steady presence at the centre. */}
      <mesh ref={core} position={[0, -0.62, 0]}>
        <icosahedronGeometry args={[0.13, 1]} />
        <meshStandardMaterial
          color={hex.ember}
          emissive={hex.ember}
          emissiveIntensity={2}
          flatShading
          toneMapped={false}
        />
      </mesh>

      <pointLight position={[0, 0.6, 2.4]} color={hex.copperLift} intensity={12} distance={12} />
      <pointLight position={[0, -0.4, -1.6]} color={hex.emerald} intensity={8} distance={9} />
    </group>
  );
}
