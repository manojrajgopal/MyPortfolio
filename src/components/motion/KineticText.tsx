'use client';

import { useMemo, type CSSProperties } from 'react';
import { cn } from '@/lib/utils/cn';

export type KineticVariant = 'rise' | 'blur' | 'depth' | 'stretch' | 'wipe' | 'fill';

interface KineticTextProps {
  readonly children: string;
  /** Split into words (default) or individual characters. */
  readonly by?: 'word' | 'char';
  readonly variant?: KineticVariant;
  /** Where the reveal begins inside the chapter, 0–1. */
  readonly from?: number;
  /** How much of the chapter the reveal occupies. */
  readonly span?: number;
  /** Delay between consecutive units, as a fraction of the reveal. */
  readonly stagger?: number;
  /** How abruptly each unit resolves once its turn arrives. */
  readonly sharp?: number;
  /** Drift and dissolve as the chapter closes. */
  readonly exit?: boolean;
  /** Lean into the direction of scroll. */
  readonly lean?: boolean;
  /**
   * Play once on mount instead of scrubbing with scroll. Only the opening
   * chapter needs this: it is on screen before the visitor has scrolled, so
   * its type has to perform without any scroll position to read.
   */
  readonly onLoad?: boolean;
  /** Milliseconds before the load reveal begins. */
  readonly delay?: number;
  readonly className?: string;
  readonly as?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'p';
}

/**
 * Scroll-scrubbed type.
 *
 * The text is split into units that each resolve on their own beat, derived
 * from the chapter's linear `--t` rather than from a timed animation — so
 * scrolling back un-reveals the line exactly the way it arrived, and pausing
 * mid-reveal holds the frame there. That is the difference between type that
 * is triggered by scrolling and type that is cut to the camera.
 *
 * The visible spans are hidden from assistive technology and the original
 * string is carried alongside them, so a screen reader hears one sentence
 * rather than a stream of fragments.
 */
export function KineticText({
  children,
  by = 'word',
  variant = 'rise',
  from = 0,
  span = 0.34,
  stagger = 0.03,
  sharp = 4,
  exit = false,
  lean = false,
  onLoad = false,
  delay = 0,
  className,
  as: Tag = 'span',
}: KineticTextProps): React.JSX.Element {
  /**
   * Words first, characters second.
   *
   * Splitting straight into characters gives the browser a break opportunity
   * between every letter, and long titles wrap mid-word. Grouping the
   * characters of each word inside a non-breaking span keeps the line breaks
   * where they belong while still animating letter by letter.
   */
  const words = useMemo(() => children.split(/(\s+)/), [children]);

  const style = {
    ['--from' as string]: from,
    ['--span' as string]: span,
    ['--stagger' as string]: stagger,
    ['--sharp' as string]: sharp,
    ['--load-delay' as string]: `${delay}ms`,
  } as CSSProperties;

  // `rise` climbs out of a mask; the others animate in place.
  const masked = variant === 'rise';

  let index = 0;

  const renderUnit = (unit: string, key: string | number): React.JSX.Element => {
    const unitStyle = {
      ['--i' as string]: index,
      ['--unit-delay' as string]: `${delay + index * 46}ms`,
    } as CSSProperties;
    index += 1;

    const inner = (
      <span className="kinetic__unit" style={unitStyle} data-text={unit}>
        {unit}
      </span>
    );

    return masked ? (
      <span className="kinetic__mask" key={key}>
        {inner}
      </span>
    ) : (
      <span key={key}>{inner}</span>
    );
  };

  return (
    <Tag className={className}>
      <span
        aria-hidden="true"
        data-exit={exit || undefined}
        className={cn(
          'kinetic',
          `kinetic--${variant}`,
          lean && 'kinetic--lean',
          onLoad && 'kinetic--load',
        )}
        style={style}
      >
        {words.map((word, key) => {
          if (/^\s+$/.test(word)) return <span key={key}>{word}</span>;
          if (by === 'word') return renderUnit(word, key);

          return (
            <span className="kinetic__word" key={key}>
              {Array.from(word).map((character, position) =>
                renderUnit(character, `${key}:${position}`),
              )}
            </span>
          );
        })}
      </span>
      <span className="visually-hidden">{children}</span>
    </Tag>
  );
}
