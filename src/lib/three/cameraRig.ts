import { Vector3 } from 'three';
import { getSceneWindow } from '@/data/navigation/scenes';
import type { SceneId } from '@/types/scene';
import { clamp } from '@/lib/utils/clamp';

/**
 * The world is one continuous space. Each chapter occupies its own cell along
 * -Z, so scrolling really does fly the camera from one place to another rather
 * than cross-fading between unrelated backdrops.
 */
export const CELL_Z: Record<SceneId, number> = {
  intro: 0,
  identity: -60,
  engineering: -120,
  experience: -190,
  projects: -290,
  ai: -470,
  skills: -540,
  education: -620,
  certifications: -700,
  achievement: -770,
  languages: -830,
  final: -890,
};

/** Stations inside the project chapter — one per project, in order. */
export const PROJECT_STATION_Z: readonly number[] = [-272, -326, -386, -440];

interface CameraKey {
  readonly scene: SceneId;
  /** Position inside the chapter window, 0–1. */
  readonly at: number;
  readonly pos: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly fov: number;
  /** Camera roll in radians. Used sparingly — it reads as a dutch angle. */
  readonly roll?: number;
}

/**
 * The shot list. Read it top to bottom and you have the whole film:
 * approach, open out, travel, orbit, pass through, settle on the horizon.
 */
const SHOTS: readonly CameraKey[] = [
  // 01 — Arrival. The camera starts as far out as the atmosphere allows —
  // any further and the fog simply eats the subject — and closes in.
  { scene: 'intro', at: 0, pos: [0, 2.2, 26], target: [0, 0, 0], fov: 34 },
  { scene: 'intro', at: 0.55, pos: [1.6, 1.4, 18], target: [0, 0, -4], fov: 40 },
  { scene: 'intro', at: 1, pos: [-2.6, 1, 10], target: [0, 0.4, -8], fov: 45 },

  // 02 — Identity. The horizon opens up and the camera lifts.
  { scene: 'identity', at: 0, pos: [-2.6, 1, 8], target: [0, 0.6, -16], fov: 45 },
  { scene: 'identity', at: 0.5, pos: [3, 2.4, -14], target: [0, 1.6, -54], fov: 46 },
  { scene: 'identity', at: 1, pos: [0, 2, -38], target: [0, 1.2, -72], fov: 44 },

  // 03 — Engineering. Structure rises; the camera climbs alongside it.
  { scene: 'engineering', at: 0, pos: [0, 2, -42], target: [0, 1.4, -78], fov: 44 },
  { scene: 'engineering', at: 0.5, pos: [-9, 4.6, -92], target: [0, 3.2, -122], fov: 40, roll: 0.03 },
  { scene: 'engineering', at: 1, pos: [6, 6.6, -128], target: [0, 4, -152], fov: 38 },

  // 04 — Experience. A travelling shot down the rail.
  { scene: 'experience', at: 0, pos: [7, 5, -142], target: [2, 3.2, -176], fov: 40 },
  { scene: 'experience', at: 0.5, pos: [2.6, 2.8, -180], target: [-1.4, 2.2, -206], fov: 43 },
  { scene: 'experience', at: 1, pos: [-3, 2.4, -216], target: [0, 2, -250], fov: 42 },

  // 05 — Project universe.
  //
  // Each station gets two keys, not one: the camera arrives, then pushes in
  // slowly across the whole of that project's window before transiting to the
  // next. With a single key per station the camera was already leaving while
  // the set was still performing.
  //
  // Eyelines differ per station by design — the interior sits on a floor two
  // units below the origin, the classifier stands above it, and the
  // InfiniteWaveX platform sits lower again.
  { scene: 'projects', at: 0, pos: [-3, 0.9, -244], target: [0, -0.6, -268], fov: 46 },

  // 01 — Interior. Eye height inside the room.
  { scene: 'projects', at: 0.06, pos: [0.9, -0.2, -265], target: [0, -1.25, -273.5], fov: 44 },
  { scene: 'projects', at: 0.18, pos: [-0.7, -0.7, -261], target: [0, -1.35, -273], fov: 40 },

  { scene: 'projects', at: 0.26, pos: [4, 1.4, -294], target: [0, 0.4, -314], fov: 46, roll: -0.025 },

  // 02 — Stylist. Level with the classifier and the gauge.
  { scene: 'projects', at: 0.32, pos: [0, 1.4, -319], target: [0, 0.9, -327.5], fov: 42 },
  { scene: 'projects', at: 0.44, pos: [1.3, 0.9, -315.5], target: [0, 0.85, -327], fov: 38 },

  { scene: 'projects', at: 0.52, pos: [-5.2, 1.5, -350], target: [0, 0.6, -372], fov: 46, roll: 0.025 },

  // 03 — Voice. Low, close to the source.
  { scene: 'projects', at: 0.58, pos: [0, 1.1, -379], target: [0, 0.2, -387], fov: 45 },
  { scene: 'projects', at: 0.7, pos: [-1.1, 0.6, -375.5], target: [0, 0.15, -387], fov: 41 },

  { scene: 'projects', at: 0.78, pos: [6, 2, -408], target: [0, 0.3, -432], fov: 46, roll: -0.03 },

  // 04 — InfiniteWaveX. The longest dwell; it is the showpiece.
  { scene: 'projects', at: 0.84, pos: [0, 0.8, -432], target: [0, -0.4, -441], fov: 43 },
  { scene: 'projects', at: 0.96, pos: [1.5, 0.2, -429], target: [0, -0.5, -441], fov: 38 },

  { scene: 'projects', at: 1, pos: [-1.2, 2, -444], target: [0, 1.4, -462], fov: 44 },

  // 06 — AI. The camera passes through the middle of the network.
  { scene: 'ai', at: 0, pos: [-2, 3, -446], target: [0, 2.4, -470], fov: 42 },
  { scene: 'ai', at: 0.5, pos: [3.4, 1.5, -466], target: [0, 2, -484], fov: 52 },
  { scene: 'ai', at: 1, pos: [0, 3.6, -494], target: [0, 2, -520], fov: 44 },

  // 07 — Skills. A slow orbit around the constellation.
  { scene: 'skills', at: 0, pos: [0, 3.2, -502], target: [0, 2, -536], fov: 44 },
  { scene: 'skills', at: 0.5, pos: [9.5, 4.5, -537], target: [0, 1.6, -548], fov: 46 },
  { scene: 'skills', at: 1, pos: [-8, 2.4, -562], target: [0, 1.6, -592], fov: 43 },

  // 08 — Education. Moving between three standing structures.
  { scene: 'education', at: 0, pos: [-6, 2.6, -574], target: [0, 4, -608], fov: 42 },
  { scene: 'education', at: 0.5, pos: [0, 3.2, -617], target: [0, 8, -638], fov: 48 },
  { scene: 'education', at: 1, pos: [3, 5.6, -646], target: [0, 4, -678], fov: 40 },

  // 09 — The vault. Tight, low, deliberate.
  { scene: 'certifications', at: 0, pos: [3, 4.4, -658], target: [0, 2.6, -692], fov: 40 },
  { scene: 'certifications', at: 0.5, pos: [-2.4, 1.9, -691], target: [0, 1.9, -709], fov: 44 },
  { scene: 'certifications', at: 1, pos: [2, 2.5, -718], target: [0, 2, -750], fov: 42 },

  // 10 — Achievement. One object, one move.
  { scene: 'achievement', at: 0, pos: [2, 2.6, -734], target: [0, 2.6, -766], fov: 42 },
  { scene: 'achievement', at: 0.5, pos: [0, 3.2, -755], target: [0, 3.6, -770], fov: 40 },
  { scene: 'achievement', at: 1, pos: [0, 3.2, -782], target: [0, 2.6, -806], fov: 42 },

  // 11 — Languages. Almost still.
  { scene: 'languages', at: 0, pos: [0, 2.4, -792], target: [0, 2, -828], fov: 42 },
  { scene: 'languages', at: 1, pos: [0, 2.6, -822], target: [0, 2.2, -858], fov: 42 },

  // 12 — Horizon. The camera lifts and lets go.
  { scene: 'final', at: 0, pos: [0, 2.6, -848], target: [0, 2.4, -886], fov: 42 },
  { scene: 'final', at: 0.5, pos: [0, 3.5, -874], target: [0, 3, -922], fov: 40 },
  { scene: 'final', at: 1, pos: [0, 4.8, -886], target: [0, 4.6, -954], fov: 36 },
];

interface ResolvedKey {
  readonly at: number;
  readonly pos: Vector3;
  readonly target: Vector3;
  readonly fov: number;
  readonly roll: number;
}

/** Shots flattened onto the global 0–1 scroll axis, sorted once at load. */
const timeline: readonly ResolvedKey[] = SHOTS.map((shot) => {
  const { start, end } = getSceneWindow(shot.scene);
  return {
    at: start + (end - start) * shot.at,
    pos: new Vector3(...shot.pos),
    target: new Vector3(...shot.target),
    fov: shot.fov,
    roll: shot.roll ?? 0,
  };
}).sort((a, b) => a.at - b.at);

export interface CameraPose {
  readonly position: Vector3;
  readonly target: Vector3;
  fov: number;
  roll: number;
}

export function createPose(): CameraPose {
  return { position: new Vector3(), target: new Vector3(), fov: 42, roll: 0 };
}

/** C1-smooth ramp, gentler than smoothstep at the joins. */
function smootherstep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Sample the shot list at a scroll position. Writes into `out` — this runs
 * every frame and must not allocate.
 */
export function samplePose(progress: number, out: CameraPose): CameraPose {
  const p = clamp(progress);
  const first = timeline[0]!;
  const last = timeline[timeline.length - 1]!;

  if (p <= first.at) {
    out.position.copy(first.pos);
    out.target.copy(first.target);
    out.fov = first.fov;
    out.roll = first.roll;
    return out;
  }

  if (p >= last.at) {
    out.position.copy(last.pos);
    out.target.copy(last.target);
    out.fov = last.fov;
    out.roll = last.roll;
    return out;
  }

  let a = first;
  let b = last;
  for (let i = 0; i < timeline.length - 1; i += 1) {
    const current = timeline[i]!;
    const next = timeline[i + 1]!;
    if (p >= current.at && p <= next.at) {
      a = current;
      b = next;
      break;
    }
  }

  const span = b.at - a.at;
  const t = span <= 0 ? 0 : smootherstep((p - a.at) / span);

  out.position.copy(a.pos).lerp(b.pos, t);
  out.target.copy(a.target).lerp(b.target, t);
  out.fov = a.fov + (b.fov - a.fov) * t;
  out.roll = a.roll + (b.roll - a.roll) * t;
  return out;
}
