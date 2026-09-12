'use client';

import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import { useEffect, useState } from 'react';
import type { PerformanceTier } from '@/lib/three/performance';
import { getThemeStore, type ResolvedTheme } from '@/lib/theme/themeStore';

interface WorldPostProcessingProps {
  readonly tier: PerformanceTier;
}

/**
 * Grading, not effects.
 *
 * The bloom threshold sits high enough that only genuinely emissive things —
 * the copper core, the seal, signal pulses — pick up any halo. Suspended dust
 * is additive and would otherwise bloom into large soft discs, so the
 * threshold is set above what a mote can reach. Nothing here is allowed to
 * make the world glow.
 */
export function WorldPostProcessing({ tier }: WorldPostProcessingProps): React.JSX.Element {
  const store = getThemeStore();
  const [theme, setTheme] = useState<ResolvedTheme>(() => store.getResolved());
  useEffect(() => store.subscribe(setTheme), [store]);

  const light = theme === 'light';

  return (
    <EffectComposer enableNormalPass={false} multisampling={tier === 'high' ? 4 : 0}>
      {/* On a pale ground almost everything clears a low threshold, so the
          light theme raises the bar and softens the halo; otherwise every
          emissive edge smears across the frame. */}
      <Bloom
        intensity={light ? 0.2 : 0.38}
        luminanceThreshold={light ? 0.98 : 0.86}
        luminanceSmoothing={light ? 0.12 : 0.2}
        kernelSize={tier === 'high' ? KernelSize.LARGE : KernelSize.MEDIUM}
        mipmapBlur
      />
      <Vignette
        offset={light ? 0.42 : 0.28}
        darkness={light ? 0.22 : 0.62}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
