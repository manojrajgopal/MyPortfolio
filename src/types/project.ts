/** Identifies which bespoke 3D environment renders for a project. */
export type ProjectSceneKey = 'interior' | 'stylist' | 'voice' | 'infinitewavex';

export interface ProjectMetric {
  readonly label: string;
  readonly value: string;
  /** 0–1 for gauge visualisation. Omitted when the metric is not proportional. */
  readonly ratio?: number;
}

export interface ProjectEntry {
  readonly id: string;
  readonly index: string;
  readonly title: string;
  readonly subtitle: string;
  readonly period: string;
  readonly year: string;
  readonly scene: ProjectSceneKey;
  /** One to two sentences. Nothing longer reaches the screen. */
  readonly description: string;
  readonly technologies: readonly string[];
  readonly metrics: readonly ProjectMetric[];
  /** Three words that describe the visual idea of the scene. */
  readonly motif: readonly [string, string, string];
  /** External link. `null` when none exists — never invented. */
  readonly href: string | null;
}
