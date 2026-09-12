'use client';

import { experiences } from '@/data/experience/experience';
import { SectionLabel } from '@/components/ui/SectionLabel/SectionLabel';
import { KineticText } from '@/components/motion/KineticText';
import { ExperienceCard } from './ExperienceCard/ExperienceCard';

/**
 * Chapter 04 overlay.
 *
 * The roles, in order, alongside the rail they sit on in the world behind.
 * Each card arrives as the camera reaches its station, so the type and the
 * structures out in the world land together.
 */
export function ExperienceOverlay(): React.JSX.Element {
  return (
    <div className="frame frame--split reveal">
      <div className="stack lane-far">
        <SectionLabel index="04">Experience</SectionLabel>
        <h2 className="type-display">
          <KineticText variant="rise" from={0.04} span={0.26} stagger={0.07} lean exit>
            The path
          </KineticText>
          <br />
          <span className="type-serif">
            <KineticText variant="rise" from={0.12} span={0.26} stagger={0.07} exit>
              so far.
            </KineticText>
          </span>
        </h2>
        <p className="type-body hide-on-phone text-sweep" style={{ ['--from' as string]: 0.2 }}>
          Two roles at the same company, a few months apart — an internship that turned into
          building the product.
        </p>
      </div>

      <div className="timeline lane-mid">
        {experiences.map((entry, index) => (
          <ExperienceCard key={entry.id} entry={entry} order={index} />
        ))}
      </div>
    </div>
  );
}
