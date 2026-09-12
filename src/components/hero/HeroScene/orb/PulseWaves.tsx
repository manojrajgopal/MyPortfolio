'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BackSide,
  Color,
  NormalBlending,
  ShaderMaterial,
  type Mesh,
} from 'three';
import { hex } from '@/lib/three/palette';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { orbBeats } from './beats';

interface PulseWavesProps {
  readonly light: boolean;
  readonly reducedMotion: boolean;
  readonly segments: number;
}

const VERTEX = /* glsl */ `
  varying vec3 vNormalV;
  varying vec3 vViewDir;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormalV = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

/**
 * Only the silhouette burns. A solid expanding sphere would read as a bubble;
 * a rim-only one reads as the edge of a shockwave passing through.
 */
const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;

  varying vec3 vNormalV;
  varying vec3 vViewDir;

  void main() {
    float facing = abs(dot(normalize(vNormalV), normalize(vViewDir)));
    float rim = pow(1.0 - facing, 3.5);
    float alpha = rim * uOpacity;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

/** Staggered so a wave leaves the core roughly every two seconds. */
const WAVES = [
  { offset: 0, rate: 0.21, color: hex.ember },
  { offset: 0.34, rate: 0.19, color: hex.copperLift },
  { offset: 0.67, rate: 0.23, color: hex.champagne },
] as const;

/**
 * Shockwaves leaving the core.
 *
 * Three rim-lit shells, each expanding and fading on its own loop, so the orb
 * is visibly *emitting* rather than merely glowing — the thing that gives the
 * chamber around it a scale. They fire harder the further the shells have
 * dispersed, and the collapse sends one last wave out at full strength.
 */
export function PulseWaves({
  light,
  reducedMotion,
  segments,
}: PulseWavesProps): React.JSX.Element {
  const engine = getScrollEngine();
  const meshes = useRef<(Mesh | null)[]>([]);

  const materials = useMemo(
    () =>
      WAVES.map((wave) => {
        const base = new Color(wave.color);
        return new ShaderMaterial({
          uniforms: {
            uColor: { value: light ? base.clone().multiplyScalar(0.5) : base },
            uOpacity: { value: 0 },
          },
          vertexShader: VERTEX,
          fragmentShader: FRAGMENT,
          transparent: true,
          depthWrite: false,
          blending: light ? NormalBlending : AdditiveBlending,
          // Back faces only: the near hemisphere would otherwise sit in front
          // of the orb and veil it every time a wave passes.
          side: BackSide,
          fog: false,
        });
      }),
    [light],
  );

  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials]);

  useFrame((state) => {
    const time = reducedMotion ? 0 : state.clock.elapsedTime;
    const beats = orbBeats(engine.localProgress('intro'));

    const strength =
      beats.ignite * (0.35 + beats.disperse * 0.65 + beats.collapse * 0.9) * (light ? 0.55 : 1);

    WAVES.forEach((wave, index) => {
      const mesh = meshes.current[index];
      const material = materials[index];
      if (!mesh || !material) return;

      // 0 at the core, 1 at full extent — one wave's whole life.
      const life = (time * wave.rate + wave.offset) % 1;

      mesh.scale.setScalar(1.05 + life * 3.4);
      // Bright as it leaves, gone before it reaches the dust.
      material.uniforms.uOpacity!.value = Math.pow(1 - life, 2.2) * 0.9 * strength;
    });
  });

  return (
    <group>
      {WAVES.map((wave, index) => (
        <mesh
          key={wave.offset}
          ref={(node) => {
            meshes.current[index] = node;
          }}
          material={materials[index]}
          frustumCulled={false}
        >
          <sphereGeometry args={[1, Math.max(16, Math.round(segments * 0.6)), Math.max(12, Math.round(segments * 0.4))]} />
        </mesh>
      ))}
    </group>
  );
}
