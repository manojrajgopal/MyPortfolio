'use client';

import { personal } from '@/data/profile/personal';
import { summary } from '@/data/profile/summary';
import { SectionLabel } from '@/components/ui/SectionLabel/SectionLabel';
import { KineticText } from '@/components/motion/KineticText';
import { ScrambleText } from '@/components/motion/ScrambleText';

/**
 * Chapter 03 overlay.
 *
 * The tagline lands here, over the lattice assembling behind it — and this
 * is the one place the full professional summary is allowed on screen, once
 * the visitor has already seen what the claim looks like in practice.
 *
 * The headline rises word by word as the structure below it locks together,
 * and the summary is revealed by a soft edge travelling down the block rather
 * than by appearing all at once.
 */
export function EngineeringOverlay(): React.JSX.Element {
  return (
    <div className="frame frame--split reveal">
      <div className="stack">
        <SectionLabel index="03">Engineering</SectionLabel>

        <h2 className="statement type-display">
          <KineticText variant="rise" from={0.04} span={0.3} stagger={0.06} lean exit>
            Turning Ideas into
          </KineticText>{' '}
          <em>
            <KineticText variant="rise" from={0.16} span={0.24} stagger={0.06} exit>
              Scalable
            </KineticText>
          </em>{' '}
          <KineticText variant="rise" from={0.22} span={0.24} stagger={0.06} exit>
            Solutions
          </KineticText>
        </h2>

        <p className="type-meta">
          <ScrambleText from={0.3} span={0.24}>
            CODE — SOLVE — LEARN — MAKE AN IMPACT
          </ScrambleText>
        </p>
      </div>

      <div className="stack stack--tight lane-mid">
        <p className="summary type-body text-sweep" style={{ ['--from' as string]: 0.18 }}>
          {summary.full}
        </p>
        <p className="type-meta">
          <KineticText by="char" variant="wipe" from={0.58} span={0.26} stagger={0.008} sharp={10}>
            {personal.title}
          </KineticText>
        </p>
      </div>
    </div>
  );
}
