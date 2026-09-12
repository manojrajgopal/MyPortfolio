export type WorkMode = 'Remote' | 'Onsite' | 'Hybrid';

export interface ExperienceEntry {
  readonly id: string;
  readonly index: string;
  readonly role: string;
  readonly company: string;
  readonly location: string;
  readonly mode: WorkMode;
  readonly period: string;
  readonly start: string;
  readonly end: string | 'Present';
  /** Short, scannable technology tokens shown before any prose. */
  readonly stack: readonly string[];
  /** Full responsibilities, revealed through interaction. */
  readonly responsibilities: readonly string[];
}
