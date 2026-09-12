import type { SkillGroup } from '@/types/skill';

/**
 * Skill groups form concentric orbital shells in the constellation.
 * `orbit` and `inclination` drive 3D placement; `accent` drives lighting tone.
 */
export const skillGroups: readonly SkillGroup[] = [
  {
    id: 'programming',
    index: '01',
    name: 'Programming',
    orbit: 1,
    inclination: 0.06,
    accent: 'copper',
    nodes: [
      { id: 'python', name: 'Python', note: 'Primary language' },
      { id: 'csharp', name: 'C#', note: 'Dot NET services' },
      { id: 'bash', name: 'Bash', note: 'Automation scripting' },
    ],
  },
  {
    id: 'ai-ml',
    index: '02',
    name: 'AI / ML',
    orbit: 1.42,
    inclination: -0.34,
    accent: 'emerald',
    nodes: [
      { id: 'tensorflow', name: 'TensorFlow', note: 'Model training' },
      { id: 'nlp', name: 'NLP', note: 'Language understanding' },
      { id: 'opencv', name: 'OpenCV', note: 'Computer vision' },
      { id: 'agentic-ai', name: 'Agentic AI', note: 'Currently exploring' },
    ],
  },
  {
    id: 'web',
    index: '03',
    name: 'Web',
    orbit: 1.86,
    inclination: 0.28,
    accent: 'champagne',
    nodes: [
      { id: 'flask', name: 'Flask', note: 'Lightweight services' },
      { id: 'django', name: 'Django', note: 'Batteries-included web' },
      { id: 'fastapi', name: 'FastAPI', note: 'Typed async APIs' },
      { id: 'react', name: 'React.js', note: 'Interface layer' },
      { id: 'rest', name: 'REST APIs', note: 'Service contracts' },
    ],
  },
  {
    id: 'databases',
    index: '04',
    name: 'Databases',
    orbit: 2.24,
    inclination: -0.16,
    accent: 'silver',
    nodes: [
      { id: 'mysql', name: 'MySQL', note: 'Relational storage' },
      { id: 'mongodb', name: 'MongoDB', note: 'Document storage' },
    ],
  },
  {
    id: 'tools',
    index: '05',
    name: 'Tools',
    orbit: 2.62,
    inclination: 0.42,
    accent: 'copper',
    nodes: [
      { id: 'git', name: 'Git', note: 'Version control' },
      { id: 'github', name: 'GitHub', note: 'Collaboration' },
      { id: 'vscode', name: 'VS Code', note: 'Daily environment' },
      { id: 'docker', name: 'Docker', note: 'Containerisation' },
      { id: 'postman', name: 'Postman', note: 'API verification' },
    ],
  },
  {
    id: 'cloud',
    index: '06',
    name: 'Cloud / DevOps',
    orbit: 3.02,
    inclination: -0.48,
    accent: 'emerald',
    nodes: [
      { id: 'aws', name: 'AWS', note: 'Cloud platform' },
      { id: 'linux', name: 'Linux', note: 'Runtime environment' },
      { id: 'cicd', name: 'CI/CD', note: 'Delivery pipelines' },
    ],
  },
  {
    id: 'core',
    index: '07',
    name: 'Core Concepts',
    orbit: 3.4,
    inclination: 0.2,
    accent: 'champagne',
    nodes: [
      { id: 'oop', name: 'OOP', note: 'Design foundation' },
      { id: 'problem-solving', name: 'Problem-solving', note: 'The actual job' },
      { id: 'agile', name: 'Agile', note: 'Delivery rhythm' },
      { id: 'automation', name: 'Automation', note: 'Remove the repetition' },
    ],
  },
] as const;

export const totalSkillCount = skillGroups.reduce((sum, group) => sum + group.nodes.length, 0);
