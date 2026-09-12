export interface EducationEntry {
  readonly id: string;
  readonly index: string;
  readonly qualification: string;
  readonly abbreviation: string;
  readonly institution: string;
  readonly location: string;
  readonly period: string;
  readonly startYear: string;
  readonly endYear: string;
  /** Relative height of the architectural monolith, 0–1. */
  readonly elevation: number;
}
