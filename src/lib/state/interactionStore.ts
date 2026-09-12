/**
 * A tiny shared store so DOM interaction can reach into the WebGL world.
 *
 * Hovering an experience node in the overlay lights the matching structure in
 * 3D; focusing a skill pulls that node forward. Values are read inside frame
 * loops, so writes deliberately do not trigger React renders.
 */
export interface InteractionState {
  /** id of the hovered/focused experience entry. */
  experience: string | null;
  /** id of the hovered/focused skill group. */
  skillGroup: string | null;
  /** id of the hovered/focused certification. */
  certification: string | null;
  /** id of the project currently expanded. */
  project: string | null;
}

type Listener = (state: Readonly<InteractionState>) => void;

class InteractionStore {
  readonly state: InteractionState = {
    experience: null,
    skillGroup: null,
    certification: null,
    project: null,
  };

  private readonly listeners = new Set<Listener>();

  set<K extends keyof InteractionState>(key: K, value: InteractionState[K]): void {
    if (this.state[key] === value) return;
    this.state[key] = value;
    this.listeners.forEach((listener) => listener(this.state));
  }

  /** Clear a slot only if it still holds `value` — avoids races on fast hovers. */
  clear<K extends keyof InteractionState>(key: K, value: InteractionState[K]): void {
    if (this.state[key] === value) this.set(key, null);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const interaction = new InteractionStore();
