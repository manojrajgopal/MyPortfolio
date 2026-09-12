'use client';

import { SectionLabel } from '@/components/ui/SectionLabel/SectionLabel';
import { KineticText } from '@/components/motion/KineticText';
import { ScrambleText } from '@/components/motion/ScrambleText';

/**
 * Chapter 06 overlay.
 *
 * The camera is inside the network here, so the type stays to one side and
 * says as little as possible.
 */
export function AIOverlay(): React.JSX.Element {
  return (
    <div className="frame frame--offset reveal reveal--drift">
      <div className="ai stack">
        <SectionLabel index="06">Inference</SectionLabel>
        <h2 className="type-title">
          <KineticText variant="blur" from={0.06} span={0.3} stagger={0.05} lean exit>
            Where backend engineering meets
          </KineticText>{' '}
          <span className="type-serif">
            <KineticText variant="rise" from={0.24} span={0.26} stagger={0.06} exit>
              learning systems.
            </KineticText>
          </span>
        </h2>
        <p className="type-meta">
          <ScrambleText from={0.3} span={0.3}>
            TENSORFLOW — NLP — OPENCV — AGENTIC AI
          </ScrambleText>
        </p>
      </div>
    </div>
  );
}
