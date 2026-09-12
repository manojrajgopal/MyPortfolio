'use client';

import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import type { PerformanceTier } from '@/lib/three/performance';

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
  return (
    <EffectComposer enableNormalPass={false} multisampling={tier === 'high' ? 4 : 0}>
      <Bloom
        intensity={0.38}
        luminanceThreshold={0.86}
        luminanceSmoothing={0.2}
        kernelSize={tier === 'high' ? KernelSize.LARGE : KernelSize.MEDIUM}
        mipmapBlur
      />
      <Vignette offset={0.28} darkness={0.62} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}
