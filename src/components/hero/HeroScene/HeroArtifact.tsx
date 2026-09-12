'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  IcosahedronGeometry,
  Object3D,
  TetrahedronGeometry,
  type BufferGeometry,
  type Group,
  type InstancedMesh,
  type Mesh,
  type MeshStandardMaterial,
} from 'three';
import { hex } from '@/lib/three/palette';
import { createRimMaterial } from '@/lib/three/rimMaterial';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { clamp, smoothstep } from '@/lib/utils/clamp';

interface HeroArtifactProps {
  readonly shardCount: number;
  readonly detail: number;
  readonly reducedMotion: boolean;
}

/** Deterministic displacement so the core is faceted, not merely round. */
function displaceCore(geometry: BufferGeometry, amount: number): BufferGeometry {
  const attribute = geometry.getAttribute('position');
  const array = attribute.array as Float32Array;
  for (let i = 0; i < attribute.count; i += 1) {
    const x = array[i * 3]!;
    const y = array[i * 3 + 1]!;
    const z = array[i * 3 + 2]!;
    const noise =
      Math.sin(x * 3.1 + y * 1.7) * Math.cos(z * 2.3 - y * 1.1) * 0.5 +
      Math.sin(y * 4.7 + z * 2.9) * 0.5;
    const scale = 1 + noise * amount;
    array[i * 3] = x * scale;
    array[i * 3 + 1] = y * scale;
    array[i * 3 + 2] = z * scale;
  }
  attribute.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * The object the film opens on.
 *
 * Four nested layers, each turning on its own axis: an outer cage, a
 * three-ring gyroscope, a displaced copper core, and a cloud of shards still
 * finding their places. It is not decoration — it is the thing being built,
 * and it finishes assembling exactly as the first line of type resolves.
 */
export function HeroArtifact({
  shardCount,
  detail,
  reducedMotion,
}: HeroArtifactProps): React.JSX.Element {
  const engine = getScrollEngine();
  const root = useRef<Group>(null);
  const cage = useRef<Mesh>(null);
  const gyro = useRef<Group>(null);
  const ringA = useRef<Mesh>(null);
  const ringB = useRef<Mesh>(null);
  const ringC = useRef<Mesh>(null);
  const core = useRef<Mesh>(null);
  const halo = useRef<Mesh>(null);
  const shards = useRef<InstancedMesh>(null);

  const cageGeometry = useMemo(() => new IcosahedronGeometry(3.2, detail), [detail]);
  const coreGeometry = useMemo(
    () => displaceCore(new IcosahedronGeometry(1.15, detail + 1), 0.16),
    [detail],
  );

  /** Shards cycle through three solids so the cloud is not uniform. */
  const shardGeometry = useMemo(() => new TetrahedronGeometry(1, 0), []);
  const dummy = useMemo(() => new Object3D(), []);

  const coreMaterial = useMemo(
    () =>
      createRimMaterial({
        color: hex.copperDeep,
        emissive: hex.ember,
        emissiveIntensity: 0.4,
        roughness: 0.28,
        metalness: 0.92,
        rim: 1.15,
        rimPower: 2.2,
        rimColor: hex.ember,
        flatShading: true,
      }),
    [],
  );

  const shardMaterial = useMemo(
    () =>
      createRimMaterial({
        color: hex.bronze,
        roughness: 0.34,
        metalness: 0.94,
        rim: 0.9,
        rimPower: 2.4,
        rimColor: hex.champagne,
        flatShading: true,
      }),
    [],
  );

  useEffect(
    () => () => {
      coreMaterial.dispose();
      shardMaterial.dispose();
      cageGeometry.dispose();
      coreGeometry.dispose();
      shardGeometry.dispose();
    },
    [cageGeometry, coreGeometry, coreMaterial, shardGeometry, shardMaterial],
  );

  /** Resting pose of every shard: a loose cloud around the cage. */
  const orbits = useMemo(
    () =>
      Array.from({ length: shardCount }, (_, i) => {
        const golden = Math.PI * (3 - Math.sqrt(5));
        const y = 1 - (i / Math.max(1, shardCount - 1)) * 2;
        const radius = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = golden * i;
        return {
          x: Math.cos(theta) * radius,
          y,
          z: Math.sin(theta) * radius,
          spread: 5.5 + Math.random() * 9,
          spin: Math.random() * Math.PI,
          scale: 0.05 + Math.random() * 0.18,
          speed: 0.25 + Math.random() * 0.55,
          // Shards land in waves rather than all at once.
          order: Math.random() * 0.5,
        };
      }),
    [shardCount],
  );

  useFrame((state) => {
    const local = engine.localProgress('intro');
    const time = reducedMotion ? 0 : state.clock.elapsedTime;
    // The object is already substantial when the film opens — the assembly
    // tightens and brightens it rather than building it from nothing, so the
    // first frame has something to look at before anyone has scrolled.
    const assembled = smoothstep(0, 0.72, local);

    if (root.current) {
      root.current.rotation.y = time * 0.06 + local * 0.9;
      root.current.rotation.x = Math.sin(time * 0.09) * 0.06;
    }

    // The cage contracts onto the object as the shards arrive.
    if (cage.current) {
      const material = cage.current.material as MeshStandardMaterial;
      material.opacity = 0.13 + assembled * 0.17;
      cage.current.rotation.y = -time * 0.045;
      cage.current.rotation.z = time * 0.02;
      cage.current.scale.setScalar(1.16 - assembled * 0.2);
    }

    // Gyroscope: three rings, three axes, three speeds.
    if (gyro.current) gyro.current.scale.setScalar(0.82 + assembled * 0.18);
    if (ringA.current) ringA.current.rotation.z = time * 0.34 + local * 2;
    if (ringB.current) {
      ringB.current.rotation.x = time * 0.26;
      ringB.current.rotation.y = time * 0.12;
    }
    if (ringC.current) {
      ringC.current.rotation.y = -time * 0.2;
      ringC.current.rotation.z = time * 0.08;
    }

    if (core.current) {
      coreMaterial.emissiveIntensity = 0.34 + assembled * 0.5 + Math.sin(time * 1.1) * 0.06;
      coreMaterial.userData.rim.uRim.value = 1 + Math.sin(time * 0.7) * 0.25;
      core.current.rotation.y = time * 0.24;
      core.current.rotation.z = time * 0.1;
      core.current.scale.setScalar(0.86 + assembled * 0.24);
    }

    if (halo.current) {
      halo.current.rotation.z = time * 0.16;
      halo.current.scale.setScalar((0.92 + assembled * 0.22) * (1 + Math.sin(time * 0.9) * 0.02));
      (halo.current.material as MeshStandardMaterial).opacity = 0.3 + assembled * 0.34;
    }

    const mesh = shards.current;
    if (!mesh) return;

    for (let i = 0; i < orbits.length; i += 1) {
      const shard = orbits[i]!;
      const settle = smoothstep(shard.order * 0.6, shard.order * 0.6 + 0.46, assembled);
      const distance = shard.spread * (1 - settle) + 3.15 * settle;
      const drift = time * shard.speed * (1 - settle * 0.85);

      dummy.position.set(
        shard.x * distance + Math.sin(drift + shard.spin) * 0.34 * (1 - settle),
        shard.y * distance + Math.cos(drift * 0.8) * 0.34 * (1 - settle),
        shard.z * distance,
      );
      dummy.rotation.set(drift, shard.spin + drift * 0.6, drift * 0.3);
      dummy.scale.setScalar(shard.scale * clamp(0.3 + settle, 0, 1.25));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={root}>
      {/* Outer cage — the volume the object will occupy, drawn before it does. */}
      <mesh ref={cage} geometry={cageGeometry}>
        <meshStandardMaterial
          color={hex.stone}
          roughness={0.3}
          metalness={0.9}
          transparent
          opacity={0.08}
          wireframe
          fog={false}
        />
      </mesh>

      {/* Gyroscope rings. */}
      <group ref={gyro}>
        <mesh ref={ringA}>
          <torusGeometry args={[2.35, 0.026, 10, 140]} />
          <meshStandardMaterial
            color={hex.copperLift}
            emissive={hex.copperLift}
            emissiveIntensity={2.1}
            roughness={0.3}
            metalness={0.95}
            toneMapped={false}
          />
        </mesh>
        <mesh ref={ringB} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.95, 0.019, 10, 128]} />
          <meshStandardMaterial
            color={hex.champagne}
            emissive={hex.champagne}
            emissiveIntensity={1.3}
            roughness={0.34}
            metalness={0.9}
            toneMapped={false}
          />
        </mesh>
        <mesh ref={ringC} rotation={[0, 0, Math.PI / 2.6]}>
          <torusGeometry args={[1.6, 0.015, 8, 112]} />
          <meshStandardMaterial
            color={hex.bronze}
            emissive={hex.copperDeep}
            emissiveIntensity={1}
            roughness={0.4}
            metalness={0.88}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* The core: the only genuinely bright thing in the opening shot. */}
      <mesh ref={core} geometry={coreGeometry} material={coreMaterial} />

      {/* A thin equator that catches the key light. */}
      <mesh ref={halo} rotation={[Math.PI / 2.1, 0, 0]}>
        <ringGeometry args={[1.5, 1.58, 96]} />
        <meshStandardMaterial
          color={hex.ember}
          emissive={hex.ember}
          emissiveIntensity={0.9}
          transparent
          opacity={0}
          depthWrite={false}
          blending={AdditiveBlending}
          fog={false}
          toneMapped={false}
        />
      </mesh>

      <instancedMesh
        ref={shards}
        args={[shardGeometry, shardMaterial, shardCount]}
        frustumCulled={false}
      />
    </group>
  );
}
