export type PerformanceTier = 'low' | 'mid' | 'high';

export interface PerformanceProfile {
  readonly tier: PerformanceTier;
  /** Device pixel ratio bounds handed to the R3F canvas. */
  readonly dpr: readonly [number, number];
  /** Multiplier applied to every particle / instance count. */
  readonly density: number;
  readonly shadows: boolean;
  readonly postprocessing: boolean;
  /** Segment counts for procedural geometry. */
  readonly segments: number;
}

const PROFILES: Record<PerformanceTier, PerformanceProfile> = {
  low: { tier: 'low', dpr: [1, 1.2], density: 0.32, shadows: false, postprocessing: false, segments: 16 },
  mid: { tier: 'mid', dpr: [1, 1.6], density: 0.62, shadows: false, postprocessing: true, segments: 32 },
  high: { tier: 'high', dpr: [1, 2], density: 1, shadows: true, postprocessing: true, segments: 64 },
};

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

/**
 * Conservative, synchronous capability read. Runs once on the client;
 * the result gates geometry density everywhere in the world.
 */
export function detectPerformance(): PerformanceProfile {
  if (typeof window === 'undefined') return PROFILES.mid;

  const nav = navigator as NavigatorWithMemory;
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.innerWidth < 760;

  if (coarse || narrow || cores <= 4 || memory <= 4) return PROFILES.low;
  if (cores <= 8 || memory <= 8) return PROFILES.mid;
  return PROFILES.high;
}

/** Scale a count by device density, never below a usable floor. */
export function scaleCount(base: number, profile: PerformanceProfile, floor = 6): number {
  return Math.max(floor, Math.round(base * profile.density));
}

/** True when the browser cannot give us a WebGL2 (or WebGL) context. */
export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ??
        canvas.getContext('webgl') ??
        canvas.getContext('experimental-webgl'),
    );
  } catch {
    return false;
  }
}
