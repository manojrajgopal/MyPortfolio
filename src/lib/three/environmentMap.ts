import {
  CanvasTexture,
  EquirectangularReflectionMapping,
  PMREMGenerator,
  SRGBColorSpace,
  type Texture,
  type WebGLRenderer,
} from 'three';

/**
 * A studio, drawn on a canvas.
 *
 * Metal is almost entirely reflection: a `metalness: 0.9` surface with no
 * environment to reflect renders as a black shape with a few specular dots,
 * however many lights are pointed at it. Rather than ship an HDRI — a binary
 * asset with a licence attached — the environment is painted here from the
 * same palette the rest of the site uses: a dark floor, a warm band at the
 * horizon where the key light lives, a cooler sky, and one bright overhead
 * panel standing in for a softbox.
 *
 * The result is passed through PMREM so roughness blurs the reflection
 * correctly, which is what makes the copper read as burnished rather than
 * chrome.
 */

const WIDTH = 512;
const HEIGHT = 256;

export type EnvironmentTheme = 'light' | 'dark';

/** One map per theme; both are cheap and switching must not stall a frame. */
const cache = new Map<EnvironmentTheme, Texture>();

interface Palette {
  readonly skyTop: string;
  readonly skyMid: string;
  readonly horizon: string;
  readonly floorTop: string;
  readonly floorBottom: string;
  readonly key: readonly [string, string];
  readonly overhead: readonly [string, string];
  readonly bounce: string;
}

const PALETTES: Record<EnvironmentTheme, Palette> = {
  dark: {
    skyTop: '#2a2b30',
    skyMid: '#191a1e',
    horizon: '#3b2a20',
    floorTop: '#120f0d',
    floorBottom: '#070708',
    key: ['rgba(224, 160, 99, 0.95)', 'rgba(176, 107, 69, 0.28)'],
    overhead: ['rgba(239, 233, 222, 0.7)', 'rgba(217, 201, 168, 0.16)'],
    bounce: 'rgba(74, 127, 104, 0.34)',
  },
  /**
   * The light studio is genuinely bright — a white cyclorama with a warm
   * floor bounce. Dark sculptural objects then read as objects in a gallery
   * rather than as silhouettes that have lost their material.
   */
  light: {
    skyTop: '#ffffff',
    skyMid: '#f4f0e8',
    horizon: '#e8dcc8',
    floorTop: '#d9d1c2',
    floorBottom: '#b8b0a1',
    key: ['rgba(255, 236, 208, 1)', 'rgba(226, 190, 150, 0.42)'],
    overhead: ['rgba(255, 255, 255, 0.96)', 'rgba(244, 238, 226, 0.4)'],
    bounce: 'rgba(150, 186, 168, 0.3)',
  },
};

function paint(theme: EnvironmentTheme): HTMLCanvasElement {
  const palette = PALETTES[theme];
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');

  // Sky to floor, with the horizon warm.
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, palette.skyTop);
  sky.addColorStop(0.34, palette.skyMid);
  sky.addColorStop(0.48, palette.horizon);
  sky.addColorStop(0.52, palette.floorTop);
  sky.addColorStop(1, palette.floorBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // The key: a warm source low on the left, where the chapter recipes put it.
  const key = ctx.createRadialGradient(
    WIDTH * 0.22,
    HEIGHT * 0.46,
    0,
    WIDTH * 0.22,
    HEIGHT * 0.46,
    WIDTH * 0.3,
  );
  key.addColorStop(0, palette.key[0]);
  key.addColorStop(0.45, palette.key[1]);
  key.addColorStop(1, 'rgba(176, 107, 69, 0)');
  ctx.fillStyle = key;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Overhead softbox — a broad, soft band across the top of the sphere.
  const overhead = ctx.createRadialGradient(
    WIDTH * 0.62,
    HEIGHT * 0.1,
    0,
    WIDTH * 0.62,
    HEIGHT * 0.1,
    WIDTH * 0.34,
  );
  overhead.addColorStop(0, palette.overhead[0]);
  overhead.addColorStop(0.5, palette.overhead[1]);
  overhead.addColorStop(1, 'rgba(217, 201, 168, 0)');
  ctx.fillStyle = overhead;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // A cool bounce opposite the key, so edges facing away are not dead.
  const bounce = ctx.createRadialGradient(
    WIDTH * 0.86,
    HEIGHT * 0.56,
    0,
    WIDTH * 0.86,
    HEIGHT * 0.56,
    WIDTH * 0.24,
  );
  bounce.addColorStop(0, palette.bounce);
  bounce.addColorStop(1, 'rgba(74, 127, 104, 0)');
  ctx.fillStyle = bounce;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  return canvas;
}

/** Build each theme's environment once and keep it for the session. */
export function getEnvironmentMap(renderer: WebGLRenderer, theme: EnvironmentTheme): Texture {
  const existing = cache.get(theme);
  if (existing) return existing;

  const source = new CanvasTexture(paint(theme));
  source.mapping = EquirectangularReflectionMapping;
  source.colorSpace = SRGBColorSpace;

  const pmrem = new PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const target = pmrem.fromEquirectangular(source);

  source.dispose();
  pmrem.dispose();

  cache.set(theme, target.texture);
  return target.texture;
}

export function disposeEnvironmentMap(): void {
  cache.forEach((texture) => texture.dispose());
  cache.clear();
}
