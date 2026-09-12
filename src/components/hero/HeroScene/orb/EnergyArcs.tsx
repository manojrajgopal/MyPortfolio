'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  CatmullRomCurve3,
  Color,
  NormalBlending,
  ShaderMaterial,
  TubeGeometry,
  Vector3,
  type Group,
} from 'three';
import { hex } from '@/lib/three/palette';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { orbBeats } from './beats';

interface EnergyArcsProps {
  readonly light: boolean;
  readonly reducedMotion: boolean;
  readonly count: number;
  readonly segments: number;
}

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * A bolt travelling along the tube rather than the whole tube lighting at
 * once — the difference between an arc of energy and a bent wire.
 */
const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uHead;
  uniform float uWidth;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    // Distance to the bolt head along the tube, wrapped so it loops cleanly.
    float d = vUv.x - uHead;
    d -= floor(d + 0.5);

    float bolt = exp(-pow(d / uWidth, 2.0));

    // A faint filament stays lit behind the head, so the path reads even
    // between strikes.
    float filament = 0.12 * smoothstep(0.5, 0.0, abs(d));

    // Taper both ends: a tube that stops dead reads as a cut pipe.
    float taper = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);

    float alpha = (bolt + filament) * taper * uOpacity;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

interface Arc {
  readonly geometry: TubeGeometry;
  readonly material: ShaderMaterial;
  /** Firing offset, so the arcs never strike together. */
  readonly phase: number;
  readonly rate: number;
  readonly speed: number;
}

/** A point on a sphere of the given radius, from a deterministic seed. */
function onSphere(radius: number, seed: number): Vector3 {
  const u = (Math.sin(seed * 127.1) * 43758.5453) % 1;
  const v = (Math.sin(seed * 311.7) * 24634.6345) % 1;
  const theta = Math.abs(u) * Math.PI * 2;
  const phi = Math.acos(2 * Math.abs(v) - 1);
  return new Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
  );
}

/**
 * Discharges leaping off the shell surface.
 *
 * Each arc is a fixed tube — built once, never rebuilt — and the animation
 * lives entirely in the shader: a bolt runs the length of the path, and the
 * arc as a whole fires in bursts on its own rhythm. Scroll decides how often
 * they strike: almost never at rest, constantly at full dispersion when the
 * shells are apart and the core is exposed.
 */
export function EnergyArcs({
  light,
  reducedMotion,
  count,
  segments,
}: EnergyArcsProps): React.JSX.Element {
  const engine = getScrollEngine();
  const root = useRef<Group>(null);

  const arcs = useMemo<Arc[]>(() => {
    const palette = [hex.ember, hex.copperLift, hex.champagne];

    return Array.from({ length: count }, (_, i) => {
      const seed = i + 1;
      const from = onSphere(1.24, seed * 1.7);
      const to = onSphere(1.24, seed * 4.3 + 9);

      // Bow the path outward, so the arc leaves the surface instead of
      // tunnelling through the shells.
      const mid = from
        .clone()
        .add(to)
        .multiplyScalar(0.5)
        .normalize()
        .multiplyScalar(1.62 + (i % 3) * 0.22);

      const lift = from.clone().lerp(mid, 0.5).normalize().multiplyScalar(1.44);
      const fall = mid.clone().lerp(to, 0.5).normalize().multiplyScalar(1.44);

      const curve = new CatmullRomCurve3([from, lift, mid, fall, to]);
      const geometry = new TubeGeometry(curve, segments, 0.011, 3, false);

      const base = new Color(palette[i % palette.length]!);

      const material = new ShaderMaterial({
        uniforms: {
          uColor: { value: light ? base.clone().multiplyScalar(0.6) : base },
          uHead: { value: 0 },
          uWidth: { value: 0.05 + (i % 4) * 0.012 },
          uOpacity: { value: 0 },
        },
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: light ? NormalBlending : AdditiveBlending,
        fog: false,
      });

      return {
        geometry,
        material,
        phase: i * 1.37,
        rate: 0.55 + (i % 5) * 0.19,
        speed: 0.34 + (i % 3) * 0.16,
      };
    });
  }, [count, light, segments]);

  useEffect(
    () => () => {
      arcs.forEach((arc) => {
        arc.geometry.dispose();
        arc.material.dispose();
      });
    },
    [arcs],
  );

  useFrame((state) => {
    const time = reducedMotion ? 2.4 : state.clock.elapsedTime;
    const beats = orbBeats(engine.localProgress('intro'));

    // Arcs are rare at rest and constant once the shells open.
    const availability = 0.18 + beats.disperse * 0.82 + beats.collapse * 0.5;
    const peak = light ? 0.5 : 0.95;

    for (const arc of arcs) {
      // pow on a clipped sine gives a sharp strike with a long dark gap —
      // an arc that is lit half the time reads as a wire.
      const gate = Math.max(0, Math.sin(time * arc.rate + arc.phase));
      const burst = Math.pow(gate, 6);

      arc.material.uniforms.uHead!.value = (time * arc.speed + arc.phase) % 1;
      arc.material.uniforms.uOpacity!.value = burst * availability * peak * beats.ignite;
    }

    if (root.current) {
      root.current.rotation.y = time * 0.07;
      root.current.rotation.x = Math.sin(time * 0.09) * 0.2;
      root.current.scale.setScalar(1 + beats.disperse * 0.22 - beats.collapse * 0.35);
    }
  });

  return (
    <group ref={root}>
      {arcs.map((arc, i) => (
        <mesh key={i} geometry={arc.geometry} material={arc.material} frustumCulled={false} />
      ))}
    </group>
  );
}
