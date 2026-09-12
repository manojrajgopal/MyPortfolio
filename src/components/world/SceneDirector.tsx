'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Color, FogExp2, type AmbientLight, type DirectionalLight, type Group } from 'three';
import { createResolvedEnvironment, sampleEnvironment } from '@/lib/three/lighting';
import { getEnvironmentMap } from '@/lib/three/environmentMap';
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

  // Metal needs something to reflect. One procedural studio, built once,
  // shared by every surface in the world.
  useEffect(() => {
    scene.environment = getEnvironmentMap(gl);
    return () => {
      scene.environment = null;
    };
  }, [gl, scene]);

  const ambient = useRef<AmbientLight>(null);
  const key = useRef<DirectionalLight>(null);
  const fill = useRef<DirectionalLight>(null);
  const rim = useRef<DirectionalLight>(null);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    sampleEnvironment(engine.state.progress, resolved);

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

    gl.toneMappingExposure = damp(gl.toneMappingExposure, resolved.exposure, 0.004, dt);
    // Reflections rise and fall with the chapter's own light level.
    scene.environmentIntensity = damp(
      scene.environmentIntensity,
      resolved.ambientIntensity * 1.9,
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
