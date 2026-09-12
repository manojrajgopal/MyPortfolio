export type SceneId =
  | 'intro'
  | 'identity'
  | 'engineering'
  | 'experience'
  | 'projects'
  | 'ai'
  | 'skills'
  | 'education'
  | 'certifications'
  | 'achievement'
  | 'languages'
  | 'final';

/** A chapter of the cinematic journey. */
export interface SceneDefinition {
  readonly id: SceneId;
  readonly index: string;
  readonly label: string;
  /** Sub-label shown by the scene indicator. */
  readonly caption: string;
  /** Relative scroll weight. Normalised into a [start, end] window. */
  readonly weight: number;
  /** Whether the scene appears in the chapter navigator. */
  readonly navigable: boolean;
}

export interface SceneWindow {
  readonly id: SceneId;
  readonly start: number;
  readonly end: number;
}

/** Per-frame state handed to every scene. */
export interface SceneFrameState {
  /** Global scroll progress, 0–1, smoothed. */
  readonly progress: number;
  /** Local progress inside the scene window, 0–1. */
  readonly local: number;
  /** 0 → 1 → 0 envelope controlling presence and fade. */
  readonly presence: number;
  /** Scroll velocity, signed, roughly -1..1. */
  readonly velocity: number;
}
