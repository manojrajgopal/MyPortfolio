export interface SkillNode {
  readonly id: string;
  readonly name: string;
  /** Very short disclosure shown when a node is focused. */
  readonly note: string;
}

export interface SkillGroup {
  readonly id: string;
  readonly index: string;
  readonly name: string;
  /** Orbit radius multiplier for the constellation. */
  readonly orbit: number;
  /** Orbital inclination in radians. */
  readonly inclination: number;
  readonly accent: 'copper' | 'emerald' | 'champagne' | 'silver';
  readonly nodes: readonly SkillNode[];
}
