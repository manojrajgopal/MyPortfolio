import { smoothstep } from '@/lib/utils/clamp';

/**
 * The orb's scroll choreography.
 *
 * Every part of the artifact — shells, rings, arcs, swarm, shockwaves, core —
 * reads these same four beats, so the whole thing moves as one performance
 * rather than as six independent loops that happen to share a centre. The
 * input is the intro chapter's local progress; the output is what each beat
 * is worth at that moment.
 *
 *   ignite     0.00 → 0.18   spool up: the core lights, rings swing in
 *   disperse   0.22 → 0.88   shells push apart, then draw back together
 *   align      0.50 → 0.78   rings abandon their tilts for a single plane
 *   collapse   0.82 → 1.00   everything pulls in and flares as the camera leaves
 */
export interface OrbBeats {
  readonly ignite: number;
  readonly disperse: number;
  readonly align: number;
  readonly collapse: number;
  /** Overall energy level — what the emitters burn at. */
  readonly charge: number;
}

export function orbBeats(local: number): OrbBeats {
  const ignite = smoothstep(0, 0.18, local);

  // Up, hold, and back down: the shells separate to show the core, then close.
  const disperse = smoothstep(0.22, 0.52, local) * (1 - smoothstep(0.66, 0.88, local));

  const align = smoothstep(0.5, 0.78, local);
  const collapse = smoothstep(0.82, 1, local);

  // Hottest at full dispersion and again at the collapse, quiet in between.
  const charge = ignite * (0.5 + disperse * 0.35 + collapse * 0.6);

  return { ignite, disperse, align, collapse, charge };
}
