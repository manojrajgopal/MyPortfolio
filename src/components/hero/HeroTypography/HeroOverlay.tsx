'use client';

import { personal } from '@/data/profile/personal';
import { KineticText } from '@/components/motion/KineticText';
import { SplitText } from '@/components/motion/SplitText';

/**
 * Chapter 01 overlay.
 *
 * Four lines, nothing more: a name, a claim, a role, a set of disciplines.
 * Everything else about this person is earned further down.
 *
 * The name is the one piece of type on the site that plays on load rather
 * than on scroll — it is the title card, and it has to perform before the
 * visitor has done anything. Everything beneath it is scroll-scrubbed.
 */
export function HeroOverlay(): React.JSX.Element {
  return (
    <>
      <div className="hero reveal reveal--rise">
        <p className="type-meta type-meta--wide lane-far">
          <KineticText by="char" variant="stretch" onLoad delay={80}>
            {`${personal.location} — Portfolio`}
          </KineticText>
        </p>

        <h1 className="hero__name type-colossal">
          <SplitText by="char" stagger={44} delay={180}>
            {personal.name}
          </SplitText>
        </h1>

        <p className="hero__statement type-lede lane-mid">
          <KineticText variant="blur" onLoad delay={980} lean>
            {personal.statement}
          </KineticText>
        </p>

        <div className="hero__meta lane-near">
          <span className="type-meta type-meta--wide champagne">
            <KineticText by="char" variant="wipe" onLoad delay={1320}>
              Software Engineer
            </KineticText>
          </span>
          <span className="type-meta">
            <KineticText by="char" variant="wipe" onLoad delay={1480}>
              {personal.disciplines.join(' • ')}
            </KineticText>
          </span>
        </div>
      </div>

      {/* Anchored to the stage rather than the headline: the blur filter on
          .reveal would otherwise become this element's containing block. */}
      <div className="hero__scroll" aria-hidden="true">
        <span className="hero__scrollTrack" />
        <span className="type-meta">Scroll to begin</span>
      </div>
    </>
  );
}
