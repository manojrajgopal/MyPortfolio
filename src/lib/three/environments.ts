import type { SceneId } from '@/types/scene';
import { hex } from './palette';

export interface LightRecipe {
  readonly color: number;
  readonly intensity: number;
  readonly position: readonly [number, number, number];
}

/**
 * One lighting + atmosphere recipe per chapter.
 * The director interpolates between the recipes of adjacent chapters,
 * so the world changes light as the camera travels rather than cutting.
 */
export interface EnvironmentRecipe {
  readonly fog: number;
  readonly fogDensity: number;
  readonly background: number;
  readonly ambient: { readonly color: number; readonly intensity: number };
  readonly key: LightRecipe;
  readonly fill: LightRecipe;
  readonly rim: LightRecipe;
  readonly exposure: number;
}

export const environments: Record<SceneId, EnvironmentRecipe> = {
  /** Arrival: almost nothing. One distant warm source. */
  intro: {
    fog: hex.void,
    fogDensity: 0.021,
    background: hex.void,
    ambient: { color: hex.stone, intensity: 0.22 },
    key: { color: hex.ember, intensity: 1.5, position: [-14, 5, -20] },
    fill: { color: hex.bronze, intensity: 0.3, position: [10, -4, 6] },
    rim: { color: hex.parchment, intensity: 0.5, position: [4, 12, 14] },
    exposure: 0.86,
  },

  /** Identity: the horizon opens, light warms. */
  identity: {
    fog: hex.obsidian,
    fogDensity: 0.018,
    background: hex.obsidian,
    ambient: { color: hex.bronze, intensity: 0.34 },
    key: { color: hex.ember, intensity: 2.1, position: [-18, 3, -14] },
    fill: { color: hex.copperDeep, intensity: 0.46, position: [12, 2, 8] },
    rim: { color: hex.champagne, intensity: 0.7, position: [0, 14, 16] },
    exposure: 0.96,
  },

  /** Engineering: cooler, harder, architectural. */
  engineering: {
    fog: hex.graphite,
    fogDensity: 0.02,
    background: hex.graphite,
    ambient: { color: hex.stone, intensity: 0.4 },
    key: { color: hex.parchment, intensity: 1.6, position: [8, 16, 10] },
    fill: { color: hex.copper, intensity: 0.72, position: [-14, -2, -6] },
    rim: { color: hex.silver, intensity: 0.9, position: [-6, 6, -18] },
    exposure: 0.92,
  },

  /** Experience: industrial corridor, bronze key. */
  experience: {
    fog: hex.ash,
    fogDensity: 0.021,
    background: hex.obsidian,
    ambient: { color: hex.stone, intensity: 0.36 },
    key: { color: hex.copperLift, intensity: 1.9, position: [10, 9, 6] },
    fill: { color: hex.bronze, intensity: 0.55, position: [-12, 1, -10] },
    rim: { color: hex.parchment, intensity: 0.66, position: [0, -8, -14] },
    exposure: 0.94,
  },

  /** Projects: a laboratory. Neutral so each project can tint itself. */
  projects: {
    fog: hex.graphite,
    fogDensity: 0.024,
    background: hex.obsidian,
    ambient: { color: hex.stone, intensity: 0.44 },
    key: { color: hex.ivory, intensity: 1.5, position: [6, 12, 12] },
    fill: { color: hex.copper, intensity: 0.62, position: [-14, 2, -4] },
    rim: { color: hex.emerald, intensity: 0.5, position: [2, -10, -16] },
    exposure: 0.98,
  },

  /** AI: the only chapter where emerald leads. */
  ai: {
    fog: hex.forest,
    fogDensity: 0.026,
    background: hex.void,
    ambient: { color: hex.forest, intensity: 0.5 },
    key: { color: hex.emeraldLift, intensity: 1.8, position: [-8, 6, 10] },
    fill: { color: hex.emerald, intensity: 0.8, position: [12, -4, -8] },
    rim: { color: hex.champagne, intensity: 0.42, position: [0, 14, -12] },
    exposure: 0.9,
  },

  /** Skills: open space, low fog, starlight. */
  skills: {
    fog: hex.void,
    fogDensity: 0.02,
    background: hex.void,
    ambient: { color: hex.stone, intensity: 0.3 },
    key: { color: hex.champagne, intensity: 1.4, position: [0, 4, 18] },
    fill: { color: hex.copper, intensity: 0.5, position: [-16, -6, -10] },
    rim: { color: hex.emeraldLift, intensity: 0.44, position: [14, 10, -14] },
    exposure: 1,
  },

  /** Education: hard architectural daylight through structures. */
  education: {
    fog: hex.ash,
    fogDensity: 0.02,
    background: hex.obsidian,
    ambient: { color: hex.stone, intensity: 0.34 },
    key: { color: hex.parchment, intensity: 1.7, position: [-4, 22, -2] },
    fill: { color: hex.bronze, intensity: 0.44, position: [14, 2, 10] },
    rim: { color: hex.copperLift, intensity: 0.6, position: [-16, 4, -16] },
    exposure: 0.93,
  },

  /** Certifications: a vault. One focused source, deep falloff. */
  certifications: {
    fog: hex.void,
    fogDensity: 0.03,
    background: hex.void,
    ambient: { color: hex.graphite, intensity: 0.2 },
    key: { color: hex.champagne, intensity: 2.6, position: [0, 10, 8] },
    fill: { color: hex.copperDeep, intensity: 0.5, position: [-10, -4, -6] },
    rim: { color: hex.bronze, intensity: 0.5, position: [10, 2, -12] },
    exposure: 0.88,
  },

  /** Achievement: a single object, a single light. */
  achievement: {
    fog: hex.void,
    fogDensity: 0.034,
    background: hex.void,
    ambient: { color: hex.graphite, intensity: 0.16 },
    key: { color: hex.emeraldLift, intensity: 2.4, position: [2, 5, 10] },
    fill: { color: hex.copper, intensity: 0.7, position: [-8, -2, 4] },
    rim: { color: hex.ivory, intensity: 0.9, position: [0, 8, -10] },
    exposure: 0.9,
  },

  /** Languages: quiet, even, almost neutral. */
  languages: {
    fog: hex.obsidian,
    fogDensity: 0.024,
    background: hex.obsidian,
    ambient: { color: hex.stone, intensity: 0.42 },
    key: { color: hex.parchment, intensity: 1.3, position: [6, 6, 12] },
    fill: { color: hex.bronze, intensity: 0.42, position: [-10, 0, -6] },
    rim: { color: hex.champagne, intensity: 0.5, position: [0, 10, -14] },
    exposure: 0.95,
  },

  /** Horizon: the last frame. Sunrise, simplified, open. */
  final: {
    fog: hex.copperDeep,
    fogDensity: 0.013,
    background: hex.obsidian,
    // Low ambient on purpose: the light is behind the range, so the ranges
    // themselves read as silhouettes and the closing titles stay legible
    // against them.
    ambient: { color: hex.bronze, intensity: 0.26 },
    key: { color: hex.ember, intensity: 2.4, position: [0, 1.2, -26] },
    fill: { color: hex.champagne, intensity: 0.35, position: [10, 6, 6] },
    rim: { color: hex.copperLift, intensity: 0.7, position: [-12, 3, -8] },
    exposure: 0.98,
  },
};

/* ============================================================
   Light theme

   The recipes above are authored for the dark world. Rather than
   maintain a second set of twelve — which would drift out of sync
   the first time a chapter is retuned — the light world is derived
   from them.

   The transform is not an inversion. Fog and background become paper,
   ambient rises sharply so nothing falls into silhouette, key lights
   cool toward daylight, and exposure comes down because a bright
   ground plus a bright key clips immediately. The objects themselves
   stay dark: a dark sculpture on a pale ground is the whole idea.
   ============================================================ */

/** Paper tones the light world sits in, per chapter mood. */
const LIGHT_GROUND: Partial<Record<SceneId, number>> = {
  ai: 0xe4ece6,
  certifications: 0xece6da,
  achievement: 0xe6ece8,
  final: 0xf0e3d2,
};

const LIGHT_DEFAULT_GROUND = 0xeee9e0;

/** Warmed toward daylight; the copper accents carry the colour instead. */
const LIGHT_KEY = 0xfff4e2;
const LIGHT_FILL = 0xd8cdbb;

export function toLightRecipe(recipe: EnvironmentRecipe, scene: SceneId): EnvironmentRecipe {
  const ground = LIGHT_GROUND[scene] ?? LIGHT_DEFAULT_GROUND;

  return {
    ...recipe,
    fog: ground,
    // Thinner atmosphere: heavy fog over a pale ground turns the whole
    // frame into a flat wash with nothing to read.
    fogDensity: recipe.fogDensity * 0.62,
    background: ground,
    ambient: { color: 0xffffff, intensity: 0.85 + recipe.ambient.intensity * 0.5 },
    key: { ...recipe.key, color: LIGHT_KEY, intensity: recipe.key.intensity * 0.72 },
    fill: { ...recipe.fill, color: LIGHT_FILL, intensity: recipe.fill.intensity * 0.8 },
    rim: { ...recipe.rim, intensity: recipe.rim.intensity * 0.55 },
    // A bright ground clips fast; pull the stop down to hold the highlights.
    exposure: recipe.exposure * 0.78,
  };
}

/** The light world, derived once at module load. */
export const lightEnvironments: Record<SceneId, EnvironmentRecipe> = Object.fromEntries(
  (Object.keys(environments) as SceneId[]).map((scene) => [
    scene,
    toLightRecipe(environments[scene], scene),
  ]),
) as Record<SceneId, EnvironmentRecipe>;
