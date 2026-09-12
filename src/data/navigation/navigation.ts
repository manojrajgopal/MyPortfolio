import type { SceneId } from '@/types/scene';

export interface ChapterLink {
  readonly index: string;
  readonly label: string;
  readonly scene: SceneId;
}

export interface RouteLink {
  readonly label: string;
  readonly href: string;
  readonly description: string;
}

/** Chapter navigator — reads like a film timeline, not a navbar. */
export const chapters: readonly ChapterLink[] = [
  { index: '01', label: 'Intro', scene: 'intro' },
  { index: '02', label: 'Experience', scene: 'experience' },
  { index: '03', label: 'Projects', scene: 'projects' },
  { index: '04', label: 'Skills', scene: 'skills' },
  { index: '05', label: 'Education', scene: 'education' },
  { index: '06', label: 'Certifications', scene: 'certifications' },
  { index: '07', label: 'Horizon', scene: 'final' },
] as const;

/**
 * Which chapter marker is lit for any chapter of the film.
 *
 * Several chapters are not destinations of their own — Identity and
 * Engineering belong to the opening, the AI chapter belongs to Projects —
 * so they light the nearest preceding entry rather than leaving the
 * navigator blank while they play.
 */
const MARKER: Record<SceneId, SceneId> = {
  intro: 'intro',
  identity: 'intro',
  engineering: 'intro',
  experience: 'experience',
  projects: 'projects',
  ai: 'projects',
  skills: 'skills',
  education: 'education',
  certifications: 'certifications',
  achievement: 'certifications',
  languages: 'final',
  final: 'final',
};

export function markerFor(scene: SceneId): SceneId {
  return MARKER[scene];
}

export const routes: readonly RouteLink[] = [
  { label: 'Contact', href: '/contact', description: 'Start a conversation' },
  { label: 'Resume', href: '/resume', description: 'The full record' },
] as const;
