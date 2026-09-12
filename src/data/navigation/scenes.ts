import type { SceneDefinition, SceneId, SceneWindow } from '@/types/scene';

/**
 * The single source of truth for the journey.
 * `weight` is a relative scroll length — it drives both the height of the DOM
 * scroll track and the camera keyframe windows, so the two can never drift.
 */
export const scenes: readonly SceneDefinition[] = [
  { id: 'intro', index: '01', label: 'Intro', caption: 'Arrival', weight: 10, navigable: true },
  {
    id: 'identity',
    index: '02',
    label: 'Identity',
    caption: 'Same curiosity',
    weight: 9,
    navigable: false,
  },
  {
    id: 'engineering',
    index: '03',
    label: 'Engineering',
    caption: 'Ideas become structure',
    weight: 9.5,
    navigable: false,
  },
  {
    id: 'experience',
    index: '04',
    label: 'Experience',
    caption: 'The path so far',
    weight: 13,
    navigable: true,
  },
  {
    id: 'projects',
    index: '05',
    label: 'Projects',
    caption: 'Project universe',
    weight: 27,
    navigable: true,
  },
  { id: 'ai', index: '06', label: 'AI', caption: 'Signal and inference', weight: 9, navigable: false },
  {
    id: 'skills',
    index: '07',
    label: 'Skills',
    caption: 'Technology constellation',
    weight: 12,
    navigable: true,
  },
  {
    id: 'education',
    index: '08',
    label: 'Education',
    caption: 'Foundations',
    weight: 10,
    navigable: true,
  },
  {
    id: 'certifications',
    index: '09',
    label: 'Certifications',
    caption: 'The vault',
    weight: 11,
    navigable: true,
  },
  {
    id: 'achievement',
    index: '10',
    label: 'Achievement',
    caption: 'Verified',
    weight: 9,
    navigable: false,
  },
  {
    id: 'languages',
    index: '11',
    label: 'Languages',
    caption: 'How I communicate',
    weight: 9,
    navigable: false,
  },
  {
    id: 'final',
    index: '12',
    label: 'Horizon',
    caption: 'Bigger horizons',
    weight: 9,
    navigable: true,
  },
] as const;

const totalWeight = scenes.reduce((sum, scene) => sum + scene.weight, 0);

/** Normalised [start, end] scroll windows, derived once at module load. */
export const sceneWindows: readonly SceneWindow[] = (() => {
  let cursor = 0;
  return scenes.map((scene) => {
    const start = cursor / totalWeight;
    cursor += scene.weight;
    return { id: scene.id, start, end: cursor / totalWeight };
  });
})();

const windowById = new Map<SceneId, SceneWindow>(sceneWindows.map((w) => [w.id, w]));

export function getSceneWindow(id: SceneId): SceneWindow {
  const window = windowById.get(id);
  if (!window) throw new Error(`Unknown scene: ${id}`);
  return window;
}

/** Scroll progress at which a scene is best framed — used by chapter jumps. */
export function getSceneAnchor(id: SceneId): number {
  const { start, end } = getSceneWindow(id);
  return start + (end - start) * 0.42;
}

/**
 * Total height of the scroll track, in viewport heights.
 *
 * Every chapter pins a full-height stage, so each one has to be at least a
 * viewport tall or its sticky frame cannot pin and the chapter is skipped
 * over. That sets a floor on the weights: `minWeight / totalWeight *
 * SCROLL_TRACK_VH` must stay comfortably above 100.
 */
export const SCROLL_TRACK_VH = 1720;

/** Height of one chapter in viewport heights. */
export function sceneHeightVh(weight: number): number {
  return (weight / totalWeight) * SCROLL_TRACK_VH;
}

if (process.env.NODE_ENV !== 'production') {
  const tooShort = scenes.filter((scene) => sceneHeightVh(scene.weight) < 105);
  if (tooShort.length > 0) {
    console.warn(
      `[scenes] These chapters are shorter than a viewport and will not pin: ${tooShort
        .map((scene) => scene.id)
        .join(', ')}`,
    );
  }
}
