'use client';

import { useMemo, type CSSProperties } from 'react';
import { cn } from '@/lib/utils/cn';

interface SplitTextProps {
  readonly children: string;
  /** Split into words (default) or individual characters. */
  readonly by?: 'word' | 'char';
  /**
   * `load` plays once when the page opens — right for the opening title.
   * `presence` ties the reveal to the chapter's own `--presence`, so a line
   * deep in the film performs when the camera arrives rather than while the
   * visitor is still looking at the first frame.
   */
  readonly reveal?: 'load' | 'presence';
  readonly delay?: number;
  readonly stagger?: number;
  readonly className?: string;
  readonly as?: 'span' | 'h1' | 'h2' | 'h3' | 'p';
}

/**
 * Masked reveal, one unit at a time.
 *
 * The visible text is split into spans that rise out of an overflow mask;
 * the original string is preserved as a single accessible label, so assistive
 * technology never hears it letter by letter.
 */
export function SplitText({
  children,
  by = 'word',
  reveal = 'load',
  delay = 0,
  stagger = 55,
  className,
  as: Tag = 'span',
}: SplitTextProps): React.JSX.Element {
  const units = useMemo(
    () => (by === 'word' ? children.split(/(\s+)/) : Array.from(children)),
    [by, children],
  );

  return (
    <Tag className={cn(className)}>
      <span
        aria-hidden="true"
        className={reveal === 'presence' ? 'split--presence' : undefined}
      >
        {units.map((unit, index) => {
          if (/^\s+$/.test(unit)) return <span key={index}>{unit}</span>;

          const style = (
            reveal === 'presence'
              ? { ['--i' as string]: index }
              : { ['--delay' as string]: `${delay + index * stagger}ms` }
          ) as CSSProperties;

          return (
            <span className="split" key={index}>
              <span className="split__unit" style={style}>
                {unit}
              </span>
            </span>
          );
        })}
      </span>
      <span className="visually-hidden">{children}</span>
    </Tag>
  );
}
