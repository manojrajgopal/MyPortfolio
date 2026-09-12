'use client';

import { projects } from '@/data/projects/projects';
import { SectionLabel } from '@/components/ui/SectionLabel/SectionLabel';
import { ProjectPanel } from './ProjectPanel/ProjectPanel';

/**
 * Chapter 05 overlay.
 *
 * A fixed chapter marker, and four panels that hand off to each other as the
 * camera reaches each station.
 */
export function ProjectOverlay(): React.JSX.Element {
  return (
    <div className="projects">
      <SectionLabel index="05" className="projects__label">
        Project Universe
      </SectionLabel>

      {projects.map((project) => (
        <ProjectPanel key={project.id} project={project} />
      ))}
    </div>
  );
}
