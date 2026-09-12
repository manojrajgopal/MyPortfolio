import type { ProjectEntry } from '@/types/project';

export const projects: readonly ProjectEntry[] = [
  {
    id: 'interior-ai',
    index: '01',
    title: 'Interior Design',
    subtitle: 'AI-powered Inpainting & Visualization',
    period: '06/2025 — 10/2025',
    year: '2025',
    scene: 'interior',
    description:
      'An AI interior design tool built on Stable Diffusion and inpainting models for seamless object removal, replacement, and visualization — with segmentation, custom prompts, and a React interface for upload, transformation, and download.',
    technologies: [
      'Stable Diffusion',
      'Inpainting',
      'Segmentation',
      'Custom Prompts',
      'React',
      'AI Image Transformation',
    ],
    metrics: [
      { label: 'Pipeline', value: 'Segment → Inpaint → Render' },
      { label: 'Interface', value: 'React' },
    ],
    motif: ['REMOVE', 'REPLACE', 'REIMAGINE'],
    href: null,
  },
  {
    id: 'personal-stylist',
    index: '02',
    title: 'AI Personal Stylist',
    subtitle: 'Outfit Recommender',
    period: '11/2024 — 03/2025',
    year: '2025',
    scene: 'stylist',
    description:
      'A fashion recommendation system reaching 85% accuracy using CNNs with TensorFlow, LLMs for NLP, and PyTorch — with OpenCV for virtual try-on and Keras for deep learning, deployed as a Flask web app.',
    technologies: ['CNN', 'TensorFlow', 'LLM', 'NLP', 'PyTorch', 'OpenCV', 'Keras', 'Flask'],
    metrics: [
      { label: 'Recommendation accuracy', value: '85%', ratio: 0.85 },
      { label: 'Try-on', value: 'OpenCV' },
    ],
    motif: ['PROFILE', 'PREDICT', 'STYLE'],
    href: null,
  },
  {
    id: 'voice-assistant',
    index: '03',
    title: 'Voice Assistant',
    subtitle: 'AI-powered Virtual Assistant',
    period: '05/2022 — 08/2022',
    year: '2022',
    scene: 'voice',
    description:
      'A voice assistant built with Python, SpeechRecognition, pyttsx3, and NLP that processes spoken commands to deliver real-time responses, fetch information, open applications, and manage reminders.',
    technologies: ['Python', 'SpeechRecognition', 'pyttsx3', 'NLP'],
    metrics: [
      { label: 'Interaction', value: 'Real-time voice' },
      { label: 'Core', value: 'Python + NLP' },
    ],
    motif: ['LISTEN', 'UNDERSTAND', 'RESPOND'],
    href: null,
  },
  {
    id: 'infinitewavex',
    index: '04',
    title: 'InfiniteWaveX',
    subtitle: 'AI-powered Fashion & Styling Platform',
    period: '09/2025 — 12/2025',
    year: '2025',
    scene: 'infinitewavex',
    description:
      'An AI fashion platform delivering outfit recommendations from user profiling, body type, and style preferences — with OOTDiffusion virtual try-on, 3D avatars in Three.js, NLP-driven personal advice, and an interactive dashboard.',
    technologies: [
      'OOTDiffusion',
      'Three.js',
      '3D Avatars',
      'AI',
      'NLP',
      'Personalized Recommendations',
    ],
    metrics: [
      { label: 'Try-on engine', value: 'OOTDiffusion' },
      { label: 'Avatar layer', value: 'Three.js 3D' },
    ],
    motif: ['AVATAR', 'DIFFUSE', 'DRESS'],
    href: null,
  },
] as const;

/**
 * Each project owns a slice of the projects chapter, in that chapter's own
 * 0–1 local progress. The 3D set and the overlay panel read the same window,
 * so the type on screen always matches the world behind it.
 */
export const projectWindows: Record<string, { readonly from: number; readonly to: number }> = {
  'interior-ai': { from: 0.0, to: 0.26 },
  'personal-stylist': { from: 0.26, to: 0.52 },
  'voice-assistant': { from: 0.52, to: 0.76 },
  infinitewavex: { from: 0.76, to: 1.0 },
};

export function projectWindow(id: string): { from: number; to: number } {
  return projectWindows[id] ?? { from: 0, to: 1 };
}
