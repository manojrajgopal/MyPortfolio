'use client';

import { useCallback } from 'react';
import { certifications } from '@/data/certifications/certifications';
import { SectionLabel } from '@/components/ui/SectionLabel/SectionLabel';
import { TokenList } from '@/components/ui/TokenList/TokenList';
import { interaction } from '@/lib/state/interactionStore';
import { KineticText } from '@/components/motion/KineticText';

/**
 * Chapter 09 overlay.
 *
 * Each credential is name, issuer and date up front; the focus statement
 * unfolds on approach. Pointing at one lifts the matching artifact out of
 * the vault behind.
 */
export function CredentialList(): React.JSX.Element {
  const focus = useCallback((id: string) => interaction.set('certification', id), []);
  const blur = useCallback((id: string) => interaction.clear('certification', id), []);

  return (
    <div className="stack reveal" style={{ width: '100%' }}>
      <SectionLabel index="09">Certification Vault</SectionLabel>

      <ul className="vault">
        {certifications.map((certification, index) => (
          <li
            key={certification.id}
            className="credential surface credential--arrive"
            style={{ ['--at' as string]: 0.06 + index * 0.07 }}
            tabIndex={0}
            onPointerEnter={() => focus(certification.id)}
            onPointerLeave={() => blur(certification.id)}
            onFocus={() => focus(certification.id)}
            onBlur={() => blur(certification.id)}
          >
            <p className="row" style={{ justifyContent: 'space-between' }}>
              <span className="type-index tabular">{certification.index}</span>
              <span className="type-meta tabular">{certification.date}</span>
            </p>
            <h3 className="type-heading ivory" style={{ fontSize: 'var(--t-body)' }}>
              <KineticText
                variant="wipe"
                from={0.08 + index * 0.07}
                span={0.2}
                stagger={0.02}
                sharp={8}
              >
                {certification.name}
              </KineticText>
            </h3>
            <p className="type-meta champagne">{certification.organization}</p>
            <TokenList items={certification.tokens} />
            <p className="credential__focus">{certification.focus}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
