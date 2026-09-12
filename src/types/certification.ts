export interface CertificationEntry {
  readonly id: string;
  readonly index: string;
  readonly name: string;
  readonly organization: string;
  readonly date: string;
  readonly focus: string;
  /** Short focus tokens for the artifact face. */
  readonly tokens: readonly string[];
}

export interface AchievementEntry {
  readonly id: string;
  readonly name: string;
  readonly issuer: string;
  readonly headline: readonly string[];
  readonly description: string;
}
