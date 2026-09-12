'use client';

import { useEffect, useRef } from 'react';
import { scenes } from '@/data/navigation/scenes';
import { useActiveScene } from '@/hooks/useSceneProgress';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import styles from './SceneIndicator.module.css';

/**
 * Bottom-right readout: which chapter is playing, and how far through the
 * film we are.
 *
 * The progress bar is written straight to the DOM from the engine each frame
 * rather than driven by React state.
 */
export function SceneIndicator(): React.JSX.Element {
  const { index, scene } = useActiveScene();
  const bar = useRef<HTMLSpanElement>(null);
  const readout = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const engine = getScrollEngine();
    let frame = 0;
    let last = -1;

    const tick = () => {
      frame = requestAnimationFrame(tick);
      const value = engine.state.progress;
      if (bar.current) bar.current.style.scale = `1 ${Math.max(0.001, value)}`;

      const percent = Math.round(value * 100);
      if (percent !== last && readout.current) {
        last = percent;
        readout.current.textContent = `${percent.toString().padStart(2, '0')}%`;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <aside className={styles.indicator} aria-live="polite">
      <span className={styles.track} aria-hidden="true">
        <span ref={bar} className={styles.fill} />
      </span>

      <span className={styles.meta}>
        <span className="type-index tabular">
          {scene.index} / {scenes.length.toString().padStart(2, '0')}
        </span>
        <span className="type-meta type-meta--wide ivory">{scene.label}</span>
        <span className="type-meta">{scene.caption}</span>
        <span ref={readout} className="type-meta tabular copper">
          00%
        </span>
      </span>

      <span className="visually-hidden">
        Chapter {index + 1} of {scenes.length}: {scene.label}
      </span>
    </aside>
  );
}
