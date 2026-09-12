import type { AchievementEntry } from '@/types/certification';

export const achievements: readonly AchievementEntry[] = [
  {
    id: 'hackerrank-swe-intern',
    name: 'Software Engineer Intern Certification',
    issuer: 'HackerRank',
    headline: ['HACKERRANK', 'SOFTWARE ENGINEER INTERN', 'CERTIFIED'],
    description: 'Passed role certification test, validating software engineering skills.',
  },
] as const;

/** The single achievement that earns its own cinematic beat. */
export const primaryAchievement: AchievementEntry = achievements[0]!;
