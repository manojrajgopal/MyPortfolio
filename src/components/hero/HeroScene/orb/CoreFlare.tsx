'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  Color,
  NormalBlending,
  ShaderMaterial,
  type Mesh,
  type Sprite,
  type SpriteMaterial,
} from 'three';
import { hex } from '@/lib/three/palette';
import { softSprite } from '@/lib/three/textures';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { orbBeats } from './beats';

interface CoreFlareProps {
  readonly light: boolean;
  readonly reducedMotion: boolean;
  readonly detail: number;
}

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;

  varying vec3 vNormalV;
  varying vec3 vViewDir;
  varying float vDisp;

  /** Three crossed sines — cheap, seamless on a closed surface, and enough
      structure to read as a boiling mass rather than a smooth ball. */
  float churn(vec3 p) {
    return sin(p.x * 3.4 + uTime * 1.7)
         * sin(p.y * 2.9 - uTime * 1.3)
         * sin(p.z * 3.8 + uTime * 1.1);
  }

  void main() {
    float n = churn(position * 2.2);
    vDisp = n;

    vec3 displaced = position + normal * n * uAmp;
    vec4 mv = modelViewMatrix * vec4(displaced, 1.0);

    vNormalV = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uHot;
  uniform vec3 uCool;
  uniform float uOpacity;

  varying vec3 vNormalV;
  varying vec3 vViewDir;
  varying float vDisp;

  void main() {
    float facing = abs(dot(normalize(vNormalV), normalize(vViewDir)));
    float rim = pow(1.0 - facing, 2.0);

    // Crests run hot, troughs cool: the displacement is visible as colour,
    // not only as silhouette, which matters when the core is nearly filling
    // the frame.
    float heat = clamp(0.5 + vDisp * 0.5, 0.0, 1.0);

    vec3 tint = mix(uCool, uHot, heat);
    float alpha = uOpacity * (0.45 + rim * 0.55);
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(tint, alpha);
  }
`;

/**
 * What the shells are hiding.
 *
 * A boiling core that the dispersion beat exposes: it swells and brightens
 * exactly as the shells pull apart, so opening the orb reveals something
 * rather than emptying it. A cross flare rides in front of it — the one piece
 * of frank lens language in the scene, and the reason the centre reads as a
 * source of light instead of a lit object.
 */
export function CoreFlare({ light, reducedMotion, detail }: CoreFlareProps): React.JSX.Element {
  const engine = getScrollEngine();
  const core = useRef<Mesh>(null);
  const glow = useRef<Sprite>(null);
  const spikeH = useRef<Sprite>(null);
  const spikeV = useRef<Sprite>(null);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uAmp: { value: 0.1 },
          uHot: { value: new Color(light ? hex.copper : 0xfff0dc) },
          uCool: { value: new Color(light ? hex.copperDeep : hex.ember) },
          uOpacity: { value: 0 },
        },
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: light ? NormalBlending : AdditiveBlending,
        fog: false,
      }),
    [light],
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const time = reducedMotion ? 1.2 : state.clock.elapsedTime;
    const beats = orbBeats(engine.localProgress('intro'));

    // Revealed by the dispersion, and thrown wide open by the collapse.
    const exposure = 0.34 + beats.disperse * 0.66 + beats.collapse * 0.8;
    const breath = 1 + Math.sin(time * 2.2) * 0.09;

    material.uniforms.uTime!.value = time;
    material.uniforms.uAmp!.value = 0.07 + beats.disperse * 0.1;
    material.uniforms.uOpacity!.value = beats.ignite * exposure * (light ? 0.55 : 0.85);

    if (core.current) {
      core.current.scale.setScalar((0.42 + beats.disperse * 0.26) * breath);
      core.current.rotation.y = time * 0.5;
      core.current.rotation.x = time * 0.33;
    }

    // The flare answers the core, half a beat behind, so the two never pulse
    // in lockstep and the centre keeps moving.
    const flare = beats.ignite * exposure * (0.85 + Math.sin(time * 2.2 - 0.8) * 0.15);

    if (glow.current) {
      const size = (1.5 + beats.disperse * 0.8) * breath;
      glow.current.scale.set(size, size, 1);
      (glow.current.material as SpriteMaterial).opacity = flare * (light ? 0.16 : 0.5);
    }

    if (spikeH.current) {
      spikeH.current.scale.set(5.2 + beats.collapse * 3, 0.13, 1);
      (spikeH.current.material as SpriteMaterial).opacity = flare * (light ? 0 : 0.42);
    }

    if (spikeV.current) {
      spikeV.current.scale.set(0.1, 3.1 + beats.collapse * 2, 1);
      (spikeV.current.material as SpriteMaterial).opacity = flare * (light ? 0 : 0.3);
    }
  });

  return (
    <group>
      <mesh ref={core} material={material} frustumCulled={false}>
        <icosahedronGeometry args={[1, detail]} />
      </mesh>

      <sprite ref={glow}>
        <spriteMaterial
          map={softSprite()}
          color={light ? hex.copper : hex.ember}
          transparent
          opacity={0}
          depthWrite={false}
          blending={light ? NormalBlending : AdditiveBlending}
          toneMapped={light}
          fog={false}
        />
      </sprite>

      <sprite ref={spikeH}>
        <spriteMaterial
          map={softSprite()}
          color={hex.champagne}
          transparent
          opacity={0}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
          fog={false}
        />
      </sprite>

      <sprite ref={spikeV}>
        <spriteMaterial
          map={softSprite()}
          color={hex.ivory}
          transparent
          opacity={0}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
          fog={false}
        />
      </sprite>
    </group>
  );
}
