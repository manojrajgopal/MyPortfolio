'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { DoubleSide, type Group, type Mesh, type MeshStandardMaterial } from 'three';
import { hex } from '@/lib/three/palette';
import { createDissolveMaterial, setDissolve, type DissolveMaterial } from '@/lib/three/materials';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { clamp, mapRange, smoothstep } from '@/lib/utils/clamp';
import { gridTexture } from '@/lib/three/textures';
import { useThemeHex } from '@/hooks/useResolvedTheme';
import { FloorLamp, Plant, Rug, Shelf, Sofa, Table } from './RoomFurniture';

interface InteriorSceneProps {
  readonly z: number;
  /** Sub-window inside the projects chapter, in local progress. */
  readonly from: number;
  readonly to: number;
  readonly reducedMotion: boolean;
}

/** Segmentation boxes, one per piece the model has identified. */
const MASKS = [
  { pos: [-1.5, 0.45, 0.1], size: [2.4, 1, 1.1] },
  { pos: [1.05, 0.45, -0.7], size: [1.2, 1, 1.2] },
  { pos: [2.3, 0.9, 0.5], size: [0.75, 1.9, 0.75] },
  { pos: [-2.5, 0.85, -1.3], size: [1.5, 1.7, 0.5] },
] as const;

/**
 * Project 01 — Interior Design, AI inpainting.
 *
 * A room the camera walks into. Segmentation boxes pick out the furniture, a
 * scan line sweeps the space, the existing pieces erode away along a noise
 * front, and a different arrangement resolves in their place. Remove,
 * replace, reimagine — performed rather than described.
 */
export function InteriorScene({
  z,
  from,
  to,
  reducedMotion,
}: InteriorSceneProps): React.JSX.Element {
  const engine = getScrollEngine();

  // The shell is the one part of this set that must follow the theme. Dark
  // walls disappear into dark fog; on paper the same walls read as a grey box
  // floating in nothing, because the room has no exterior.
  const floorColor = useThemeHex(hex.obsidian, 0xd9d3c6);
  const wallColor = useThemeHex(hex.graphite, 0xe8e3d8);

  const beforeGroup = useRef<Group>(null);
  const afterGroup = useRef<Group>(null);
  const scanner = useRef<Mesh>(null);
  const masks = useRef<Group>(null);

  const beforeMaterial = useMemo(
    () => createDissolveMaterial({ color: hex.stone, roughness: 0.62, metalness: 0.25 }),
    [],
  );
  const afterMaterial = useMemo(
    () =>
      createDissolveMaterial({
        color: hex.bronze,
        roughness: 0.44,
        metalness: 0.45,
        edgeColor: hex.emeraldLift,
      }),
    [],
  );

  useEffect(() => {
    const all: DissolveMaterial[] = [beforeMaterial, afterMaterial];
    return () => all.forEach((material) => material.dispose());
  }, [afterMaterial, beforeMaterial]);

  useFrame((state) => {
    const local = mapRange(engine.localProgress('projects'), from, to);
    const time = reducedMotion ? 0 : state.clock.elapsedTime;

    // Four beats: identify, scan, erase, regenerate.
    const identify = smoothstep(0.02, 0.24, local);
    const scan = smoothstep(0.08, 0.42, local);
    const erase = smoothstep(0.3, 0.62, local);
    const build = smoothstep(0.56, 0.9, local);

    setDissolve(beforeMaterial, clamp(erase * 1.1));
    setDissolve(afterMaterial, clamp(1 - build * 1.15));

    if (scanner.current) {
      const material = scanner.current.material as MeshStandardMaterial;
      scanner.current.position.z = -3 + scan * 6;
      material.opacity = Math.sin(clamp(scan) * Math.PI) * 0.42;
      material.emissiveIntensity = 1.4 + Math.sin(time * 3) * 0.2;
    }

    if (masks.current) {
      masks.current.children.forEach((box, index) => {
        // Boxes latch on one at a time, then release as the erase begins.
        const on = smoothstep(index * 0.05, index * 0.05 + 0.14, identify) * (1 - erase);
        box.scale.setScalar(0.88 + on * 0.12);
        const material = (box as Mesh).material as MeshStandardMaterial;
        material.opacity = on * 0.5;
      });
    }

    if (beforeGroup.current) beforeGroup.current.visible = erase < 0.995;
    if (afterGroup.current) afterGroup.current.visible = build > 0.005;
  });

  return (
    <group position={[0, -2.2, z]}>
      {/* Room shell: floor and two walls, drawn as a technical grid. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 7]} />
        <meshStandardMaterial
          color={floorColor}
          roughness={0.86}
          metalness={0.14}
          map={gridTexture(512, 42)}
        />
      </mesh>
      <mesh position={[0, 2.2, -3.5]}>
        <planeGeometry args={[9, 4.4]} />
        <meshStandardMaterial color={wallColor} roughness={0.84} metalness={0.1} />
      </mesh>
      <mesh position={[-4.5, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[7, 4.4]} />
        <meshStandardMaterial color={wallColor} roughness={0.84} metalness={0.1} />
      </mesh>

      {/* A window on the back wall — the source of the warm light.
          Kept under the bloom threshold: a blown-out pane washes out the
          type that sits in front of it. */}
      <group position={[2.6, 2.3, -3.44]}>
        <mesh>
          <planeGeometry args={[1.75, 2.05]} />
          <meshStandardMaterial color={hex.ember} emissive={hex.ember} emissiveIntensity={0.34} />
        </mesh>
        {/* Frame and mullions. */}
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[0.05, 2.05]} />
          <meshStandardMaterial color={hex.void} />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[1.75, 0.05]} />
          <meshStandardMaterial color={hex.void} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.9, 0, 0.014]}>
            <planeGeometry args={[0.08, 2.2]} />
            <meshStandardMaterial color={hex.obsidian} roughness={0.7} metalness={0.3} />
          </mesh>
        ))}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[0, side * 1.06, 0.014]}>
            <planeGeometry args={[1.9, 0.08]} />
            <meshStandardMaterial color={hex.obsidian} roughness={0.7} metalness={0.3} />
          </mesh>
        ))}
      </group>

      {/* Segmentation boxes. */}
      <group ref={masks}>
        {MASKS.map((mask, index) => (
          <mesh key={index} position={[...mask.pos]}>
            <boxGeometry args={[...mask.size]} />
            <meshStandardMaterial
              color={hex.emeraldLift}
              emissive={hex.emeraldLift}
              emissiveIntensity={0.9}
              wireframe
              transparent
              opacity={0}
              depthWrite={false}
              toneMapped={false}
              fog={false}
            />
          </mesh>
        ))}
      </group>

      {/* Scan sweep. */}
      <mesh ref={scanner}>
        <planeGeometry args={[9, 4.4]} />
        <meshStandardMaterial
          color={hex.emeraldLift}
          emissive={hex.emeraldLift}
          emissiveIntensity={1.4}
          transparent
          opacity={0}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
          fog={false}
        />
      </mesh>

      {/* The room as found. */}
      <group ref={beforeGroup}>
        <Rug material={beforeMaterial} position={[-0.4, 0.012, 0.3]} rotation={0.08} />
        <Sofa material={beforeMaterial} position={[-1.5, 0, 0.1]} rotation={0.06} />
        <Table material={beforeMaterial} position={[1.05, 0, -0.7]} scale={0.9} />
        <FloorLamp material={beforeMaterial} position={[2.3, 0, 0.5]} />
        <Shelf material={beforeMaterial} position={[-2.5, 0, -1.3]} rotation={0.5} />
      </group>

      {/* The room as proposed. */}
      <group ref={afterGroup}>
        <Rug material={afterMaterial} position={[0.1, 0.012, 0.5]} rotation={-0.12} scale={1.1} />
        <Sofa material={afterMaterial} position={[-1.7, 0, -0.2]} rotation={-0.18} scale={1.15} />
        <Table material={afterMaterial} position={[1.4, 0, 0.4]} scale={0.72} />
        <FloorLamp material={afterMaterial} position={[2.5, 0, -1.1]} scale={1.15} />
        <Shelf material={afterMaterial} position={[-2.8, 0, -1.6]} rotation={0.26} scale={1.2} />
        <Plant material={afterMaterial} position={[1.9, 0, -2.1]} scale={1.3} />
      </group>

      {/* The warm source through the window. */}
      <pointLight position={[2.6, 2.3, -2.4]} color={hex.ember} intensity={26} distance={14} />
      <pointLight position={[-2, 2.6, 1.6]} color={hex.parchment} intensity={9} distance={10} />
    </group>
  );
}
