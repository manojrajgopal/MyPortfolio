/**
 * Entrance choreography for the secondary routes.
 *
 * These are CSS-driven on purpose. An entrance animation must never be the
 * thing that decides whether content is visible: if it fails to start, the
 * page is simply blank. Here the markup renders visible and the animation
 * only adds travel on top, so the worst case is no animation rather than no
 * content.
 */

/** Stagger step between entering blocks, in milliseconds. */
export const ENTER_STEP = 70;

/** Inline style that positions an element in the entrance sequence. */
export function enterDelay(index: number, offset = 0): React.CSSProperties {
  return { ['--enter-delay' as string]: `${offset + index * ENTER_STEP}ms` };
}
