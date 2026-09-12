import { sceneWindows } from '@/data/navigation/scenes';
import type { SceneId } from '@/types/scene';
import { envelope } from '@/lib/motion/easing';
import { clamp } from '@/lib/utils/clamp';
import { damp } from '@/lib/utils/lerp';

export interface EngineState {
  /** Raw scroll position, 0–1. */
  raw: number;
  /** Damped scroll position. Everything visual reads this. */
  progress: number;
  /** Signed scroll velocity, roughly -1..1 after clamping. */
  velocity: number;
  /** Normalised pointer, -1..1 on both axes, damped. */
  pointerX: number;
  pointerY: number;
  /** Index of the chapter currently on screen. */
  sceneIndex: number;
}

/** A stretch of the scroll axis that a DOM element is bound to. */
interface Band {
  readonly element: HTMLElement;
  readonly start: number;
  readonly end: number;
  readonly shoulder: number;
  /** A band at the very top of the page opens already resolved. */
  readonly openAtStart: boolean;
  /** A band at the very bottom never fades back out. */
  readonly holdAtEnd: boolean;
  lastPresence: number;
  lastLocal: number;
}

type SceneListener = (index: number) => void;

const DEFAULT_SHOULDER = 0.2;

/**
 * One engine drives the entire experience: the camera, the lighting, every
 * DOM reveal and the chapter indicator. Nothing else listens to scroll.
 *
 * Per-frame values live on a mutable state object rather than React state —
 * React never re-renders because the page scrolled.
 */
export class ScrollEngine {
  readonly state: EngineState = {
    raw: 0,
    progress: 0,
    velocity: 0,
    pointerX: 0,
    pointerY: 0,
    sceneIndex: 0,
  };

  private pointerTargetX = 0;
  private pointerTargetY = 0;
  private root: HTMLElement | null = null;
  private lastVelocityWrite = 0;
  private previousProgress = 0;
  private readonly bands = new Map<string, Band>();
  private readonly sceneListeners = new Set<SceneListener>();

  /** Smoothing factor: fraction of distance remaining after one second. */
  private smoothing = 0.0016;

  reducedMotion = false;

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
    // Reduced motion tracks the scrollbar almost exactly — no drift, no lag.
    this.smoothing = value ? 0.000001 : 0.0016;
  }

  /**
   * Bind an element to an arbitrary stretch of the scroll axis. The engine
   * writes `--presence` and `--t` onto it every frame.
   */
  registerBand(
    key: string,
    element: HTMLElement | null,
    start: number,
    end: number,
    shoulder = DEFAULT_SHOULDER,
  ): void {
    if (!element) {
      this.bands.delete(key);
      return;
    }
    this.bands.set(key, {
      element,
      start,
      end,
      shoulder,
      openAtStart: start <= 0.0001,
      holdAtEnd: end >= 0.9999,
      lastPresence: -1,
      lastLocal: -1,
    });
  }

  /** Bind an element to a whole chapter. */
  registerSection(id: SceneId, element: HTMLElement | null): void {
    const window = sceneWindows.find((w) => w.id === id);
    if (!window) return;
    this.registerBand(`scene:${id}`, element, window.start, window.end);
  }

  onSceneChange(listener: SceneListener): () => void {
    this.sceneListeners.add(listener);
    return () => this.sceneListeners.delete(listener);
  }

  setPointer(clientX: number, clientY: number): void {
    if (typeof window === 'undefined') return;
    this.pointerTargetX = (clientX / window.innerWidth) * 2 - 1;
    this.pointerTargetY = (clientY / window.innerHeight) * 2 - 1;
  }

  setRawFromScroll(scrollY: number): void {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    this.state.raw = max > 0 ? clamp(scrollY / max) : 0;
  }

  /** Local progress inside a chapter window, 0–1. */
  localProgress(id: SceneId): number {
    const window = sceneWindows.find((w) => w.id === id);
    if (!window) return 0;
    const span = window.end - window.start;
    return span <= 0 ? 0 : clamp((this.state.progress - window.start) / span);
  }

  /**
   * True while the camera is inside a chapter window, or within `margin` of
   * it. Drives mounting of heavy 3D chapters — everything else stays
   * unmounted.
   */
  isNear(id: SceneId, margin = 0.05): boolean {
    const window = sceneWindows.find((w) => w.id === id);
    if (!window) return false;
    const { progress } = this.state;
    return progress >= window.start - margin && progress <= window.end + margin;
  }

  /** Presence envelope for a chapter: 0 → 1 → 0 across its window. */
  presence(id: SceneId): number {
    const window = sceneWindows.find((w) => w.id === id);
    const local = this.localProgress(id);
    if (window && window.start <= 0.0001 && local < DEFAULT_SHOULDER) return 1;
    if (window && window.end >= 0.9999 && local > 1 - DEFAULT_SHOULDER) return 1;
    return envelope(local, DEFAULT_SHOULDER);
  }

  /**
   * Advance the engine. Called once per animation frame by the provider —
   * this is the only place scroll maths happens.
   */
  update(delta: number): void {
    const dt = Math.min(delta, 0.1);
    const { state } = this;

    state.progress = this.reducedMotion
      ? state.raw
      : damp(state.progress, state.raw, this.smoothing, dt);

    const rawVelocity = dt > 0 ? (state.progress - this.previousProgress) / dt : 0;
    this.previousProgress = state.progress;
    state.velocity = damp(state.velocity, clamp(rawVelocity * 6, -1, 1), 0.0001, dt);

    if (this.reducedMotion) {
      state.pointerX = 0;
      state.pointerY = 0;
    } else {
      state.pointerX = damp(state.pointerX, this.pointerTargetX, 0.0009, dt);
      state.pointerY = damp(state.pointerY, this.pointerTargetY, 0.0009, dt);
    }

    this.writeGlobals();
    this.writeBands();
    this.updateActiveScene();
  }

  /**
   * Scroll speed, published to the document so type can lean into the
   * movement. `--velocity` is signed (-1..1) and `--speed` is its magnitude;
   * together they let a heading skew with the direction of travel and blur
   * with the pace of it, entirely in CSS.
   */
  private writeGlobals(): void {
    if (typeof document === 'undefined') return;
    this.root ??= document.documentElement;

    const velocity = this.reducedMotion ? 0 : this.state.velocity;
    if (Math.abs(velocity - this.lastVelocityWrite) < 0.004) return;
    this.lastVelocityWrite = velocity;

    this.root.style.setProperty('--velocity', velocity.toFixed(3));
    this.root.style.setProperty('--speed', Math.abs(velocity).toFixed(3));
  }

  /**
   * Push `--presence` and `--t` onto every bound element. Both are consumed
   * only by opacity, transform and filter, so this never triggers layout.
   *
   * Nothing is hidden from assistive technology here: content stays in the
   * accessibility tree at all times, and only pointer interaction is gated.
   */
  private writeBands(): void {
    const { progress } = this.state;

    for (const band of this.bands.values()) {
      const span = band.end - band.start;
      const local = span <= 0 ? 0 : clamp((progress - band.start) / span);

      // The first chapter is already on screen when the page opens, and the
      // last one holds through the final frame — neither gets a shoulder on
      // the outside edge of the film.
      let presence = envelope(local, band.shoulder);
      if (band.openAtStart && local < band.shoulder) presence = 1;
      if (band.holdAtEnd && local > 1 - band.shoulder) presence = 1;

      // Skip redundant writes — most bands are dormant on any given frame.
      //
      // Both values have to be compared. Presence sits pinned at 1 through the
      // middle of every chapter while `--t` keeps advancing, so testing
      // presence alone freezes `--t` exactly where the chapter's own text
      // choreography is staged.
      if (
        Math.abs(band.lastPresence - presence) < 0.0015 &&
        Math.abs(band.lastLocal - local) < 0.0008
      ) {
        continue;
      }

      const wasInert = band.lastPresence <= 0.001;
      band.lastPresence = presence;
      band.lastLocal = local;

      band.element.style.setProperty('--presence', presence.toFixed(4));
      band.element.style.setProperty('--t', local.toFixed(4));

      const inert = presence <= 0.001;
      if (inert !== wasInert) band.element.style.pointerEvents = inert ? 'none' : '';
    }
  }

  private updateActiveScene(): void {
    const { progress } = this.state;
    let index = sceneWindows.length - 1;
    for (let i = 0; i < sceneWindows.length; i += 1) {
      const window = sceneWindows[i]!;
      if (progress >= window.start && progress < window.end) {
        index = i;
        break;
      }
    }
    if (index !== this.state.sceneIndex) {
      this.state.sceneIndex = index;
      this.sceneListeners.forEach((listener) => listener(index));
    }
  }

  /** Scroll position, in pixels, for a given normalised progress. */
  pixelsFor(progress: number): number {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return clamp(progress) * max;
  }
}
