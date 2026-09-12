'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  NormalBlending,
  ShaderMaterial,
} from 'three';
import { hex } from '@/lib/three/palette';
import { softSprite } from '@/lib/three/textures';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { orbBeats } from './beats';

interface OrbitSwarmProps {
  readonly light: boolean;
  readonly reducedMotion: boolean;
  readonly count: number;
}

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uSpread;
  uniform float uAlign;
  uniform float uCollapse;
  uniform float uSize;

  attribute float aRadius;
  attribute float aIncl;
  attribute float aNode;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aScale;

  varying float vTwinkle;
  varying float vHeat;
  varying float vNear;

  vec3 rotX(vec3 p, float a) {
    float c = cos(a); float s = sin(a);
    return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
  }

  vec3 rotY(vec3 p, float a) {
    float c = cos(a); float s = sin(a);
    return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
  }

  void main() {
    float angle = aPhase + uTime * aSpeed;

    // Dispersion widens every orbit; the collapse drags them all inward.
    float radius = aRadius * (1.0 + uSpread * 0.42) * (1.0 - uCollapse * 0.62);

    // Alignment folds the inclinations away, so a spherical swarm of
    // independent orbits resolves into a single flat ring.
    float incl = mix(aIncl, 0.0, uAlign);

    vec3 p = vec3(cos(angle) * radius, 0.0, sin(angle) * radius);
    p = rotX(p, incl);
    p = rotY(p, aNode);

    vTwinkle = 0.4 + 0.6 * sin(uTime * 2.1 + aPhase * 3.0);

    // Inner motes burn hotter, matching the shells they orbit.
    vHeat = 1.0 - smoothstep(1.4, 2.6, aRadius);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float depth = max(-mv.z, 0.4);

    // A mote swinging close to the lens would otherwise fill a quarter of the
    // frame with a soft grey disc — the same guard the dust field uses.
    vNear = smoothstep(2.0, 9.0, depth);

    gl_Position = projectionMatrix * mv;
    gl_PointSize = min(uSize * aScale * (26.0 / depth), 9.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uInner;
  uniform vec3 uOuter;
  uniform float uOpacity;

  varying float vTwinkle;
  varying float vHeat;
  varying float vNear;

  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    float alpha = tex.a * uOpacity * vTwinkle * vNear;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(mix(uOuter, uInner, vHeat), alpha);
  }
`;

/**
 * A swarm held in orbit around the shells.
 *
 * Every mote runs its own inclined circular orbit entirely on the GPU, so a
 * couple of thousand of them cost one draw call and no per-frame JavaScript.
 * The scroll beats reshape the whole swarm at once: it widens as the shells
 * disperse, flattens from a sphere of orbits into one disc at the alignment,
 * and is dragged into the core at the collapse.
 */
export function OrbitSwarm({ light, reducedMotion, count }: OrbitSwarmProps): React.JSX.Element {
  const engine = getScrollEngine();

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const radius = new Float32Array(count);
    const incl = new Float32Array(count);
    const node = new Float32Array(count);
    const phase = new Float32Array(count);
    const speed = new Float32Array(count);
    const scale = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      /**
       * Biased inward, so the swarm is dense against the shell and thins out.
       * The ceiling is deliberately close to the outermost ring: the orb's
       * group is scaled to roughly 2.2, so an orbit of 2.6 already reaches
       * about six world units, and anything wider strews motes across the
       * name instead of reading as a halo around the sphere.
       */
      const r = 1.45 + Math.pow(Math.random(), 1.8) * 1.15;
      radius[i] = r;
      incl[i] = (Math.random() - 0.5) * Math.PI;
      node[i] = Math.random() * Math.PI * 2;
      phase[i] = Math.random() * Math.PI * 2;
      // Closer orbits run faster — the one piece of orbital mechanics that
      // the eye actually notices when it is missing.
      speed[i] = (0.18 + Math.random() * 0.22) * (2.6 / r) * (Math.random() < 0.5 ? -1 : 1);
      scale[i] = 0.4 + Math.random() * 0.9;

      positions[i * 3] = r;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(positions, 3));
    geo.setAttribute('aRadius', new BufferAttribute(radius, 1));
    geo.setAttribute('aIncl', new BufferAttribute(incl, 1));
    geo.setAttribute('aNode', new BufferAttribute(node, 1));
    geo.setAttribute('aPhase', new BufferAttribute(phase, 1));
    geo.setAttribute('aSpeed', new BufferAttribute(speed, 1));
    geo.setAttribute('aScale', new BufferAttribute(scale, 1));
    return geo;
  }, [count]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSpread: { value: 0 },
          uAlign: { value: 0 },
          uCollapse: { value: 0 },
          uSize: { value: 6 },
          uMap: { value: softSprite() },
          uInner: { value: new Color(light ? hex.copper : 0xffd9a8) },
          uOuter: { value: new Color(light ? hex.bronze : hex.copper) },
          uOpacity: { value: 0 },
        },
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: light ? NormalBlending : AdditiveBlending,
      }),
    [light],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((state) => {
    const beats = orbBeats(engine.localProgress('intro'));
    const uniforms = material.uniforms;

    // Frozen motion still wants a composed pose rather than every orbit at
    // angle zero, so the clock holds at an arbitrary offset instead of 0.
    uniforms.uTime!.value = reducedMotion ? 6.4 : state.clock.elapsedTime;
    uniforms.uSpread!.value = beats.disperse;
    uniforms.uAlign!.value = beats.align;
    uniforms.uCollapse!.value = beats.collapse;
    uniforms.uOpacity!.value =
      (light ? 0.4 : 0.72) * beats.ignite * (0.55 + beats.charge * 0.45);
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
