'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Object3D,
  type InstancedMesh,
  type LineBasicMaterial,
  type LineSegments,
} from 'three';
import { CELL_Z } from '@/lib/three/cameraRig';
import { hex } from '@/lib/three/palette';
import { scaleCount, type PerformanceProfile } from '@/lib/three/performance';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { smoothstep } from '@/lib/utils/clamp';

interface AIWorldProps {
  readonly profile: PerformanceProfile;
  readonly reducedMotion: boolean;
}

/**
 * Chapter 06 — AI.
 *
 * The only chapter lit in emerald, and the only one the camera flies
 * *through* rather than past. Nodes sit on nested shells; signals travel the
 * edges between them. It reads as inference happening around the viewer.
 */
export function AIWorld({ profile, reducedMotion }: AIWorldProps): React.JSX.Element {
  const engine = getScrollEngine();
  const nodes = useRef<InstancedMesh>(null);
  const signals = useRef<InstancedMesh>(null);
  const edges = useRef<LineSegments>(null);
  const dummy = useMemo(() => new Object3D(), []);

  const nodeCount = scaleCount(180, profile, 60);
  const signalCount = scaleCount(60, profile, 18);

  /** Nodes on three nested shells; edges only between near neighbours. */
  const graph = useMemo(() => {
    const points: [number, number, number][] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < nodeCount; i += 1) {
      const shell = i % 3;
      const radius = 3.4 + shell * 2.4;
      const y = 1 - (i / Math.max(1, nodeCount - 1)) * 2;
      const ring = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      points.push([
        Math.cos(theta) * ring * radius,
        y * radius * 0.72,
        Math.sin(theta) * ring * radius,
      ]);
    }

    const pairs: [number, number][] = [];
    for (let i = 0; i < points.length; i += 1) {
      const a = points[i]!;
      for (let j = i + 1; j < points.length; j += 1) {
        const b = points[j]!;
        const dx = a[0] - b[0];
        const dy = a[1] - b[1];
        const dz = a[2] - b[2];
        if (dx * dx + dy * dy + dz * dz < 6.6) pairs.push([i, j]);
      }
    }

    return { points, pairs };
  }, [nodeCount]);

  const edgeGeometry = useMemo(() => {
    const positions = new Float32Array(graph.pairs.length * 6);
    graph.pairs.forEach(([a, b], index) => {
      const pa = graph.points[a]!;
      const pb = graph.points[b]!;
      positions.set(pa, index * 6);
      positions.set(pb, index * 6 + 3);
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    return geometry;
  }, [graph]);

  useFrame((state) => {
    const local = engine.localProgress('ai');
    const time = reducedMotion ? local * 8 : state.clock.elapsedTime;
    const awake = smoothstep(0.02, 0.4, local);

    const nodeMesh = nodes.current;
    if (nodeMesh) {
      for (let i = 0; i < graph.points.length; i += 1) {
        const point = graph.points[i]!;
        const fire = 0.5 + 0.5 * Math.sin(time * 2 + i * 0.7);
        dummy.position.set(point[0], point[1], point[2]);
        dummy.scale.setScalar((0.028 + fire * 0.042) * awake);
        dummy.updateMatrix();
        nodeMesh.setMatrixAt(i, dummy.matrix);
      }
      nodeMesh.instanceMatrix.needsUpdate = true;
      nodeMesh.rotation.y = time * 0.03;
    }

    if (edges.current) {
      edges.current.rotation.y = time * 0.03;
      (edges.current.material as LineBasicMaterial).opacity = 0.05 + awake * 0.14;
    }

    // Signals travelling the edges — one pulse per sampled connection.
    const signalMesh = signals.current;
    if (signalMesh && graph.pairs.length > 0) {
      for (let i = 0; i < signalCount; i += 1) {
        const pair = graph.pairs[(i * 37) % graph.pairs.length]!;
        const a = graph.points[pair[0]]!;
        const b = graph.points[pair[1]]!;
        const t = (time * 0.55 + i / signalCount) % 1;

        dummy.position.set(
          a[0] + (b[0] - a[0]) * t,
          a[1] + (b[1] - a[1]) * t,
          a[2] + (b[2] - a[2]) * t,
        );
        dummy.scale.setScalar(0.05 * awake * Math.sin(t * Math.PI));
        dummy.updateMatrix();
        signalMesh.setMatrixAt(i, dummy.matrix);
      }
      signalMesh.instanceMatrix.needsUpdate = true;
      signalMesh.rotation.y = time * 0.03;
    }
  });

  return (
    <group position={[0, 2, CELL_Z.ai]}>
      <lineSegments ref={edges} geometry={edgeGeometry}>
        <lineBasicMaterial
          color={hex.emerald}
          transparent
          opacity={0.08}
          depthWrite={false}
          blending={AdditiveBlending}
          fog={false}
          toneMapped={false}
        />
      </lineSegments>

      <instancedMesh
        ref={nodes}
        args={[undefined, undefined, graph.points.length]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          color={hex.emeraldLift}
          emissive={hex.emeraldLift}
          emissiveIntensity={1.1}
          roughness={0.4}
          toneMapped={false}
        />
      </instancedMesh>

      <instancedMesh ref={signals} args={[undefined, undefined, signalCount]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial
          color={hex.champagne}
          transparent
          opacity={0.95}
          blending={AdditiveBlending}
          fog={false}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
