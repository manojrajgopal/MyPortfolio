'use client';

import { summary } from '@/data/profile/summary';
import { personal } from '@/data/profile/personal';
import { SectionLabel } from '@/components/ui/SectionLabel/SectionLabel';
import { KineticText } from '@/components/motion/KineticText';
import { BeatSequence } from './BeatSequence';

/**
 * Chapter 02 overlay.
 *
 * The five verbs that describe the work, each resolving from outline to
 * solid as the chapter plays, then the two-line thesis of the whole site.
 *
 * The thesis arrives out of depth — the two lines rotate up off the screen
 * plane — because it is the one claim the rest of the film is spent proving.
 */
export function IdentityOverlay(): React.JSX.Element {
  return (
    <div className="frame frame--offset reveal">
      <div className="stack stack--loose">
        <SectionLabel index="02">Identity</SectionLabel>

        <BeatSequence beats={summary.beats} />

        <div className="identity__pair lane-mid">
          <p className="type-title ivory">
            <KineticText variant="depth" from={0.3} span={0.22} stagger={0.05} exit>
              Same Curiosity.
            </KineticText>
          </p>
          <p className="type-title type-serif">
            <KineticText variant="depth" from={0.38} span={0.24} stagger={0.05} exit>
              Bigger Horizons.
            </KineticText>
          </p>
        </div>

        <p className="type-lede lane-near">
          <KineticText variant="blur" from={0.5} span={0.26} stagger={0.035} exit>
            {summary.lead}
          </KineticText>
        </p>

        <p className="type-meta">
          <KineticText by="char" variant="wipe" from={0.58} span={0.2} stagger={0.015} sharp={9}>
            {personal.location}
          </KineticText>
        </p>
      </div>
    </div>
  );
}
