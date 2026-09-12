'use client';

import { useCallback, useState } from 'react';
import { skillGroups, totalSkillCount } from '@/data/skills/skills';
import { SectionLabel } from '@/components/ui/SectionLabel/SectionLabel';
import { interaction } from '@/lib/state/interactionStore';
import { KineticText } from '@/components/motion/KineticText';
import { CountUp } from '@/components/motion/CountUp';

/**
 * Chapter 07 overlay.
 *
 * Seven groups, listed. Focusing one levels and brightens the matching shell
 * in the constellation behind — the list is a control surface for the sky,
 * not a legend for it.
 *
 * The note for the focused group is printed in the left column rather than
 * inside the row, so moving between groups never changes the height of the
 * list. A chapter frame cannot grow, and a list that reflows on hover would
 * push its own last entries out of the frame.
 *
 * There are no proficiency bars anywhere on this site, by design.
 */
export function SkillsOverlay(): React.JSX.Element {
  const [active, setActive] = useState<string | null>(null);

  const focus = useCallback((id: string) => {
    setActive(id);
    interaction.set('skillGroup', id);
  }, []);

  const blur = useCallback((id: string) => {
    setActive((current) => (current === id ? null : current));
    interaction.clear('skillGroup', id);
  }, []);

  const focused = skillGroups.find((group) => group.id === active);

  return (
    <div className="skills reveal">
      <div className="stack lane-far">
        <SectionLabel index="07">Technology Constellation</SectionLabel>
        <h2 className="type-display">
          <KineticText variant="rise" from={0.04} span={0.26} stagger={0.06} lean exit>
            What I build
          </KineticText>
          <br />
          <span className="type-serif">
            <KineticText variant="rise" from={0.14} span={0.22} stagger={0.06} exit>
              with.
            </KineticText>
          </span>
        </h2>

        <div className="skills__readout">
          <p className="type-meta">
            <CountUp value={totalSkillCount} from={0.1} span={0.34} /> technologies —{' '}
            <CountUp value={skillGroups.length} from={0.14} span={0.3} /> orbits
          </p>
          {/* Reserved space: the line changes, the layout does not. */}
          <p className="skills__note" aria-live="polite">
            {focused ? focused.nodes.map((node) => node.note).join(' · ') : ''}
          </p>
        </div>
      </div>

      <ul className="skills__groups lane-mid">
        {skillGroups.map((group) => (
          <li
            key={group.id}
            data-accent={group.accent}
            className="skills__row"
            style={{ ['--at' as string]: 0.06 + Number(group.index) * 0.055 }}
          >
            <button
              type="button"
              className="skills__group"
              data-active={active === group.id}
              onPointerEnter={() => focus(group.id)}
              onPointerLeave={() => blur(group.id)}
              onFocus={() => focus(group.id)}
              onBlur={() => blur(group.id)}
            >
              <span className="type-index tabular">{group.index}</span>
              <span className="skills__body">
                <span className="skills__name">{group.name}</span>
                <span className="skills__names tokens">
                  {group.nodes.map((node) => (
                    <span key={node.id} className="type-token" style={{ textTransform: 'none' }}>
                      {node.name}
                    </span>
                  ))}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
