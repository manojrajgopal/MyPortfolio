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

let cached: Texture | null = null;

function paint(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');

  // Sky to floor, with the horizon warm.
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, '#2a2b30');
  sky.addColorStop(0.34, '#191a1e');
  sky.addColorStop(0.48, '#3b2a20');
  sky.addColorStop(0.52, '#120f0d');
  sky.addColorStop(1, '#070708');
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
  key.addColorStop(0, 'rgba(224, 160, 99, 0.95)');
  key.addColorStop(0.45, 'rgba(176, 107, 69, 0.28)');
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
  overhead.addColorStop(0, 'rgba(239, 233, 222, 0.7)');
  overhead.addColorStop(0.5, 'rgba(217, 201, 168, 0.16)');
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
  bounce.addColorStop(0, 'rgba(74, 127, 104, 0.34)');
  bounce.addColorStop(1, 'rgba(74, 127, 104, 0)');
  ctx.fillStyle = bounce;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  return canvas;
}

/** Build the environment once per renderer and keep it for the session. */
export function getEnvironmentMap(renderer: WebGLRenderer): Texture {
  if (cached) return cached;

  const source = new CanvasTexture(paint());
  source.mapping = EquirectangularReflectionMapping;
  source.colorSpace = SRGBColorSpace;

  const pmrem = new PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const target = pmrem.fromEquirectangular(source);

  source.dispose();
  pmrem.dispose();

  cached = target.texture;
  return cached;
}

export function disposeEnvironmentMap(): void {
  cached?.dispose();
  cached = null;
}
