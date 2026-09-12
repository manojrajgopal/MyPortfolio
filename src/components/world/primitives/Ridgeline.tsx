'use client';

import { useMemo } from 'react';
import { BufferAttribute, PlaneGeometry } from 'three';
import { hex } from '@/lib/three/palette';

interface RidgelineProps {
  readonly width: number;
  readonly depth: number;
  readonly segments: number;
  readonly height: number;
  readonly seed?: number;
  readonly color?: number;
  readonly position?: readonly [number, number, number];
  readonly opacity?: number;
  readonly wireframe?: boolean;
}

/** Deterministic value noise — the terrain is identical on every visit. */
function hash2(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function valueNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);

  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);

  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

function fbm(x: number, y: number, seed: number, octaves = 4): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i += 1) {
    value += amplitude * valueNoise(x * frequency, y * frequency, seed + i * 13);
    frequency *= 2.03;
    amplitude *= 0.5;
  }
  return value;
}

/**
 * Ridged multifractal: the absolute value of the noise is inverted at each
 * octave, which produces creases instead of rolling hills. It is the
 * difference between terrain that reads as mountains and terrain that reads
 * as a duvet.
 */
function ridged(x: number, y: number, seed: number, octaves = 5): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let weight = 1;

  for (let i = 0; i < octaves; i += 1) {
    let signal = 1 - Math.abs(valueNoise(x * frequency, y * frequency, seed + i * 17) * 2 - 1);
    signal *= signal;
    signal *= weight;
    weight = Math.min(1, signal * 2);
    value += signal * amplitude;
    frequency *= 2.07;
    amplitude *= 0.52;
  }

  return value;
}

/**
 * A distant range of ridges.
 *
 * This is the one motif carried over from the brand reference — the horizon
 * you are looking out at — rebuilt as geometry rather than an image. It opens
 * the film, and it closes it.
 */
export function Ridgeline({
  width,
  depth,
  segments,
  height,
  seed = 7,
  color = hex.graphite,
  position = [0, 0, 0],
  opacity = 1,
  wireframe = false,
}: RidgelineProps): React.JSX.Element {
  const geometry = useMemo(() => {
    const geo = new PlaneGeometry(width, depth, segments, Math.max(4, Math.round(segments * 0.4)));
    geo.rotateX(-Math.PI / 2);

    const attribute = geo.getAttribute('position') as BufferAttribute;
    const array = attribute.array as Float32Array;

    for (let i = 0; i < attribute.count; i += 1) {
      const x = array[i * 3]!;
      const z = array[i * 3 + 2]!;

      // Ridges run across X and fall away toward the viewer.
      const crest = ridged(x * 0.042, z * 0.02, seed, 5);
      // A slower swell underneath keeps the range from reading as one row.
      const swell = fbm(x * 0.012, z * 0.009, seed + 71, 3);
      const falloff = 1 - Math.min(1, Math.abs(z) / (depth * 0.5));

      array[i * 3 + 1] =
        (crest * 0.82 + swell * 0.4) * height * (0.3 + falloff * 0.7);
    }

    attribute.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [depth, height, seed, segments, width]);

  return (
    <mesh geometry={geometry} position={[...position]} receiveShadow={false}>
      <meshStandardMaterial
        color={color}
        roughness={0.88}
        metalness={0.12}
        flatShading
        transparent={opacity < 1}
        opacity={opacity}
        wireframe={wireframe}
      />
    </mesh>
  );
}
