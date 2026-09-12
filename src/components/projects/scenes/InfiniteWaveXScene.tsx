'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Object3D,
  type Group,
  type InstancedMesh,
  type Mesh,
  type MeshStandardMaterial,
  type Points,
  type PointsMaterial,
} from 'three';
import { hex } from '@/lib/three/palette';
import { scaleCount, type PerformanceProfile } from '@/lib/three/performance';
import { softSprite, gridTexture } from '@/lib/three/textures';
import { coatGeometry, dressGeometry, shirtGeometry } from '@/lib/three/shapes';
import { createRimMaterial } from '@/lib/three/rimMaterial';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { clamp, mapRange, smoothstep } from '@/lib/utils/clamp';
import { Avatar } from './Avatar';

interface InfiniteWaveXSceneProps {
  readonly z: number;
  readonly from: number;
  readonly to: number;
  readonly profile: PerformanceProfile;
  readonly reducedMotion: boolean;
}

/** Floating interface panels — the dashboard, abstracted to three planes. */
const PANELS = [
  { pos: [-3.5, 2.1, -0.8], size: [1.6, 1.05], tilt: 0.34 },
  { pos: [3.4, 1.5, -0.4], size: [1.3, 1.7], tilt: -0.4 },
  { pos: [-2.9, 0.35, 1.5], size: [1.2, 0.72], tilt: 0.18 },
] as const;

/**
 * Project 04 — InfiniteWaveX.
 *
 * The largest set in the film, because the project already lives in three
 * dimensions. An avatar stands on a lit platform; a wardrobe of candidate
 * garments circles it; a diffusion cloud collapses inward and resolves into
 * the selected piece. Dashboard panels hang in the space around it.
 */
export function InfiniteWaveXScene({
  z,
  from,
  to,
  profile,
  reducedMotion,
}: InfiniteWaveXSceneProps): React.JSX.Element {
  const engine = getScrollEngine();
  const cloud = useRef<Points>(null);
  const selected = useRef<Mesh>(null);
  const platform = useRef<Mesh>(null);
  const panels = useRef<Group>(null);
  const dummy = useMemo(() => new Object3D(), []);

  const garmentCount = scaleCount(15, profile, 6);

  /**
   * Three silhouettes, cycled across the wardrobe. Instanced meshes take one
   * geometry each, so the ring is built from three of them rather than one
   * generic plane repeated fifteen times.
   */
  const garmentGeometries = useMemo(
    () => [shirtGeometry(), dressGeometry(), coatGeometry()],
    [],
  );

  const garmentMaterial = useMemo(
    () =>
      createRimMaterial({
        color: hex.stone,
        roughness: 0.48,
        metalness: 0.62,
        rim: 0.8,
        rimPower: 2.2,
        rimColor: hex.champagne,
      }),
    [],
  );

  const wardrobeRefs = useRef<(InstancedMesh | null)[]>([]);
  const perGeometry = Math.ceil(garmentCount / garmentGeometries.length);

  useEffect(
    () => () => {
      garmentMaterial.dispose();
      garmentGeometries.forEach((geometry) => geometry.dispose());
    },
    [garmentGeometries, garmentMaterial],
  );
  const particleCount = scaleCount(1400, profile, 320);

  /** The diffusion cloud: noise positions and the target they resolve to. */
  const cloudGeometry = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const noise = new Float32Array(particleCount * 3);
    const target = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i += 1) {
      // Scattered start.
      noise[i * 3] = (Math.random() * 2 - 1) * 5;
      noise[i * 3 + 1] = Math.random() * 4.4 - 0.6;
      noise[i * 3 + 2] = (Math.random() * 2 - 1) * 5;

      // Resolved end: a garment-shaped shell around the torso.
      const angle = Math.random() * Math.PI * 2;
      const height = Math.random();
      const radius = 0.34 + Math.sin(height * Math.PI) * 0.16;
      target[i * 3] = Math.cos(angle) * radius;
      target[i * 3 + 1] = 0.72 + height * 1.15;
      target[i * 3 + 2] = Math.sin(angle) * radius * 0.72;

      positions[i * 3] = noise[i * 3]!;
      positions[i * 3 + 1] = noise[i * 3 + 1]!;
      positions[i * 3 + 2] = noise[i * 3 + 2]!;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.userData = { noise, target };
    return geometry;
  }, [particleCount]);

  useFrame((state) => {
    const local = mapRange(engine.localProgress('projects'), from, to);
    const time = reducedMotion ? 0 : state.clock.elapsedTime;

    const survey = smoothstep(0.04, 0.36, local);
    const diffuse = smoothstep(0.3, 0.78, local);
    const dressed = smoothstep(0.62, 0.95, local);

    // Wardrobe: candidates circle, then all but the chosen one fall back.
    for (let g = 0; g < wardrobeRefs.current.length; g += 1) {
      const mesh = wardrobeRefs.current[g];
      if (!mesh) continue;

      for (let slot = 0; slot < perGeometry; slot += 1) {
        const i = g * perGeometry + slot;
        const angle = (i / garmentCount) * Math.PI * 2 + time * 0.18;
        const chosen = i === 0;
        const radius = (3.5 - survey * 0.5) * (chosen ? 1 - dressed * 0.84 : 1 + dressed * 0.35);
        const lift = 1.35 + Math.sin(angle * 2 + i) * 0.42;

        dummy.position.set(
          Math.cos(angle) * radius,
          i >= garmentCount ? -40 : lift + (chosen ? dressed * 0.12 : 0),
          Math.sin(angle) * radius * 0.62,
        );
        dummy.rotation.set(0, -angle + Math.PI / 2, Math.sin(time * 0.5 + i) * 0.09);
        const fade = chosen ? 1 : 1 - dressed * 0.72;
        dummy.scale.setScalar(1.5 * Math.max(0.001, fade));
        dummy.updateMatrix();
        mesh.setMatrixAt(slot, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }

    // Diffusion: noise collapses onto the garment shell.
    const points = cloud.current;
    if (points) {
      const attribute = points.geometry.getAttribute('position') as BufferAttribute;
      const array = attribute.array as Float32Array;
      const data = points.geometry.userData as { noise: Float32Array; target: Float32Array };

      for (let i = 0; i < particleCount; i += 1) {
        const i3 = i * 3;
        // Each particle resolves on its own schedule — a denoising schedule.
        const step = clamp(diffuse * 1.35 - (i / particleCount) * 0.3);
        const swirl = (1 - step) * Math.sin(time * 0.7 + i * 0.05) * 0.5;

        array[i3] = data.noise[i3]! * (1 - step) + data.target[i3]! * step + swirl;
        array[i3 + 1] = data.noise[i3 + 1]! * (1 - step) + data.target[i3 + 1]! * step;
        array[i3 + 2] = data.noise[i3 + 2]! * (1 - step) + data.target[i3 + 2]! * step + swirl;
      }
      attribute.needsUpdate = true;

      const material = points.material as PointsMaterial;
      material.opacity = 0.16 + survey * 0.5 - dressed * 0.42;
      points.rotation.y = time * 0.05;
    }

    if (selected.current) {
      const material = selected.current.material as MeshStandardMaterial;
      material.opacity = dressed * 0.94;
      selected.current.visible = dressed > 0.02;
      selected.current.rotation.y = time * 0.24;
    }

    if (platform.current) {
      platform.current.rotation.z = time * 0.08;
      const material = platform.current.material as MeshStandardMaterial;
      material.emissiveIntensity = 0.5 + survey * 1.4;
    }

    if (panels.current) {
      panels.current.children.forEach((panel, index) => {
        const appear = smoothstep(0.18 + index * 0.12, 0.5 + index * 0.12, local);
        panel.scale.setScalar(appear);
        panel.position.y = PANELS[index]!.pos[1] + Math.sin(time * 0.4 + index) * 0.08;
      });
    }
  });

  return (
    <group position={[0, -1.6, z]}>
      {/* Lit platform. */}
      <mesh ref={platform} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.62, 96]} />
        <meshStandardMaterial
          color={hex.copper}
          emissive={hex.copperLift}
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.92}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[1.5, 64]} />
        <meshStandardMaterial color={hex.obsidian} roughness={0.34} metalness={0.7} />
      </mesh>

      <Avatar reducedMotion={reducedMotion} />

      {/* The chosen garment, resolved onto the body. */}
      <mesh ref={selected} position={[0, 1.3, 0]}>
        <capsuleGeometry args={[0.36, 0.78, 4, 20]} />
        <meshStandardMaterial
          color={hex.bronze}
          emissive={hex.copperDeep}
          emissiveIntensity={0.34}
          roughness={0.42}
          metalness={0.6}
          transparent
          opacity={0}
        />
      </mesh>

      {/* Candidate wardrobe — three silhouettes circling the figure. */}
      {garmentGeometries.map((geometry, index) => (
        <instancedMesh
          key={index}
          ref={(node) => {
            wardrobeRefs.current[index] = node;
          }}
          args={[geometry, garmentMaterial, perGeometry]}
          frustumCulled={false}
        />
      ))}

      {/* Diffusion cloud. */}
      <points ref={cloud} geometry={cloudGeometry} frustumCulled={false}>
        <pointsMaterial
          size={0.045}
          map={softSprite()}
          color={hex.champagne}
          transparent
          opacity={0.3}
          depthWrite={false}
          blending={AdditiveBlending}
          fog={false}
          toneMapped={false}
        />
      </points>

      {/* Dashboard panels. */}
      <group ref={panels}>
        {PANELS.map((panel, index) => (
          <mesh key={index} position={[...panel.pos]} rotation={[0, panel.tilt, 0]}>
            <planeGeometry args={[...panel.size]} />
            <meshStandardMaterial
              color={hex.ash}
              emissive={hex.emerald}
              emissiveIntensity={0.24}
              roughness={0.3}
              metalness={0.5}
              transparent
              opacity={0.66}
              side={DoubleSide}
              map={gridTexture(256, 26)}
            />
          </mesh>
        ))}
      </group>

      {/* Three-point rig on the figure: the avatar is the subject of the set,
          so it is lit like one rather than left to the chapter's ambient. */}
      <pointLight position={[2.4, 3, 2.6]} color={hex.champagne} intensity={34} distance={16} />
      <pointLight position={[-2.6, 1.6, 1.4]} color={hex.copperLift} intensity={18} distance={12} />
      <pointLight position={[0, 2.4, -2.6]} color={hex.emeraldLift} intensity={22} distance={12} />
    </group>
  );
}
