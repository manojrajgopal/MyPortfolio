import type { LanguageProficiency } from '@/types/profile';

/** `level` drives arc length only — it is a visual weight, not a claim. */
export const languages: readonly LanguageProficiency[] = [
  { id: 'kannada', language: 'Kannada', proficiency: 'Native or Bilingual', level: 1 },
  { id: 'english', language: 'English', proficiency: 'Full Professional', level: 0.86 },
  { id: 'hindi', language: 'Hindi', proficiency: 'Elementary', level: 0.4 },
  { id: 'telugu', language: 'Telugu', proficiency: 'Elementary', level: 0.4 },
] as const;
