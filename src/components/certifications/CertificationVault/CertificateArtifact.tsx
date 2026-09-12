'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { Group, Mesh, MeshStandardMaterial } from 'three';
import { hex } from '@/lib/three/palette';
import { slabGeometry } from '@/lib/three/shapes';
import { createRimMaterial } from '@/lib/three/rimMaterial';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { interaction } from '@/lib/state/interactionStore';
import { smoothstep } from '@/lib/utils/clamp';
import { damp } from '@/lib/utils/lerp';

interface CertificateArtifactProps {
  readonly id: string;
  readonly position: readonly [number, number, number];
  /** Local progress at which this artifact settles into place. */
  readonly arrival: number;
  readonly reducedMotion: boolean;
}

/**
 * A credential as a physical object: a dark slab with a machined copper edge
 * and an engraved face.
 *
 * It hangs still in the vault, turns a few degrees on its own, and lifts
 * toward the viewer when its entry in the overlay is focused.
 */
export function CertificateArtifact({
  id,
  position,
  arrival,
  reducedMotion,
}: CertificateArtifactProps): React.JSX.Element {
  const engine = getScrollEngine();
  const root = useRef<Group>(null);
  const slab = useRef<Mesh>(null);
  const edge = useRef<Mesh>(null);
  const focus = useRef(0);
  const emblem = useRef<Mesh>(null);

  const frameGeometry = useMemo(() => slabGeometry(1.54, 2.1, 0.09), []);
  const plateGeometry = useMemo(() => slabGeometry(1.36, 1.9, 0.07), []);

  const frameMaterial = useMemo(
    () =>
      createRimMaterial({
        color: hex.copper,
        emissive: hex.copperLift,
        emissiveIntensity: 0.32,
        roughness: 0.26,
        metalness: 0.96,
        rim: 1.3,
        rimPower: 2,
        rimColor: hex.ember,
      }),
    [],
  );

  const plateMaterial = useMemo(
    () =>
      createRimMaterial({
        color: hex.ash,
        emissive: hex.champagne,
        emissiveIntensity: 0.05,
        roughness: 0.2,
        metalness: 0.78,
        rim: 0.5,
        rimPower: 3,
        rimColor: hex.champagne,
        sheen: 1,
      }),
    [],
  );

  useEffect(
    () => () => {
      frameGeometry.dispose();
      plateGeometry.dispose();
      frameMaterial.dispose();
      plateMaterial.dispose();
    },
    [frameGeometry, frameMaterial, plateGeometry, plateMaterial],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const local = engine.localProgress('certifications');
    const time = reducedMotion ? 0 : state.clock.elapsedTime;

    const settle = smoothstep(arrival, arrival + 0.34, local);
    const focused = interaction.state.certification === id ? 1 : 0;
    focus.current = damp(focus.current, focused, 0.0005, dt);

    const node = root.current;
    if (node) {
      // Drops into place from above, then drifts almost imperceptibly.
      node.position.y = position[1] + (1 - settle) * 3.4 + Math.sin(time * 0.5 + position[0]) * 0.05;
      node.position.z = position[2] + focus.current * 0.85;
      node.rotation.y = Math.sin(time * 0.22 + position[0]) * 0.16 + focus.current * 0.2;
      node.rotation.x = -0.06 + focus.current * 0.06;
      node.scale.setScalar(0.4 + settle * 0.6 + focus.current * 0.08);
    }

    plateMaterial.emissiveIntensity = 0.05 + focus.current * 0.36;
    frameMaterial.emissiveIntensity = 0.3 + settle * 0.35 + focus.current * 1.1;
    frameMaterial.userData.rim.uRim.value = 1.1 + focus.current * 1.1;

    if (emblem.current) {
      emblem.current.rotation.z = time * 0.18 + focus.current * 1.2;
      (emblem.current.material as MeshStandardMaterial).emissiveIntensity =
        0.5 + focus.current * 1.6;
    }
  });

  return (
    <group ref={root} position={[position[0], position[1], position[2]]}>
      {/* Milled frame. */}
      <mesh ref={edge} geometry={frameGeometry} material={frameMaterial} />

      {/* Inset plate. */}
      <mesh ref={slab} geometry={plateGeometry} material={plateMaterial} position={[0, 0, 0.035]} />

      {/* Emblem: a notched ring, the mark of the issuing body. */}
      <mesh ref={emblem} position={[0, 0.42, 0.072]}>
        <torusGeometry args={[0.24, 0.012, 8, 48, Math.PI * 1.55]} />
        <meshStandardMaterial
          color={hex.champagne}
          emissive={hex.champagne}
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.9}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.42, 0.072]}>
        <circleGeometry args={[0.1, 20]} />
        <meshStandardMaterial
          color={hex.copperDeep}
          emissive={hex.copper}
          emissiveIntensity={0.4}
          roughness={0.34}
          metalness={0.92}
          toneMapped={false}
        />
      </mesh>

      {/* Engraved rules standing in for the record on the plate. */}
      {[-0.34, -0.46, -0.58].map((y, index) => (
        <mesh key={y} position={[0, y, 0.072]}>
          <boxGeometry args={[0.86 - index * 0.22, 0.007, 0.006]} />
          <meshStandardMaterial
            color={hex.silver}
            emissive={hex.champagne}
            emissiveIntensity={0.45}
            roughness={0.4}
            metalness={0.8}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
