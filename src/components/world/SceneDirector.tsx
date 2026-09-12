'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Color,
  FogExp2,
  type AmbientLight,
  type DirectionalLight,
  type Group,
  type Material,
  type Mesh,
  type Scene,
} from 'three';
import { createResolvedEnvironment, sampleEnvironment } from '@/lib/three/lighting';
import { getEnvironmentMap } from '@/lib/three/environmentMap';
import { getThemeStore, type ResolvedTheme } from '@/lib/theme/themeStore';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { damp } from '@/lib/utils/lerp';

/**
 * Lighting and atmosphere for the whole world, sampled from one continuous
 * curve. Chapters do not switch lights on and off — the director eases the
 * key, fill, rim, fog and exposure between chapter recipes as the camera
 * travels, so the world changes mood without ever cutting.
 */
export function SceneDirector(): React.JSX.Element {
  const engine = getScrollEngine();
  const scene = useThree((state) => state.scene);
  const gl = useThree((state) => state.gl);

  const resolved = useMemo(createResolvedEnvironment, []);
  const fog = useMemo(() => new FogExp2(new Color(0x050506).getHex(), 0.03), []);

  const themeStore = getThemeStore();
  const [theme, setTheme] = useState<ResolvedTheme>(() => themeStore.getResolved());
  /** 0 = the dark world, 1 = the light one. Eased, never switched. */
  const lightness = useRef(themeStore.getResolved() === 'light' ? 1 : 0);

  useEffect(() => themeStore.subscribe(setTheme), [themeStore]);

  // Emissive surfaces opt out of tone mapping so they stay hot against the
  // dark world. On paper that same setting makes them pure white — they
  // bypass exposure entirely. Rather than thread a theme prop through every
  // scene, the director walks the tree and grades them.
  //
  // Chapters mount and unmount as the camera travels, so this cannot be a
  // one-shot on theme change; it runs on a slow interval instead, which costs
  // a few hundred property reads twice a second.
  const gradeFrame = useRef(0);

  // Metal needs something to reflect. One procedural studio per theme, built
  // once, shared by every surface in the world.
  useEffect(() => {
    scene.environment = getEnvironmentMap(gl, theme);
    return () => {
      scene.environment = null;
    };
  }, [gl, scene, theme]);

  const ambient = useRef<AmbientLight>(null);
  const key = useRef<DirectionalLight>(null);
  const fill = useRef<DirectionalLight>(null);
  const rim = useRef<DirectionalLight>(null);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    // The theme crossfades rather than cutting: every fog colour, light and
    // exposure travels between the two worlds over about half a second.
    lightness.current = damp(lightness.current, theme === 'light' ? 1 : 0, 0.0009, dt);
    sampleEnvironment(engine.state.progress, resolved, lightness.current);

    if (!scene.fog) scene.fog = fog;
    fog.color.copy(resolved.fog);
    fog.density = damp(fog.density, resolved.fogDensity, 0.002, dt);

    if (!scene.background) scene.background = new Color();
    (scene.background as Color).copy(resolved.background);

    if (ambient.current) {
      ambient.current.color.copy(resolved.ambientColor);
      ambient.current.intensity = resolved.ambientIntensity;
    }
    if (key.current) {
      key.current.color.copy(resolved.key.color);
      key.current.intensity = resolved.key.intensity;
      key.current.position.copy(resolved.key.position);
    }
    if (fill.current) {
      fill.current.color.copy(resolved.fill.color);
      fill.current.intensity = resolved.fill.intensity;
      fill.current.position.copy(resolved.fill.position);
    }
    if (rim.current) {
      rim.current.color.copy(resolved.rim.color);
      rim.current.intensity = resolved.rim.intensity;
      rim.current.position.copy(resolved.rim.position);
    }

    gradeFrame.current += 1;
    if (gradeFrame.current % 30 === 0) gradeEmissives(scene, lightness.current > 0.5);

    gl.toneMappingExposure = damp(gl.toneMappingExposure, resolved.exposure, 0.004, dt);

    // Reflections rise and fall with the chapter's own light level — but the
    // light world raises ambient sharply to keep objects off silhouette, and
    // tying reflection strength to that would have every metal surface
    // mirroring a bright studio at over twice intensity. Small metal details
    // blow out to white specks. The two are scaled independently.
    const darkReflection = resolved.ambientIntensity * 1.9;
    const lightReflection = 0.85;
    scene.environmentIntensity = damp(
      scene.environmentIntensity,
      darkReflection + (lightReflection - darkReflection) * lightness.current,
      0.004,
      dt,
    );
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0.3} />
      {/* Lights travel with the camera cell so their angles stay meaningful. */}
      <CameraBoundLights keyRef={key} fillRef={fill} rimRef={rim} />
    </>
  );
}

interface GradedMaterial extends Material {
  emissiveIntensity?: number;
  userData: {
    baseToneMapped?: boolean;
    rim?: { uRimScale: { value: number } };
  };
}

/** Fresnel rims read as blown-out sparkle on a pale ground. */
const LIGHT_RIM_SCALE = 0.28;

/**
 * Grade every emissive material in the scene for the current theme.
 *
 * Emissive surfaces opt out of tone mapping so they stay hot against the dark
 * world; on paper that same setting makes them pure white, because they skip
 * ACES and exposure entirely. Putting them back through tone mapping in the
 * light theme is the whole fix — and it is the only durable one, since the
 * scenes rewrite `emissiveIntensity` every frame and would immediately undo
 * any value set here.
 *
 * The authored setting is stashed on first sight so the dark world returns to
 * exactly what each scene asked for.
 */
function gradeEmissives(scene: Scene, light: boolean): void {
  scene.traverse((object) => {
    const mesh = object as Mesh;
    const material = mesh.material as GradedMaterial | GradedMaterial[] | undefined;
    if (!material) return;

    const list = Array.isArray(material) ? material : [material];
    for (const entry of list) {
      // Rim materials carry their own uniform block; scale it for the theme
      // without touching the value the scene animates.
      const rim = entry.userData?.rim;
      if (rim) rim.uRimScale.value = light ? LIGHT_RIM_SCALE : 1;

      if (entry.emissiveIntensity === undefined) continue;

      entry.userData.baseToneMapped ??= entry.toneMapped;

      const wanted = light ? true : (entry.userData.baseToneMapped ?? true);
      if (entry.toneMapped !== wanted) {
        entry.toneMapped = wanted;
        entry.needsUpdate = true;
      }
    }
  });
}

interface LightRefs {
  readonly keyRef: React.RefObject<DirectionalLight | null>;
  readonly fillRef: React.RefObject<DirectionalLight | null>;
  readonly rimRef: React.RefObject<DirectionalLight | null>;
}

/**
 * Directional lights are positioned relative to whatever the camera is
 * looking at, so a recipe like "key from the upper left" holds true in every
 * chapter rather than pointing at the origin from 900 units away.
 */
function CameraBoundLights({ keyRef, fillRef, rimRef }: LightRefs): React.JSX.Element {
  const camera = useThree((state) => state.camera);
  const anchor = useRef<Group>(null);

  useFrame(() => {
    const node = anchor.current;
    if (!node) return;
    // Follow the camera in Z only: chapters live along that axis.
    node.position.z = damp(node.position.z, camera.position.z - 12, 0.0001, 0.016);
  });

  return (
    <group ref={anchor}>
      <directionalLight ref={keyRef} intensity={1.5} />
      <directionalLight ref={fillRef} intensity={0.5} />
      <directionalLight ref={rimRef} intensity={0.6} />
    </group>
  );
}
