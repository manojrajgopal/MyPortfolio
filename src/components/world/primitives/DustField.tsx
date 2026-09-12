'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  ShaderMaterial,
  type FogExp2,
  type Points as PointsObject,
} from 'three';
import { softSprite } from '@/lib/three/textures';

interface DustFieldProps {
  readonly count: number;
  /** Half-extent of the volume the motes occupy. */
  readonly spread: readonly [number, number, number];
  readonly color: number;
  readonly size?: number;
  readonly opacity?: number;
  /** Vertical drift speed, world units per second. */
  readonly rise?: number;
  readonly still?: boolean;
}

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uRise;
  uniform vec3 uSpread;
  uniform float uFogDensity;
  attribute float aSeed;
  attribute float aScale;
  varying float vTwinkle;
  varying float vFog;
  varying float vNear;

  void main() {
    vec3 pos = position;

    // Each mote drifts on its own slow loop, then wraps inside the volume.
    pos.y = mod(pos.y + uTime * uRise * (0.4 + aScale) + uSpread.y, uSpread.y * 2.0) - uSpread.y;
    pos.x += sin(uTime * 0.16 + aSeed * 6.2831) * 0.6;
    pos.z += cos(uTime * 0.13 + aSeed * 6.2831) * 0.6;

    vTwinkle = 0.45 + 0.55 * sin(uTime * 0.8 + aSeed * 12.566);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);

    // Motes obey the same exponential fog as the solid world, otherwise
    // distant chapters read as a starfield instead of dissolving away.
    float depth = max(0.0, -mv.z);
    vFog = exp(-pow(uFogDensity * depth, 2.0));

    // A mote that drifts right up to the lens would otherwise fill the frame
    // with a soft grey disc, so the sprite is capped and faded out up close.
    vNear = smoothstep(1.5, 9.0, depth);

    gl_Position = projectionMatrix * mv;
    gl_PointSize = min(uSize * aScale * (60.0 / max(depth, 1.0)), 24.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vTwinkle;
  varying float vFog;
  varying float vNear;

  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    float alpha = tex.a * uOpacity * vTwinkle * vFog * vNear;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

/**
 * Suspended motes. Present in almost every chapter — they give the empty
 * space a scale and let the key light read as volumetric.
 */
export function DustField({
  count,
  spread,
  color,
  size = 14,
  opacity = 0.5,
  rise = 0.22,
  still = false,
}: DustFieldProps): React.JSX.Element {
  const points = useRef<PointsObject>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() * 2 - 1) * spread[0];
      positions[i * 3 + 1] = (Math.random() * 2 - 1) * spread[1];
      positions[i * 3 + 2] = (Math.random() * 2 - 1) * spread[2];
      seeds[i] = Math.random();
      scales[i] = 0.35 + Math.random() * 0.95;
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new BufferAttribute(seeds, 1));
    geo.setAttribute('aScale', new BufferAttribute(scales, 1));
    return geo;
  }, [count, spread]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: size },
          uRise: { value: still ? 0 : rise },
          uSpread: { value: [spread[0], spread[1], spread[2]] },
          uMap: { value: softSprite() },
          uColor: { value: new Color(color) },
          uOpacity: { value: opacity },
          uFogDensity: { value: 0.03 },
        },
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [color, opacity, rise, size, spread, still],
  );

  useFrame((state) => {
    // Track the director's fog even when the motes themselves are frozen.
    const fog = state.scene.fog;
    if (fog && 'density' in fog) {
      material.uniforms.uFogDensity!.value = (fog as FogExp2).density;
    }
    if (still) return;
    material.uniforms.uTime!.value = state.clock.elapsedTime;
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />;
}
