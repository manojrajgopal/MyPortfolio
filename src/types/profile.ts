/** Core identity of the portfolio owner. */
export interface PersonalProfile {
  readonly name: string;
  readonly initials: string;
  readonly title: string;
  /** Short role tokens used as cinematic metadata, e.g. BACKEND • AI/ML. */
  readonly disciplines: readonly string[];
  readonly location: string;
  /** One-line statement used in the hero. Never the full summary. */
  readonly statement: string;
  /** Secondary cinematic line. */
  readonly tagline: string;
}

export interface ProfileSummary {
  /** Progressive disclosure: shown first, minimal. */
  readonly lead: string;
  /** Revealed as the journey unfolds. */
  readonly full: string;
  /** Single-word visual beats used as scene transitions. */
  readonly beats: readonly string[];
}

export type ContactChannelKind = 'email' | 'phone' | 'link';

export interface ContactChannel {
  readonly id: string;
  readonly label: string;
  /** Human readable value shown on screen. */
  readonly value: string;
  /** href target. `null` marks a deliberate, un-invented placeholder. */
  readonly href: string | null;
  readonly kind: ContactChannelKind;
  /** True when no verified URL exists yet — the UI renders it as pending. */
  readonly placeholder?: boolean;
}

export interface LanguageProficiency {
  readonly id: string;
  readonly language: string;
  readonly proficiency: string;
  /** 0–1, used only for visual arc length. Derived from proficiency tier. */
  readonly level: number;
}
