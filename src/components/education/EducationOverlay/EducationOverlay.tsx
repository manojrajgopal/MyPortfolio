'use client';

import { education } from '@/data/education/education';
import { SectionLabel } from '@/components/ui/SectionLabel/SectionLabel';
import { KineticText } from '@/components/motion/KineticText';

/**
 * Chapter 08 overlay.
 *
 * Three entries, each one line of qualification and one of institution.
 * The structures behind carry the sense of scale.
 */
export function EducationOverlay(): React.JSX.Element {
  return (
    <div className="frame frame--offset reveal">
      <div className="education">
        <SectionLabel index="08">Education</SectionLabel>

        {education.map((entry, index) => (
          <article
            key={entry.id}
            className="degree degree--arrive"
            style={{ ['--at' as string]: 0.1 + index * 0.16 }}
          >
            <p className="degree__abbr">
              <KineticText by="char" variant="rise" from={0.1 + index * 0.16} span={0.2} stagger={0.04}>
                {entry.abbreviation}
              </KineticText>
            </p>
            <div className="stack stack--tight">
              <h3 className="type-heading ivory">
                <KineticText
                  variant="blur"
                  from={0.14 + index * 0.16}
                  span={0.2}
                  stagger={0.03}
                >
                  {entry.qualification}
                </KineticText>
              </h3>
              <p className="type-meta champagne">{entry.institution}</p>
              <p className="type-meta">
                {entry.period} — {entry.location}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
