'use client';

import { useEffect, useState } from 'react';
import { personal } from '@/data/profile/personal';
import styles from './CinematicLoader.module.css';

const STAGES = ['Initializing experience', 'Building environment', 'System ready'] as const;

/**
 * The title card.
 *
 * It does not pretend to measure anything — no fake percentage of a download
 * that already finished. It holds the frame for a beat while the first
 * chapter compiles its shaders, states three things, and lifts away.
 */
export function CinematicLoader(): React.JSX.Element | null {
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setStage(1), 620),
      window.setTimeout(() => setStage(2), 1380),
      window.setTimeout(() => setDone(true), 2100),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, []);

  // Removed from the tree entirely once the curtain has lifted.
  const [mounted, setMounted] = useState(true);
  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => setMounted(false), 1200);
    return () => window.clearTimeout(timer);
  }, [done]);

  if (!mounted) return null;

  return (
    <div className={styles.loader} data-done={done} role="status" aria-live="polite">
      <div className={styles.inner}>
        <p className={styles.name}>{personal.name}</p>
        <span className={styles.rule} aria-hidden="true" />
        <p className={styles.stage}>{STAGES[stage]}</p>
      </div>
      <span className={styles.curtain} aria-hidden="true" />
    </div>
  );
}
