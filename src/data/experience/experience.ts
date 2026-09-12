import type { ExperienceEntry } from '@/types/experience';

export const experiences: readonly ExperienceEntry[] = [
  {
    id: 'spektra-asde',
    index: '01',
    role: 'Associate Software Development Engineer',
    company: 'Spektra Systems',
    location: 'Remote',
    mode: 'Remote',
    period: 'May 2026 — Present',
    start: 'May 2026',
    end: 'Present',
    stack: ['REACT', 'NODE.JS', 'PYTHON', 'REST APIs'],
    responsibilities: [
      'Built front-end and back-end features using React, Node.js, and Python.',
      'Developed REST APIs and improved overall application performance.',
      'Worked with the team to deliver clean, stable, and scalable modules.',
    ],
  },
  {
    id: 'spektra-intern',
    index: '02',
    role: 'Development Engineer Intern',
    company: 'Spektra Systems',
    location: 'Bangalore, India',
    mode: 'Onsite',
    period: 'Feb 2026 — Apr 2026',
    start: 'Feb 2026',
    end: 'Apr 2026',
    stack: ['C# .NET CORE', 'ANGULAR', 'API', 'IWXCLOUDZEN'],
    responsibilities: [
      'Developed APIs using C# .NET Core.',
      'Built Angular frontend and integrated backend.',
      'Worked on IWXCloudZen multi-account platform system.',
    ],
  },
] as const;
