'use client';

import { personal } from '@/data/profile/personal';
import { CinematicButton } from '@/components/ui/Button/CinematicButton';
import { KineticText } from '@/components/motion/KineticText';

/**
 * Chapter 12 overlay.
 *
 * The closing title card. Two lines, a name, a role, an invitation, and the
 * only two links the site asks anyone to follow.
 */
export function FinalOverlay(): React.JSX.Element {
  return (
    <div className="frame frame--center reveal">
      <div className="final">
        <div className="final__pair">
          <p className="type-title ivory">
            <KineticText variant="rise" from={0.04} span={0.24} stagger={0.07}>
              Same Curiosity.
            </KineticText>
          </p>
          <p className="type-title type-serif">
            <KineticText variant="rise" from={0.14} span={0.24} stagger={0.07}>
              Bigger Horizons.
            </KineticText>
          </p>
        </div>

        <div className="hairline" style={{ maxWidth: '12rem' }} aria-hidden="true" />

        <div className="final__pair">
          <h2 className="type-display">
            <KineticText by="char" variant="depth" from={0.3} span={0.3} stagger={0.028}>
              {personal.name}
            </KineticText>
          </h2>
          <p className="type-meta type-meta--wide">
            Software Engineer — {personal.disciplines.join(' • ')}
          </p>
        </div>

        <p className="type-lede" style={{ textAlign: 'center', marginInline: 'auto' }}>
          <KineticText variant="blur" from={0.52} span={0.24} stagger={0.04}>
            Let’s build something meaningful.
          </KineticText>
        </p>

        <div className="final__actions">
          <CinematicButton href="/contact">Contact</CinematicButton>
          <CinematicButton href="/resume" variant="quiet">
            View Resume
          </CinematicButton>
        </div>
      </div>
    </div>
  );
}
