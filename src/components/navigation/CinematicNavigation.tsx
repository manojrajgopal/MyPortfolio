'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { chapters, markerFor, routes } from '@/data/navigation/navigation';
import { personal } from '@/data/profile/personal';
import { getSceneAnchor } from '@/data/navigation/scenes';
import { useActiveScene } from '@/hooks/useSceneProgress';
import { useExperience } from '@/components/experience/ExperienceProvider';
import { cn } from '@/lib/utils/cn';
import styles from './CinematicNavigation.module.css';

/**
 * The chapter navigator.
 *
 * Reads as a film timeline rather than a navbar: a name, a column of numbered
 * chapters, and the two routes off this page. Selecting a chapter flies the
 * camera there instead of jumping the scroll position.
 */
export function CinematicNavigation(): React.JSX.Element {
  const { scrollToProgress } = useExperience();
  const { scene } = useActiveScene();
  const [open, setOpen] = useState(false);

  const goTo = useCallback(
    (sceneId: (typeof chapters)[number]['scene']) => {
      scrollToProgress(getSceneAnchor(sceneId));
      setOpen(false);
    },
    [scrollToProgress],
  );

  return (
    <nav className={styles.nav} aria-label="Chapters">
      <Link href="/" className={styles.brand}>
        <span className="type-meta type-meta--wide ivory">{personal.name}</span>
      </Link>

      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls="chapter-list"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="type-meta">{open ? 'Close' : 'Chapters'}</span>
        <span className={cn(styles.toggleMark, open && styles.toggleMarkOpen)} aria-hidden="true" />
      </button>

      <ul id="chapter-list" className={cn(styles.list, open && styles.listOpen)}>
        {chapters.map((chapter) => {
          const current = chapter.scene === markerFor(scene.id);
          return (
            <li key={chapter.scene}>
              <button
                type="button"
                className={styles.chapter}
                data-current={current}
                aria-current={current ? 'step' : undefined}
                onClick={() => goTo(chapter.scene)}
              >
                <span className="type-index tabular">{chapter.index}</span>
                <span className={styles.chapterLabel}>{chapter.label}</span>
                <span className={styles.chapterRule} aria-hidden="true" />
              </button>
            </li>
          );
        })}

        <li className={styles.routes}>
          {routes.map((route) => (
            <Link key={route.href} href={route.href} className={styles.route}>
              <span className="type-meta">{route.label}</span>
            </Link>
          ))}
        </li>
      </ul>
    </nav>
  );
}
