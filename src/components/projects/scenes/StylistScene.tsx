'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Object3D,
  TorusGeometry,
  type Group,
  type InstancedMesh,
  type LineBasicMaterial,
  type LineSegments,
} from 'three';
import { hex } from '@/lib/three/palette';
import { scaleCount, type PerformanceProfile } from '@/lib/three/performance';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { clamp, mapRange, smoothstep } from '@/lib/utils/clamp';

interface StylistSceneProps {
  readonly z: number;
  readonly from: number;
  readonly to: number;
  readonly profile: PerformanceProfile;
  readonly reducedMotion: boolean;
}

/** The measured result, drawn as an arc rather than a bar. */
const ACCURACY = 0.85;
const ARC_SPAN = Math.PI * 1.5;
const ARC_TUBULAR = 96;
const ARC_RADIAL = 8;

/**
 * Project 02 — AI Personal Stylist.
 *
 * A classifier, made visible. Feature points form layers, edges fire between
 * them, and the arc closes to exactly the measured accuracy — the figure in
 * the overlay and the geometry here are the same number.
 */
export function StylistScene({
  z,
  from,
  to,
  profile,
  reducedMotion,
}: StylistSceneProps): React.JSX.Element {
  const engine = getScrollEngine();
  const network = useRef<LineSegments>(null);
  const nodes = useRef<InstancedMesh>(null);
  const form = useRef<Group>(null);
  const dummy = useMemo(() => new Object3D(), []);

  const layerSizes = useMemo(
    () => (profile.tier === 'low' ? [4, 6, 5, 3] : [5, 9, 8, 4]),
    [profile.tier],
  );

  /** Node positions, laid out as feed-forward layers across X. */
  const layout = useMemo(() => {
    const points: [number, number, number][] = [];
    const edges: number[] = [];
    const layerStart: number[] = [];

    layerSizes.forEach((size, layerIndex) => {
      layerStart.push(points.length);
      for (let i = 0; i < size; i += 1) {
        points.push([
          (layerIndex - (layerSizes.length - 1) / 2) * 1.5,
          (i - (size - 1) / 2) * 0.46,
          Math.sin(i * 2.1 + layerIndex) * 0.22,
        ]);
      }
    });

    for (let l = 0; l < layerSizes.length - 1; l += 1) {
      const aStart = layerStart[l]!;
      const bStart = layerStart[l + 1]!;
      const aSize = layerSizes[l]!;
      const bSize = layerSizes[l + 1]!;
      for (let i = 0; i < aSize; i += 1) {
        for (let j = 0; j < bSize; j += 1) {
          // Sparse connections read better than a fully-wired mesh.
          if ((i + j) % 2 === 0) edges.push(aStart + i, bStart + j);
        }
      }
    }

    return { points, edges };
  }, [layerSizes]);

  const lineGeometry = useMemo(() => {
    const positions = new Float32Array(layout.edges.length * 3);
    layout.edges.forEach((pointIndex, i) => {
      const point = layout.points[pointIndex]!;
      positions[i * 3] = point[0];
      positions[i * 3 + 1] = point[1];
      positions[i * 3 + 2] = point[2];
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    return geometry;
  }, [layout]);

  const shardCount = scaleCount(22, profile, 8);
  const shards = useRef<InstancedMesh>(null);

  /**
   * The gauge is one complete torus; filling it is a draw-range sweep rather
   * than a rebuilt geometry, so the arc animates without allocating.
   */
  const arcGeometry = useMemo(
    () => new TorusGeometry(2.5, 0.035, ARC_RADIAL, ARC_TUBULAR, ARC_SPAN),
    [],
  );
  const arcIndexCount = (arcGeometry.getIndex()?.count ?? 0);

  useFrame((state) => {
    const local = mapRange(engine.localProgress('projects'), from, to);
    const time = reducedMotion ? 0 : state.clock.elapsedTime;

    const inference = smoothstep(0.1, 0.55, local);
    const resolve = smoothstep(0.42, 0.92, local);

    // The arc sweeps open to exactly 85%, and stops there.
    const filled = clamp(resolve) * ACCURACY;
    const perStep = ARC_RADIAL * 6;
    arcGeometry.setDrawRange(0, Math.floor((arcIndexCount / perStep) * filled) * perStep);

    if (network.current) {
      network.current.rotation.y = Math.sin(time * 0.1) * 0.24 + 0.2;
      const material = network.current.material as LineBasicMaterial;
      material.opacity = 0.1 + inference * 0.34;
    }

    const nodeMesh = nodes.current;
    if (nodeMesh) {
      for (let i = 0; i < layout.points.length; i += 1) {
        const point = layout.points[i]!;
        // Activation ripples left to right through the layers.
        const phase = time * 1.6 - point[0] * 0.9;
        const fire = inference * (0.5 + 0.5 * Math.sin(phase));
        dummy.position.set(point[0], point[1], point[2]);
        dummy.scale.setScalar(0.03 + fire * 0.05);
        dummy.updateMatrix();
        nodeMesh.setMatrixAt(i, dummy.matrix);
      }
      nodeMesh.instanceMatrix.needsUpdate = true;
      nodeMesh.rotation.y = network.current?.rotation.y ?? 0;
    }

    const shardMesh = shards.current;
    if (shardMesh) {
      for (let i = 0; i < shardCount; i += 1) {
        const angle = (i / shardCount) * Math.PI * 2 + time * 0.14;
        const radius = 3.4 - resolve * 1.1;
        dummy.position.set(
          Math.cos(angle) * radius,
          Math.sin(i * 1.7) * 1.3,
          Math.sin(angle) * radius * 0.5,
        );
        dummy.rotation.set(angle, time * 0.2 + i, 0);
        dummy.scale.set(0.42, 0.58, 0.01);
        dummy.updateMatrix();
        shardMesh.setMatrixAt(i, dummy.matrix);
      }
      shardMesh.instanceMatrix.needsUpdate = true;
    }

    if (form.current) {
      form.current.rotation.y = time * 0.16;
      form.current.scale.setScalar(0.7 + resolve * 0.3);
    }
  });

  return (
    <group position={[0, 0, z]}>
      {/* The metric, as geometry. */}
      <group position={[0, 0, -1.6]}>
        <mesh rotation={[0, 0, Math.PI * 0.75]}>
          <torusGeometry args={[2.5, 0.012, 6, 96, ARC_SPAN]} />
          <meshStandardMaterial color={hex.stone} roughness={0.6} metalness={0.4} />
        </mesh>
        <mesh geometry={arcGeometry} rotation={[0, 0, Math.PI * 0.75]}>
          <meshStandardMaterial
            color={hex.copperLift}
            emissive={hex.copperLift}
            emissiveIntensity={1.5}
            roughness={0.3}
            metalness={0.9}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* The classifier. */}
      <group position={[0, 0.2, 0.4]}>
        <lineSegments ref={network} geometry={lineGeometry}>
          <lineBasicMaterial
            color={hex.emeraldLift}
            transparent
            opacity={0.18}
            depthWrite={false}
            blending={AdditiveBlending}
            fog={false}
            toneMapped={false}
          />
        </lineSegments>

        <instancedMesh
          ref={nodes}
          args={[undefined, undefined, layout.points.length]}
          frustumCulled={false}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial
            color={hex.champagne}
            emissive={hex.champagne}
            emissiveIntensity={1.1}
            roughness={0.4}
            toneMapped={false}
          />
        </instancedMesh>
      </group>

      {/* The form being dressed — implied, never illustrated. */}
      <group ref={form} position={[0, -0.4, 1.4]}>
        <mesh position={[0, 0.9, 0]}>
          <capsuleGeometry args={[0.28, 1.1, 4, 12]} />
          <meshStandardMaterial color={hex.graphite} roughness={0.7} metalness={0.3} />
        </mesh>
        <mesh position={[0, 1.85, 0]}>
          <sphereGeometry args={[0.19, 12, 12]} />
          <meshStandardMaterial color={hex.graphite} roughness={0.7} metalness={0.3} />
        </mesh>
      </group>

      {/* Candidate garments, circling before the recommendation lands. */}
      <instancedMesh ref={shards} args={[undefined, undefined, shardCount]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={hex.bronze}
          roughness={0.5}
          metalness={0.6}
          transparent
          opacity={0.62}
          side={DoubleSide}
        />
      </instancedMesh>

      <pointLight position={[0, 1.6, 3]} color={hex.champagne} intensity={10} distance={14} />
    </group>
  );
}
