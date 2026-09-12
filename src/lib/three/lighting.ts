import { Color, Vector3 } from 'three';
import { sceneWindows } from '@/data/navigation/scenes';
import type { SceneId } from '@/types/scene';
import { environments, type EnvironmentRecipe, type LightRecipe } from './environments';
import { smoothstep } from '@/lib/utils/clamp';

export interface ResolvedLight {
  readonly color: Color;
  intensity: number;
  readonly position: Vector3;
}

export interface ResolvedEnvironment {
  readonly fog: Color;
  fogDensity: number;
  readonly background: Color;
  readonly ambientColor: Color;
  ambientIntensity: number;
  readonly key: ResolvedLight;
  readonly fill: ResolvedLight;
  readonly rim: ResolvedLight;
  exposure: number;
}

function createLight(): ResolvedLight {
  return { color: new Color(), intensity: 0, position: new Vector3() };
}

/** Allocate once, mutate per frame. Nothing here may allocate in the loop. */
export function createResolvedEnvironment(): ResolvedEnvironment {
  return {
    fog: new Color(),
    fogDensity: 0.03,
    background: new Color(),
    ambientColor: new Color(),
    ambientIntensity: 0.3,
    key: createLight(),
    fill: createLight(),
    rim: createLight(),
    exposure: 1,
  };
}

/** Midpoint of each scene window — the anchor each recipe is pinned to. */
const anchors: readonly { id: SceneId; at: number }[] = sceneWindows.map((w) => ({
  id: w.id,
  at: (w.start + w.end) / 2,
}));

const scratchA = new Color();
const scratchB = new Color();

function blendLight(out: ResolvedLight, a: LightRecipe, b: LightRecipe, t: number): void {
  scratchA.setHex(a.color);
  scratchB.setHex(b.color);
  out.color.copy(scratchA).lerp(scratchB, t);
  out.intensity = a.intensity + (b.intensity - a.intensity) * t;
  out.position.set(
    a.position[0] + (b.position[0] - a.position[0]) * t,
    a.position[1] + (b.position[1] - a.position[1]) * t,
    a.position[2] + (b.position[2] - a.position[2]) * t,
  );
}

function blendHex(out: Color, a: number, b: number, t: number): void {
  scratchA.setHex(a);
  scratchB.setHex(b);
  out.copy(scratchA).lerp(scratchB, t);
}

/**
 * Sample the continuous lighting curve at a scroll position.
 * Finds the two nearest chapter anchors and eases between their recipes.
 */
export function sampleEnvironment(progress: number, out: ResolvedEnvironment): ResolvedEnvironment {
  let lower = anchors[0]!;
  let upper = anchors[anchors.length - 1]!;

  for (let i = 0; i < anchors.length - 1; i += 1) {
    const a = anchors[i]!;
    const b = anchors[i + 1]!;
    if (progress >= a.at && progress <= b.at) {
      lower = a;
      upper = b;
      break;
    }
    if (progress < anchors[0]!.at) {
      lower = anchors[0]!;
      upper = anchors[0]!;
      break;
    }
    if (progress > anchors[anchors.length - 1]!.at) {
      lower = anchors[anchors.length - 1]!;
      upper = anchors[anchors.length - 1]!;
      break;
    }
  }

  const span = upper.at - lower.at;
  const t = span <= 0 ? 0 : smoothstep(0, 1, (progress - lower.at) / span);

  const a: EnvironmentRecipe = environments[lower.id];
  const b: EnvironmentRecipe = environments[upper.id];

  blendHex(out.fog, a.fog, b.fog, t);
  blendHex(out.background, a.background, b.background, t);
  blendHex(out.ambientColor, a.ambient.color, b.ambient.color, t);
  out.fogDensity = a.fogDensity + (b.fogDensity - a.fogDensity) * t;
  out.ambientIntensity = a.ambient.intensity + (b.ambient.intensity - a.ambient.intensity) * t;
  out.exposure = a.exposure + (b.exposure - a.exposure) * t;

  blendLight(out.key, a.key, b.key, t);
  blendLight(out.fill, a.fill, b.fill, t);
  blendLight(out.rim, a.rim, b.rim, t);

  return out;
}
