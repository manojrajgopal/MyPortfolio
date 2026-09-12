'use client';

import { useCallback, useId, useState } from 'react';
import { Plus } from 'lucide-react';
import type { ExperienceEntry } from '@/types/experience';
import { TokenList } from '@/components/ui/TokenList/TokenList';
import { Tilt } from '@/components/motion/Tilt';
import { interaction } from '@/lib/state/interactionStore';

interface ExperienceCardProps {
  readonly entry: ExperienceEntry;
  /** Position in the chapter, which sets when the card arrives. */
  readonly order: number;
}

/**
 * One role.
 *
 * The card shows only what can be scanned — index, period, company, role and
 * stack. The responsibilities stay folded away until asked for, and pointing
 * at the card lights the matching structure out in the 3D world.
 */
export function ExperienceCard({ entry, order }: ExperienceCardProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const detailId = useId();

  const focus = useCallback(() => interaction.set('experience', entry.id), [entry.id]);
  const blur = useCallback(() => interaction.clear('experience', entry.id), [entry.id]);

  return (
    <Tilt max={4} lift={12}>
      <article
        className="role surface role--arrive"
        data-open={open}
        style={{ ['--arrive-at' as string]: 0.16 + order * 0.16 }}
        onPointerEnter={focus}
        onPointerLeave={blur}
      >
        <p className="role__head">
          <span className="type-index tabular">{entry.index}</span>
          <span className="type-meta">{entry.period}</span>
        </p>

        <div className="stack stack--tight">
          <h3 className="type-heading ivory">{entry.role}</h3>
          <p className="role__company">
            <span className="type-meta champagne">{entry.company}</span>
            <span className="type-meta">
              {entry.mode} — {entry.location}
            </span>
          </p>
        </div>

        <TokenList items={entry.stack} />

        <div className="role__detail" id={detailId}>
          <div className="role__detailInner">
            <ul className="role__list">
              {entry.responsibilities.map((item) => (
                <li key={item}>
                  <span className="role__bullet" aria-hidden="true">
                    —
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          type="button"
          className="btn btn--quiet"
          aria-expanded={open}
          aria-controls={detailId}
          onClick={() => setOpen((value) => !value)}
          onFocus={focus}
          onBlur={blur}
        >
          <span className="copper">{open ? 'Close' : 'Responsibilities'}</span>
          <Plus
            size={13}
            aria-hidden="true"
            style={{
              color: 'var(--c-copper)',
              transform: open ? 'rotate(45deg)' : 'none',
              transition: 'transform 520ms cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        </button>
      </article>
    </Tilt>
  );
}
