'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';
import { ACESFilmicToneMapping } from 'three';
import { useExperience } from '@/components/experience/ExperienceProvider';
import { disposeTextures } from '@/lib/three/textures';
import { disposeEnvironmentMap } from '@/lib/three/environmentMap';
import { WorldContent } from './WorldContent';
import { WorldFallback } from './WorldFallback';
import { WorldPostProcessing } from './WorldPostProcessing';

/**
 * The single persistent WebGL surface behind the entire experience.
 *
 * It is created once and never unmounted between chapters — every chapter
 * lives inside it. Where WebGL is unavailable the canvas is replaced by a
 * rendered fallback rather than a broken context.
 */
export function WorldCanvas(): React.JSX.Element {
  const { profile, reducedMotion, webgl, markReady } = useExperience();

  useEffect(
    () => () => {
      disposeTextures();
      disposeEnvironmentMap();
    },
    [],
  );

  if (!webgl) return <WorldFallback />;

  return (
    <div className="world" aria-hidden="true">
      <Canvas
        dpr={[profile.dpr[0], profile.dpr[1]]}
        gl={{
          antialias: profile.tier !== 'low',
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
          depth: true,
        }}
        camera={{ fov: 34, near: 0.1, far: 220, position: [0, 2.2, 26] }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.86;
          markReady();
        }}
        // Render only what the chapters ask for; nothing polls unnecessarily.
        frameloop="always"
      >
        <Suspense fallback={null}>
          <WorldContent profile={profile} reducedMotion={reducedMotion} />
          {profile.postprocessing ? <WorldPostProcessing tier={profile.tier} /> : null}
        </Suspense>
      </Canvas>
    </div>
  );
}
