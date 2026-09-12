'use client';

import type { ProjectEntry, ProjectMetric } from '@/types/project';
import { projectWindow } from '@/data/projects/projects';
import { useSceneBand } from '@/hooks/useSceneProgress';
import { TokenList } from '@/components/ui/TokenList/TokenList';
import { KineticText } from '@/components/motion/KineticText';
import { CountUp } from '@/components/motion/CountUp';
import { SceneBandProvider } from '@/components/experience/SceneContext';

interface ProjectPanelProps {
  readonly project: ProjectEntry;
}

/**
 * The type for one project, bound to exactly the stretch of scroll where its
 * set is on screen.
 *
 * Four panels share the same grid cell; only the one whose station the camera
 * has reached is resolved. Nothing here is a card — it is a title sequence.
 *
 * Only a metric that is genuinely proportional gets the cinematic treatment:
 * the 85% accuracy figure is a number worth reading across the room, while
 * "Segment → Inpaint → Render" is a sentence and is set like one.
 */
export function ProjectPanel({ project }: ProjectPanelProps): React.JSX.Element {
  const { from, to } = projectWindow(project.id);
  const ref = useSceneBand('projects', project.id, from, to, 0.24);

  const featured: ProjectMetric | undefined = project.metrics.find(
    (metric) => metric.ratio !== undefined,
  );
  const supporting = project.metrics.filter((metric) => metric !== featured);

  return (
    <article ref={ref} className="project">
      <SceneBandProvider from={from} to={to}>
      <div className="stack">
        <p className="type-meta tabular">{project.period}</p>

        <p className="project__index" aria-hidden="true">
          {project.index}
        </p>

        <div className="project__title">
          <h3 className="type-display">
            <KineticText by="char" variant="rise" from={0.16} span={0.3} stagger={0.022} lean>
              {project.title}
            </KineticText>
          </h3>
          <p className="type-meta type-meta--wide champagne">
            <KineticText by="char" variant="wipe" from={0.3} span={0.24} stagger={0.01} sharp={10}>
              {project.subtitle}
            </KineticText>
          </p>
        </div>

        <p className="motif" aria-hidden="true">
          {project.motif.map((word, index) => (
            <span key={word} className="motif__word" style={{ ['--at' as string]: 0.4 + index * 0.1 }}>
              {word}
            </span>
          ))}
        </p>
      </div>

      <div className="project__aside">
        {featured ? (
          <p className="metric">
            <span className="metric__value tabular">
              <CountUp
                value={Math.round((featured.ratio ?? 0) * 100)}
                suffix="%"
                from={0.22}
                span={0.42}
              />
            </span>
            <span className="type-meta">{featured.label}</span>
          </p>
        ) : null}

        <p className="project__description type-body text-sweep" style={{ ['--from' as string]: 0.3 }}>
          {project.description}
        </p>

        <dl className="project__facts">
          {supporting.map((metric) => (
            <div key={metric.label} className="project__fact">
              <dt className="type-meta">{metric.label}</dt>
              <dd className="type-token champagne">{metric.value}</dd>
            </div>
          ))}
        </dl>

        <TokenList items={project.technologies} upper={false} />
      </div>
      </SceneBandProvider>
    </article>
  );
}
