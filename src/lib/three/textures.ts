import { CanvasTexture, SRGBColorSpace, type Texture } from 'three';

/**
 * Every texture in the world is generated at runtime on a canvas.
 * No binary assets, no licences to honour, nothing to download.
 */

const cache = new Map<string, Texture>();

function memo(key: string, build: () => Texture): Texture {
  const existing = cache.get(key);
  if (existing) return existing;
  const texture = build();
  cache.set(key, texture);
  return texture;
}

function canvasOf(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  return { canvas, ctx };
}

/** Soft round falloff — the particle sprite used across the whole site. */
export function softSprite(size = 128): Texture {
  return memo(`soft-${size}`, () => {
    const { canvas, ctx } = canvasOf(size);
    const r = size / 2;
    const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.18, 'rgba(255,255,255,0.72)');
    gradient.addColorStop(0.48, 'rgba(255,255,255,0.16)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  });
}

/** Vertical light shaft gradient — volumetric suggestion without raymarching. */
export function shaftGradient(size = 256): Texture {
  return memo(`shaft-${size}`, () => {
    const { canvas, ctx } = canvasOf(size);
    // Fade at both ends: a hard edge at the top of the plane reads as a slab
    // rather than as light falling through a space.
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.16, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(0.52, 'rgba(255,255,255,0.14)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Fade the vertical edges so the plane never reads as a rectangle.
    const mask = ctx.createLinearGradient(0, 0, size, 0);
    mask.addColorStop(0, 'rgba(0,0,0,1)');
    mask.addColorStop(0.26, 'rgba(0,0,0,0.25)');
    mask.addColorStop(0.5, 'rgba(0,0,0,0)');
    mask.addColorStop(0.74, 'rgba(0,0,0,0.25)');
    mask.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, size, size);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  });
}

/** Faint scanline grid for technical surfaces (dashboards, panels, vault walls). */
export function gridTexture(size = 512, step = 32): Texture {
  return memo(`grid-${size}-${step}`, () => {
    const { canvas, ctx } = canvasOf(size);
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(239,233,222,0.14)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= size; i += step) {
      ctx.beginPath();
      ctx.moveTo(i + 0.5, 0);
      ctx.lineTo(i + 0.5, size);
      ctx.moveTo(0, i + 0.5);
      ctx.lineTo(size, i + 0.5);
      ctx.stroke();
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  });
}

/** Release every generated texture. Called when the world unmounts. */
export function disposeTextures(): void {
  cache.forEach((texture) => texture.dispose());
  cache.clear();
}
