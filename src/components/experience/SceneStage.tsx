'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { getSceneAnchor } from '@/data/navigation/scenes';
import { useSceneSection } from '@/hooks/useSceneProgress';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import { useExperience } from './ExperienceProvider';
import { SceneScopeProvider } from './SceneContext';
import type { SceneId } from '@/types/scene';
import { cn } from '@/lib/utils/cn';

interface SceneStageProps {
  readonly id: SceneId;
  readonly children: ReactNode;
  readonly className?: string;
  /** Accessible name for the chapter. */
  readonly label: string;
}

/**
 * One chapter's frame, fixed to the viewport.
 *
 * Every chapter occupies the same rectangle and is composited in and out by
 * the `--presence` the engine writes onto it — so chapters cut and dissolve
 * between each other instead of scrolling past one another. Nothing here
 * moves with the scrollbar; the camera does.
 *
 * All twelve stay in the document and in the accessibility tree at all times.
 * A chapter that is currently faded out still takes keyboard focus, and when
 * it does, the film travels to it so the visitor can see what they landed on.
 */
export function SceneStage({
  id,
  children,
  className,
  label,
}: SceneStageProps): React.JSX.Element {
  const register = useSceneSection(id);
  const { scrollToProgress } = useExperience();
  const node = useRef<HTMLElement | null>(null);

  const ref = useCallback(
    (element: HTMLElement | null) => {
      node.current = element;
      register(element);
    },
    [register],
  );

  // A chapter frame cannot grow, and it hides its overflow — so content that
  // does not fit is silently cropped rather than pushing the page taller.
  // In development, say so instead of letting it ship unnoticed.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const element = node.current;
    if (!element) return;

    const check = () => {
      const content = element.firstElementChild;
      if (!content) return;
      const frame = element.getBoundingClientRect();
      const inner = content.getBoundingClientRect();
      const styles = getComputedStyle(element);
      const room =
        frame.height - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom);
      if (inner.height > room + 1) {
        console.warn(
          `[stage:${id}] content is ${Math.round(inner.height - room)}px taller than the frame ` +
            `and will be cropped at ${Math.round(frame.width)}x${Math.round(frame.height)}.`,
        );
      }
    };

    const observer = new ResizeObserver(check);
    observer.observe(element);
    const content = element.firstElementChild;
    if (content) observer.observe(content);
    return () => observer.disconnect();
  }, [id]);

  // Keyboard travel: focusing into a chapter that is off-screen brings the
  // camera to it rather than leaving the visitor reading an invisible frame.
  const onFocusCapture = useCallback(() => {
    if (getScrollEngine().presence(id) > 0.35) return;
    scrollToProgress(getSceneAnchor(id));
  }, [id, scrollToProgress]);

  return (
    <section
      ref={ref}
      className={cn('stage', className)}
      aria-label={label}
      onFocusCapture={onFocusCapture}
    >
      <SceneScopeProvider id={id}>{children}</SceneScopeProvider>
    </section>
  );
}
