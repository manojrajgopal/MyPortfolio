export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'manoj-portfolio-theme';
export const THEME_ATTRIBUTE = 'data-theme';

type Listener = (resolved: ResolvedTheme, preference: ThemePreference) => void;

function isPreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

/**
 * The theme, owned outside React.
 *
 * A singleton for the same reason the scroll engine is one: the WebGL tree
 * renders in its own reconciler root and cannot see React context from the DOM
 * tree, and the world's lighting has to know which theme is active. Both trees
 * import this.
 *
 * The store never *animates* anything. It publishes the target; the scene
 * director eases the world toward it, and CSS transitions handle the document.
 */
class ThemeStore {
  private preference: ThemePreference = 'system';
  private systemPrefersDark = true;
  private readonly listeners = new Set<Listener>();
  private query: MediaQueryList | null = null;

  /**
   * Read the stored choice and start following the OS. Client only.
   *
   * Deliberately does not notify subscribers. Reads call this lazily, and a
   * read can happen while React is rendering some other component — notifying
   * from there would set state during a render and tear down the tree that
   * was mid-render. The boot script has already put the correct attribute on
   * the document, so there is nothing for anyone to react to yet.
   */
  private ensureLoaded(): void {
    if (typeof window === 'undefined' || this.query) return;

    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (isPreference(stored)) this.preference = stored;
    } catch {
      // Storage can be unavailable; the system preference still applies.
    }

    this.query = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemPrefersDark = this.query.matches;
    this.query.addEventListener('change', this.onSystemChange);

    this.write();
  }

  /** Kept for explicit setup from a mount effect. Safe to call repeatedly. */
  initialise(): void {
    this.ensureLoaded();
  }

  dispose(): void {
    this.query?.removeEventListener('change', this.onSystemChange);
    this.query = null;
  }

  private readonly onSystemChange = (event: MediaQueryListEvent): void => {
    this.systemPrefersDark = event.matches;
    // Only a "system" preference cares; an explicit choice stands.
    if (this.preference === 'system') this.apply();
  };

  getPreference(): ThemePreference {
    this.ensureLoaded();
    return this.preference;
  }

  /**
   * Self-initialising.
   *
   * The WebGL world reads the theme inside its frame loop, which can run
   * before any React component has mounted and called `initialise`. Without
   * this the world would spend its first frames rendering the wrong theme and
   * only correct itself once the toggle happened to mount.
   */
  getResolved(): ResolvedTheme {
    this.ensureLoaded();
    return this.resolve();
  }

  /** Pure read — no loading, no side effects. */
  private resolve(): ResolvedTheme {
    if (this.preference === 'system') return this.systemPrefersDark ? 'dark' : 'light';
    return this.preference;
  }

  set(preference: ThemePreference): void {
    this.preference = preference;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, preference);
      } catch {
        // Private browsing can refuse storage; the choice still applies for
        // this session.
      }
    }
    this.apply();
  }

  /** Cycle light → dark → system, for the toggle control. */
  cycle(): ThemePreference {
    const order: ThemePreference[] = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(this.preference) + 1) % order.length]!;
    this.set(next);
    return next;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Put the resolved theme on the document. No notification. */
  private write(): void {
    if (typeof document === 'undefined') return;
    const resolved = this.resolve();
    const root = document.documentElement;
    root.setAttribute(THEME_ATTRIBUTE, resolved);
    // `color-scheme` makes form controls, scrollbars and the canvas backdrop
    // follow the theme without being styled individually.
    root.style.colorScheme = resolved;
  }

  /** Write and notify. Only ever called from an event, never from a read. */
  private apply(): void {
    this.write();
    const resolved = this.resolve();
    this.listeners.forEach((listener) => listener(resolved, this.preference));
  }
}

let instance: ThemeStore | null = null;

export function getThemeStore(): ThemeStore {
  if (!instance) instance = new ThemeStore();
  return instance;
}

/**
 * Runs before first paint, inlined in the document head.
 *
 * Without this the page renders with the default theme and then corrects
 * itself once React hydrates — a visible flash of the wrong colours on every
 * load. Kept deliberately tiny and dependency-free.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{
var k=${JSON.stringify(THEME_STORAGE_KEY)};
var p=localStorage.getItem(k);
if(p!=='light'&&p!=='dark'&&p!=='system')p='system';
var d=p==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;
document.documentElement.setAttribute(${JSON.stringify(THEME_ATTRIBUTE)},d);
document.documentElement.style.colorScheme=d;
}catch(e){
document.documentElement.setAttribute(${JSON.stringify(THEME_ATTRIBUTE)},'dark');
}})();`;
