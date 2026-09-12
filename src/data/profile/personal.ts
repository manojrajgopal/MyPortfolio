import type { PersonalProfile } from '@/types/profile';

export const personal: PersonalProfile = {
  name: 'Manoj R',
  initials: 'MR',
  title: 'Software Engineer | Backend Developer (Python) | AI/ML Enthusiast | Quick Learner',
  disciplines: ['BACKEND', 'AI/ML', 'FULL STACK'],
  location: 'Bangalore, India',
  statement: 'Engineering ideas into scalable reality.',
  tagline: 'Turning Ideas into Scalable Solutions',
} as const;
