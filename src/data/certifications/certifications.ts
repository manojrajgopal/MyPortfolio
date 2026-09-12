import type { CertificationEntry } from '@/types/certification';

export const certifications: readonly CertificationEntry[] = [
  {
    id: 'google-it-automation',
    index: '01',
    name: 'Google IT Automation with Python',
    organization: 'Google',
    date: '06/2024',
    focus: 'Python, Git, IT automation, debugging, cloud configuration.',
    tokens: ['PYTHON', 'GIT', 'AUTOMATION'],
  },
  {
    id: 'career-essentials-software',
    index: '02',
    name: 'Career Essentials in Software Development',
    organization: 'Microsoft & LinkedIn',
    date: '08/2025',
    focus:
      'Software development fundamentals, programming concepts, version control, industry tools.',
    tokens: ['FUNDAMENTALS', 'VERSION CONTROL'],
  },
  {
    id: 'ibm-ai-developer',
    index: '03',
    name: 'IBM AI Developer',
    organization: 'IBM',
    date: '03/2024',
    focus: 'AI development, Python, Flask, HTML, CSS, JavaScript, chatbots, AI models and tools.',
    tokens: ['AI', 'PYTHON', 'FLASK'],
  },
  {
    id: 'ibm-react',
    index: '04',
    name: 'Developing Front-End Apps with React',
    organization: 'IBM',
    date: '01/2024',
    focus: 'React.js, interactive UI components, frontend best practices.',
    tokens: ['REACT', 'UI'],
  },
  {
    id: 'animation-js-jquery',
    index: '05',
    name: 'Animation with JavaScript and jQuery',
    organization: 'Certification',
    date: '07/2024',
    focus: 'Interactive web animations and dynamic UI effects.',
    tokens: ['ANIMATION', 'JAVASCRIPT'],
  },
  {
    id: 'canva-responsive',
    index: '06',
    name: 'Use Canva to Create Desktop and Mobile-friendly Web Pages',
    organization: 'Certification',
    date: '04/2024',
    focus: 'Responsive desktop/mobile web pages and UI/UX skills.',
    tokens: ['RESPONSIVE', 'UI/UX'],
  },
] as const;
