'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  CatmullRomCurve3,
  Object3D,
  TubeGeometry,
  Vector3,
  type Group,
  type InstancedMesh,
  type Mesh,
} from 'three';
import { hex } from '@/lib/three/palette';
import { createRimMaterial } from '@/lib/three/rimMaterial';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { smoothstep } from '@/lib/utils/clamp';

interface CertificationSealProps {
  readonly reducedMotion: boolean;
  readonly notchCount: number;
}

/** Radii of the engraved grooves cut into the face. */
const GROOVES = [1.06, 0.94, 0.8] as const;

/**
 * A verification seal, machined rather than drawn.
 *
 * An inner disc with engraved grooves, a milled bezel, a ring of notches that
 * closes as the record is checked, and a mark that draws itself across the
 * face at the moment the check completes.
 *
 * One object, one move, one light. The chapter is short on purpose — the
 * achievement is a single fact and is treated as one.
 */
export function CertificationSeal({
  reducedMotion,
  notchCount,
}: CertificationSealProps): React.JSX.Element {
  const engine = getScrollEngine();
  const root = useRef<Group>(null);
  const bezel = useRef<Mesh>(null);
  const disc = useRef<Mesh>(null);
  const notches = useRef<InstancedMesh>(null);
  const check = useRef<Mesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  /** The mark, as a tube along a three-point path. */
  const checkGeometry = useMemo(() => {
    const curve = new CatmullRomCurve3([
      new Vector3(-0.34, 0.02, 0),
      new Vector3(-0.1, -0.24, 0),
      new Vector3(0.38, 0.3, 0),
    ]);
    return new TubeGeometry(curve, 48, 0.032, 8, false);
  }, []);

  const discMaterial = useMemo(
    () =>
      createRimMaterial({
        color: hex.graphite,
        emissive: hex.forest,
        emissiveIntensity: 0.22,
        roughness: 0.3,
        metalness: 0.88,
        rim: 0.8,
        rimPower: 2.6,
        rimColor: hex.emeraldLift,
      }),
    [],
  );

  const bezelMaterial = useMemo(
    () =>
      createRimMaterial({
        color: hex.emerald,
        emissive: hex.emeraldLift,
        emissiveIntensity: 0.4,
        roughness: 0.28,
        metalness: 0.95,
        rim: 1.4,
        rimPower: 1.9,
        rimColor: hex.emeraldLift,
      }),
    [],
  );

  useEffect(
    () => () => {
      checkGeometry.dispose();
      discMaterial.dispose();
      bezelMaterial.dispose();
    },
    [bezelMaterial, checkGeometry, discMaterial],
  );

  const checkIndexCount = checkGeometry.getIndex()?.count ?? 0;

  useFrame((state) => {
    const local = engine.localProgress('achievement');
    const time = reducedMotion ? 0 : state.clock.elapsedTime;

    const arrive = smoothstep(0.04, 0.4, local);
    const verified = smoothstep(0.34, 0.76, local);
    const marked = smoothstep(0.62, 0.9, local);

    if (root.current) {
      root.current.scale.setScalar(0.6 + arrive * 0.4);
      root.current.rotation.y = (1 - arrive) * -0.9 + Math.sin(time * 0.18) * 0.06;
    }

    if (bezel.current) {
      bezel.current.rotation.z = -time * 0.1 + verified * 0.8;
      bezelMaterial.emissiveIntensity = 0.4 + verified * 1.4;
      bezelMaterial.userData.rim.uRim.value = 1.2 + verified * 0.8;
    }

    if (disc.current) discMaterial.emissiveIntensity = 0.18 + verified * 0.4;

    const mesh = notches.current;
    if (mesh) {
      for (let i = 0; i < notchCount; i += 1) {
        // Notches lock in one by one, clockwise, as verification completes.
        const step = smoothstep(i / notchCount, i / notchCount + 0.18, verified);
        const angle = (i / notchCount) * Math.PI * 2;
        const radius = 1.34 + (1 - step) * 0.4;
        // Every fourth notch is a major tick.
        const major = i % 4 === 0;

        dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.04);
        dummy.rotation.set(0, 0, angle);
        dummy.scale.set((major ? 0.17 : 0.1) * step, major ? 0.02 : 0.013, 0.013);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }

    // The mark draws itself along the tube once the notches have closed.
    checkGeometry.setDrawRange(0, Math.floor(checkIndexCount * marked));
    if (check.current) check.current.visible = marked > 0.01;
  });

  return (
    <group ref={root}>
      {/* Face. */}
      <mesh ref={disc} rotation={[Math.PI / 2, 0, 0]} material={discMaterial}>
        <cylinderGeometry args={[1.18, 1.18, 0.09, 72]} />
      </mesh>

      {/* Engraved grooves cut into the face. */}
      {GROOVES.map((radius, index) => (
        <mesh key={radius} position={[0, 0, 0.047]}>
          <torusGeometry args={[radius, 0.005, 6, 96]} />
          <meshStandardMaterial
            color={hex.forest}
            emissive={hex.emerald}
            emissiveIntensity={0.3 - index * 0.06}
            roughness={0.5}
            metalness={0.7}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Bezel. */}
      <mesh ref={bezel} material={bezelMaterial}>
        <torusGeometry args={[1.26, 0.032, 12, 140]} />
      </mesh>

      {/* Verification notches. */}
      <instancedMesh ref={notches} args={[undefined, undefined, notchCount]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={hex.champagne}
          emissive={hex.champagne}
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </instancedMesh>

      {/* The mark. */}
      <mesh ref={check} geometry={checkGeometry} position={[0, 0, 0.07]}>
        <meshStandardMaterial
          color={hex.champagne}
          emissive={hex.champagne}
          emissiveIntensity={1.8}
          roughness={0.3}
          metalness={0.9}
          toneMapped={false}
        />
      </mesh>

      <pointLight position={[0.8, 1.4, 2.6]} color={hex.emeraldLift} intensity={7} distance={9} />
      <pointLight position={[-1.2, -0.6, 1.6]} color={hex.copper} intensity={4} distance={7} />
    </group>
  );
}
