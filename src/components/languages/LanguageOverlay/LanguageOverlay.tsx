'use client';

import { languages } from '@/data/languages/languages';
import { SectionLabel } from '@/components/ui/SectionLabel/SectionLabel';
import { KineticText } from '@/components/motion/KineticText';

/**
 * Chapter 11 overlay.
 *
 * Four lines. Proficiency is stated in words, never drawn as a bar.
 */
export function LanguageOverlay(): React.JSX.Element {
  return (
    <div className="frame frame--offset reveal">
      <div className="languages">
        <SectionLabel index="11">Languages</SectionLabel>

        {languages.map((language, index) => (
          <p key={language.id} className="language language--arrive" style={{ ['--at' as string]: 0.08 + index * 0.11 }}>
            <span className="type-heading ivory">
              <KineticText variant="rise" from={0.08 + index * 0.11} span={0.2} stagger={0.05}>
                {language.language}
              </KineticText>
            </span>
            <span className="type-meta">{language.proficiency}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
