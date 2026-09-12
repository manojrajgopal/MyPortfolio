'use client';

import Lenis from 'lenis';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getScrollEngine } from '@/lib/scroll/engineSingleton';
import type { ScrollEngine } from '@/lib/scroll/ScrollEngine';
import {
  detectPerformance,
  isWebGLAvailable,
  type PerformanceProfile,
} from '@/lib/three/performance';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ExperienceContextValue {
  readonly engine: ScrollEngine;
  readonly profile: PerformanceProfile;
  readonly reducedMotion: boolean;
  readonly webgl: boolean;
  /** Becomes true once the loader has handed over to the world. */
  readonly ready: boolean;
  markReady: () => void;
  /** Fly the camera to a chapter by scrolling there. */
  scrollToProgress: (progress: number) => void;
}

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

export function useExperience(): ExperienceContextValue {
  const value = useContext(ExperienceContext);
  if (!value) throw new Error('useExperience must be used inside ExperienceProvider');
  return value;
}

export function ExperienceProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const [engine] = useState(getScrollEngine);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<PerformanceProfile>(() => detectPerformance());
  const [webgl, setWebgl] = useState(true);
  const lenisRef = useRef<Lenis | null>(null);

  // Capability detection has to wait for the client.
  useEffect(() => {
    setProfile(detectPerformance());
    setWebgl(isWebGLAvailable());
  }, []);

  useEffect(() => {
    engine.setReducedMotion(reducedMotion);
  }, [engine, reducedMotion]);

  // Smooth scrolling + the single animation frame loop for the whole site.
  useEffect(() => {
    let frame = 0;
    let last = performance.now();

    if (!reducedMotion) {
      const lenis = new Lenis({
        duration: 1.35,
        easing: (t: number) => 1 - Math.pow(1 - t, 3.2),
        wheelMultiplier: 0.92,
        touchMultiplier: 1.4,
        lerp: 0.09,
      });
      lenisRef.current = lenis;
    }

    const onPointerMove = (event: PointerEvent) => engine.setPointer(event.clientX, event.clientY);
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    engine.setRawFromScroll(window.scrollY);

    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      lenisRef.current?.raf(time);

      // Read the document's actual scroll position rather than subscribing to
      // the smooth-scroll library's own event. The library writes the real
      // position every frame, so this is the value that matches what is on
      // screen — and it stays correct for anchor jumps, End, and session
      // restore, which never emit that event at all.
      engine.setRawFromScroll(window.scrollY);

      const delta = (time - last) / 1000;
      last = time;
      engine.update(delta);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onPointerMove);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, [engine, reducedMotion]);

  const value = useMemo<ExperienceContextValue>(
    () => ({
      engine,
      profile,
      reducedMotion,
      webgl,
      ready,
      markReady: () => setReady(true),
      scrollToProgress: (progress: number) => {
        const target = engine.pixelsFor(progress);
        const lenis = lenisRef.current;
        if (lenis) lenis.scrollTo(target, { duration: 2.1 });
        else window.scrollTo({ top: target, behavior: reducedMotion ? 'auto' : 'smooth' });
      },
    }),
    [engine, profile, reducedMotion, webgl, ready],
  );

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}
