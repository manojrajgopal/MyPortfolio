'use client';

import { primaryAchievement } from '@/data/achievements/achievements';
import { KineticText } from '@/components/motion/KineticText';
import { ScrambleText } from '@/components/motion/ScrambleText';

/**
 * Chapter 10 overlay.
 *
 * Three lines centred under the seal, and one sentence of what it means.
 * Deliberately under-designed — the moment carries it.
 */
export function AchievementOverlay(): React.JSX.Element {
  return (
    <div className="frame frame--center reveal">
      <div className="seal">
        <p className="seal__line type-meta type-meta--wide emerald">
          <ScrambleText from={0.06} span={0.22}>
            {primaryAchievement.headline[0] ?? ''}
          </ScrambleText>
        </p>
        <h2 className="seal__line type-title ivory">
          <KineticText
            by="char"
            variant="stretch"
            from={0.2}
            span={0.3}
            stagger={0.012}
            sharp={7}
            exit
          >
            {primaryAchievement.headline[1] ?? ''}
          </KineticText>
        </h2>
        <p className="seal__line type-meta type-meta--wide champagne">
          <ScrambleText from={0.44} span={0.2}>
            {primaryAchievement.headline[2] ?? ''}
          </ScrambleText>
        </p>
        <p className="type-body" style={{ textAlign: 'center', marginInline: 'auto' }}>
          <KineticText variant="blur" from={0.5} span={0.26} stagger={0.03} exit>
            {primaryAchievement.description}
          </KineticText>
        </p>
      </div>
    </div>
  );
}
