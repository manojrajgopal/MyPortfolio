'use client';

import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  NormalBlending,
  Color,
  LoopRepeat,
  type AnimationAction,
  type Group,
  type IUniform,
  type Mesh,
  type MeshStandardMaterial,
  type PointLight,
} from 'three';
import { hex } from '@/lib/three/palette';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { scaleCount, type PerformanceProfile } from '@/lib/three/performance';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { smoothstep } from '@/lib/utils/clamp';
import { orbBeats } from './orb/beats';
import { CoreFlare } from './orb/CoreFlare';
import { EnergyArcs } from './orb/EnergyArcs';
import { OrbitalRings } from './orb/OrbitalRings';
import { OrbitSwarm } from './orb/OrbitSwarm';
import { PulseWaves } from './orb/PulseWaves';

export const ENERGY_ORB_URL = '/models/hero/energy_orb.glb';

interface EnergyOrbProps {
  readonly reducedMotion: boolean;
  readonly profile: PerformanceProfile;
}

interface ShellUniforms {
  readonly uTime: IUniform<number>;
  readonly uSpread: IUniform<number>;
  readonly uWobble: IUniform<number>;
  readonly uShell: IUniform<number>;
}

/**
 * Injected into each shell's standard material.
 *
 * Two things the GLB cannot do on its own: every vertex rides a slow churn so
 * the shells breathe instead of holding a perfect sphere, and `uSpread` pushes
 * each shell out along its own normals — further for the outer ones — which is
 * how the orb opens on scroll without any of the meshes being moved.
 */
const SHELL_DISPLACEMENT = /* glsl */ `
  vec3 transformed = vec3( position );

  float churn = sin(position.x * 4.1 + uTime * 1.15 + uShell * 7.0)
              * sin(position.y * 3.3 - uTime * 0.92 + uShell * 3.1)
              * sin(position.z * 4.7 + uTime * 1.04);

  transformed += normal * (uSpread * (0.12 + uShell * 1.45) + churn * uWobble);
`;

/**
 * The object the film opens on.
 *
 * The GLB ships twelve concentric shells on a baked clip, all sharing one
 * near-clear black glass material — as authored it renders as almost nothing.
 * Everything that makes it an artifact is built here: the shells are
 * re-materialised as graded energy and given a displacement shader, and five
 * further systems are hung around them — a ring gyroscope, arc discharges, an
 * orbiting swarm, emitted shockwaves, and the core they are all hiding.
 *
 * All six read the same scroll choreography (see `orb/beats.ts`), so the orb
 * ignites, opens to show its core, aligns onto a single plane, and collapses
 * as one performance across the chapter rather than six loops sharing a centre.
 */
export function EnergyOrb({ reducedMotion, profile }: EnergyOrbProps): React.JSX.Element {
  const engine = getScrollEngine();
  const root = useRef<Group>(null);
  const shellRoot = useRef<Group>(null);
  const lamp = useRef<PointLight>(null);
  const action = useRef<AnimationAction | null>(null);

  const { scene, animations } = useGLTF(ENERGY_ORB_URL);
  const { actions } = useAnimations(animations, root);

  const light = useResolvedTheme() === 'light';

  /** Budget per tier. The swarm and the arcs are what actually cost here. */
  const budget = useMemo(() => {
    const { tier } = profile;
    return {
      rings: tier === 'high' ? 5 : tier === 'mid' ? 4 : 3,
      arcs: tier === 'high' ? 9 : tier === 'mid' ? 6 : 3,
      swarm: scaleCount(1500, profile, 220),
      coreDetail: tier === 'high' ? 3 : tier === 'mid' ? 2 : 1,
      ringSegments: tier === 'high' ? 96 : tier === 'mid' ? 64 : 36,
      tubeSegments: tier === 'high' ? 48 : tier === 'mid' ? 32 : 20,
      // Only the top tier animates the clip; below that it holds a pose.
      playClip: tier !== 'low',
    };
  }, [profile]);

  /**
   * One instance, so the loaded scene is used directly rather than cloned —
   * but the materials that ship with it are shared by the drei cache, so each
   * shell gets its own before anything is changed.
   */
  const shells = useMemo(() => {
    const found: Mesh[] = [];
    scene.traverse((object) => {
      const mesh = object as Mesh;
      if (mesh.isMesh) found.push(mesh);
    });

    // Innermost first, so the colour ramp follows the geometry outward.
    found.sort((a, b) => {
      a.geometry.computeBoundingSphere();
      b.geometry.computeBoundingSphere();
      return (a.geometry.boundingSphere?.radius ?? 0) - (b.geometry.boundingSphere?.radius ?? 0);
    });

    return found;
  }, [scene]);

  /** Core → rim ramp. Warm centre, cooler shell, in the site's palette. */
  const ramp = useMemo(
    () => [new Color(hex.ember), new Color(hex.copperLift), new Color(hex.champagne)],
    [],
  );

  useEffect(() => {
    shells.forEach((mesh, index) => {
      const t = shells.length > 1 ? index / (shells.length - 1) : 0;
      const tone = new Color();

      if (t < 0.5) tone.copy(ramp[0]!).lerp(ramp[1]!, t * 2);
      else tone.copy(ramp[1]!).lerp(ramp[2]!, (t - 0.5) * 2);

      const material = (mesh.material as MeshStandardMaterial).clone();

      if (light) {
        /**
         * Additive light can only move a pixel toward white, so on paper the
         * whole orb saturates into a flat disc and every shell disappears.
         * The light theme stacks ordinary translucency instead: twelve
         * layers of a deep amber accumulate into a dense, lit sphere that
         * still shows its structure against a bright ground.
         */
        material.color = tone.clone().lerp(new Color(hex.copperDeep), 0.55);
        material.emissive = tone.clone();
        material.emissiveIntensity = 0.3 - t * 0.18;
        material.opacity = 0.13 - t * 0.07;
        material.blending = NormalBlending;
        material.toneMapped = true;
      } else {
        material.color = tone;
        material.emissive = tone.clone();
        // Outer shells burn lower, which is what gives the sphere its falloff.
        // Held below the point where the core clips to flat white — the shells
        // are the whole point, and a blown centre hides them.
        material.emissiveIntensity = 1.15 - t * 0.72;
        material.opacity = 0.16 - t * 0.09;
        material.blending = AdditiveBlending;
        material.toneMapped = false;
      }

      material.transparent = true;
      material.depthWrite = false;
      material.fog = false;

      const uniforms: ShellUniforms = {
        uTime: { value: 0 },
        uSpread: { value: 0 },
        uWobble: { value: 0 },
        uShell: { value: t },
      };

      material.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = uniforms.uTime;
        shader.uniforms.uSpread = uniforms.uSpread;
        shader.uniforms.uWobble = uniforms.uWobble;
        shader.uniforms.uShell = uniforms.uShell;

        shader.vertexShader = shader.vertexShader
          .replace(
            '#include <common>',
            `#include <common>
             uniform float uTime;
             uniform float uSpread;
             uniform float uWobble;
             uniform float uShell;`,
          )
          .replace('#include <begin_vertex>', SHELL_DISPLACEMENT);
      };

      // Every shell compiles the same source and differs only by uniform, so
      // they share one program instead of twelve.
      material.customProgramCacheKey = () => 'energy-orb-shell';
      material.needsUpdate = true;

      mesh.material = material;
      mesh.renderOrder = index;
      mesh.userData.shell = t;
      mesh.userData.uniforms = uniforms;
    });

    return () => {
      shells.forEach((mesh) => (mesh.material as MeshStandardMaterial).dispose());
    };
  }, [light, ramp, shells]);

  // The baked clip carries the churn between shells.
  useEffect(() => {
    const clip = Object.values(actions)[0];
    if (!clip) return;
    action.current = clip;

    if (!budget.playClip || reducedMotion) {
      // Hold a single readable pose rather than a collapsed one.
      clip.play().paused = true;
      clip.time = 0.35;
      return;
    }

    clip.reset().setLoop(LoopRepeat, Infinity).play();
    return () => {
      clip.stop();
      action.current = null;
    };
  }, [actions, budget.playClip, reducedMotion]);

  useFrame((state) => {
    const node = root.current;
    if (!node) return;

    const local = engine.localProgress('intro');
    const time = reducedMotion ? 0 : state.clock.elapsedTime;
    const beats = orbBeats(local);

    // Already substantial when the film opens; arriving tightens and lifts it.
    const arrive = smoothstep(0, 0.72, local);

    /**
     * The orb turns faster the more charged it is, and takes a hard lean at
     * the alignment beat — the axis change is what makes the shells read as
     * a three-dimensional body rather than a flat sprite.
     */
    node.rotation.y = time * (0.12 + beats.charge * 0.22) + local * 1.1;
    node.rotation.x = Math.sin(time * 0.16) * 0.12 + beats.align * 0.42;
    node.rotation.z = beats.align * -0.28 + beats.collapse * 0.5;

    node.scale.setScalar(
      (2.15 + arrive * 0.5) * (1 + beats.disperse * 0.1 - beats.collapse * 0.22),
    );

    // The clip itself accelerates with the charge, so the churn between the
    // shells speeds up as the chapter builds.
    if (action.current && !action.current.paused) {
      action.current.timeScale = 0.55 + beats.charge * 1.1;
    }

    // Shells counter-rotate against the group, so layers shear past each other.
    if (shellRoot.current) {
      shellRoot.current.rotation.y = -time * 0.09 - beats.disperse * 0.6;
    }

    // The core breathes; the shells answer more slowly the further out they are.
    const pulse = 1 + Math.sin(time * 1.3) * 0.16;
    const base = light ? 0.3 : 1.15;
    const falloff = light ? 0.18 : 0.72;

    for (const mesh of shells) {
      const t = mesh.userData.shell as number;
      const material = mesh.material as MeshStandardMaterial;

      material.emissiveIntensity =
        (base - t * falloff) *
        (0.55 + arrive * 0.45) *
        (1 + (pulse - 1) * (1 - t)) *
        (1 + beats.collapse * 1.4);

      const uniforms = mesh.userData.uniforms as ShellUniforms | undefined;
      if (uniforms) {
        uniforms.uTime.value = time;
        uniforms.uSpread.value = beats.disperse * 0.34;
        // Wobble grows as the shells separate — a tight sphere should look
        // solid, an opened one should look unstable.
        uniforms.uWobble.value = reducedMotion ? 0 : 0.012 + beats.disperse * 0.055;
      }
    }

    if (lamp.current) {
      lamp.current.intensity = (light ? 6 : 18) * (0.5 + beats.charge * 0.9) * pulse;
    }
  });

  return (
    <group ref={root}>
      <group ref={shellRoot}>
        <primitive object={scene} />
      </group>

      <CoreFlare light={light} reducedMotion={reducedMotion} detail={budget.coreDetail} />

      <OrbitalRings
        light={light}
        reducedMotion={reducedMotion}
        count={budget.rings}
        segments={budget.ringSegments}
      />

      <EnergyArcs
        light={light}
        reducedMotion={reducedMotion}
        count={budget.arcs}
        segments={budget.tubeSegments}
      />

      <OrbitSwarm light={light} reducedMotion={reducedMotion} count={budget.swarm} />

      <PulseWaves light={light} reducedMotion={reducedMotion} segments={budget.ringSegments} />

      {/* A point light inside the shells, so the dust around the orb picks up
          its colour instead of the orb floating in unrelated air. */}
      <pointLight ref={lamp} color={hex.ember} intensity={0} distance={16} />
    </group>
  );
}

useGLTF.preload(ENERGY_ORB_URL);
