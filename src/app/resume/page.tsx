import type { Metadata } from 'next';
import { ResumeView } from '@/components/resume/ResumeView';

export const metadata: Metadata = {
  title: 'Resume',
  description:
    'The full professional record of Manoj R — experience, projects, skills, education, certifications and languages.',
};

export default function ResumePage(): React.JSX.Element {
  return <ResumeView />;
}
