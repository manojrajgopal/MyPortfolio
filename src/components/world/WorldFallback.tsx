'use client';

import styles from './WorldFallback.module.css';

/**
 * Shown when the browser cannot give us a WebGL context.
 *
 * The story is carried entirely by the overlay in that case, so this only has
 * to supply atmosphere — a lit horizon and a slow drift. Never an error, and
 * never an empty black rectangle.
 */
export function WorldFallback(): React.JSX.Element {
  return (
    <div className={styles.fallback} aria-hidden="true">
      <div className={styles.horizon} />
      <div className={styles.ridge} />
      <div className={styles.haze} />
    </div>
  );
}
