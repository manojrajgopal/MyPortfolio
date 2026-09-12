'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Vector3, type PerspectiveCamera } from 'three';
import { createPose, samplePose } from '@/lib/three/cameraRig';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { clamp } from '@/lib/utils/clamp';
import { damp } from '@/lib/utils/lerp';

interface CinematicCameraProps {
  readonly reducedMotion: boolean;
}

/** Parallax travel, in world units, at the extremes of the viewport. */
const PARALLAX = { x: 1.15, y: 0.62 } as const;
/** How much scroll speed widens the lens. Reads as momentum. */
const VELOCITY_FOV = 3.4;
/**
 * On a portrait screen the frame is narrow, so a shot composed for a wide
 * viewport leaves its subject small and marooned in the middle. The camera
 * dollies in proportionally instead of the layout simply being shrunk.
 */
const PORTRAIT_DOLLY = 0.46;
const PORTRAIT_DOLLY_MAX = 0.34;

/**
 * A camera operator, not a scroll-linked transform.
 *
 * The shot list gives an ideal pose for every scroll position; the camera
 * then eases toward that pose, so fast scrolling produces lag and overshoot
 * the way a real rig would. On top of that sit two small, deliberate layers:
 * a breathing drift and pointer parallax.
 */
export function CinematicCamera({ reducedMotion }: CinematicCameraProps): null {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const viewport = useThree((state) => state.size);
  const engine = getScrollEngine();

  const pose = useMemo(createPose, []);
  const position = useRef(new Vector3(0, 3.2, 96));
  const target = useRef(new Vector3(0, 0, 0));
  const lookAt = useMemo(() => new Vector3(), []);
  const fov = useRef(28);
  const initialised = useRef(false);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const { progress, velocity, pointerX, pointerY } = engine.state;

    samplePose(progress, pose);

    // Close the gap to the subject on tall, narrow screens.
    const aspect = viewport.width / Math.max(1, viewport.height);
    const dolly = clamp((1 - aspect) * PORTRAIT_DOLLY, 0, PORTRAIT_DOLLY_MAX);
    if (dolly > 0) pose.position.lerp(pose.target, dolly);

    // Breathing: a slow figure-of-eight so a still frame is never truly still.
    const time = performance.now() / 1000;
    const breathX = reducedMotion ? 0 : Math.sin(time * 0.21) * 0.28;
    const breathY = reducedMotion ? 0 : Math.cos(time * 0.17) * 0.2;

    const parallaxX = reducedMotion ? 0 : pointerX * PARALLAX.x;
    const parallaxY = reducedMotion ? 0 : -pointerY * PARALLAX.y;

    const desiredX = pose.position.x + breathX + parallaxX;
    const desiredY = pose.position.y + breathY + parallaxY;
    const desiredZ = pose.position.z;

    // Snap on the first frame so the opening shot is never an interpolation.
    if (!initialised.current) {
      initialised.current = true;
      position.current.set(desiredX, desiredY, desiredZ);
      target.current.copy(pose.target);
      fov.current = pose.fov;
    }

    const ease = reducedMotion ? 0.000001 : 0.0007;
    position.current.x = damp(position.current.x, desiredX, ease, dt);
    position.current.y = damp(position.current.y, desiredY, ease, dt);
    position.current.z = damp(position.current.z, desiredZ, ease, dt);

    target.current.x = damp(target.current.x, pose.target.x + parallaxX * 0.28, ease, dt);
    target.current.y = damp(target.current.y, pose.target.y + parallaxY * 0.28, ease, dt);
    target.current.z = damp(target.current.z, pose.target.z, ease, dt);

    const desiredFov = pose.fov + (reducedMotion ? 0 : Math.abs(velocity) * VELOCITY_FOV);
    fov.current = damp(fov.current, desiredFov, 0.0009, dt);

    camera.position.copy(position.current);
    lookAt.copy(target.current);
    camera.lookAt(lookAt);

    // Roll last: lookAt resets the up vector, so the dutch angle goes on top.
    if (!reducedMotion && pose.roll !== 0) camera.rotateZ(pose.roll);

    if (Math.abs(camera.fov - fov.current) > 0.01) {
      camera.fov = fov.current;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
