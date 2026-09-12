import { ExtrudeGeometry, Shape, type BufferGeometry } from 'three';

/**
 * Extruded silhouettes.
 *
 * A garment drawn as a flat plane reads as a card; drawn as an outline with a
 * bevelled edge it reads as an object hanging in space. These build the two
 * silhouettes the world needs, once, and hand back geometry the scenes can
 * share across instances.
 */

interface ExtrudeOptions {
  readonly depth?: number;
  readonly bevel?: number;
  readonly steps?: number;
}

function extrude(shape: Shape, options: ExtrudeOptions = {}): BufferGeometry {
  const bevel = options.bevel ?? 0.012;
  const geometry = new ExtrudeGeometry(shape, {
    depth: options.depth ?? 0.03,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 10,
    steps: options.steps ?? 1,
  });
  geometry.center();
  return geometry;
}

/** A shirt: shoulders, sleeves, a waist that tapers slightly. */
export function shirtGeometry(): BufferGeometry {
  const shape = new Shape();
  shape.moveTo(-0.2, 0.42);
  shape.lineTo(-0.08, 0.5);
  shape.quadraticCurveTo(0, 0.44, 0.08, 0.5);
  shape.lineTo(0.2, 0.42);
  shape.lineTo(0.42, 0.26);
  shape.lineTo(0.34, 0.08);
  shape.lineTo(0.24, 0.16);
  shape.lineTo(0.22, -0.5);
  shape.lineTo(-0.22, -0.5);
  shape.lineTo(-0.24, 0.16);
  shape.lineTo(-0.34, 0.08);
  shape.lineTo(-0.42, 0.26);
  shape.closePath();
  return extrude(shape, { depth: 0.026 });
}

/** A dress: narrow shoulders falling into a flared hem. */
export function dressGeometry(): BufferGeometry {
  const shape = new Shape();
  shape.moveTo(-0.16, 0.46);
  shape.quadraticCurveTo(0, 0.38, 0.16, 0.46);
  shape.lineTo(0.2, 0.2);
  shape.quadraticCurveTo(0.14, 0.02, 0.16, -0.12);
  shape.lineTo(0.34, -0.52);
  shape.lineTo(-0.34, -0.52);
  shape.lineTo(-0.16, -0.12);
  shape.quadraticCurveTo(-0.14, 0.02, -0.2, 0.2);
  shape.closePath();
  return extrude(shape, { depth: 0.026 });
}

/** A coat: square shoulders, a long straight fall, a centre break. */
export function coatGeometry(): BufferGeometry {
  const shape = new Shape();
  shape.moveTo(-0.24, 0.48);
  shape.lineTo(0.24, 0.48);
  shape.lineTo(0.44, 0.3);
  shape.lineTo(0.36, -0.04);
  shape.lineTo(0.3, 0.06);
  shape.lineTo(0.28, -0.56);
  shape.lineTo(-0.28, -0.56);
  shape.lineTo(-0.3, 0.06);
  shape.lineTo(-0.36, -0.04);
  shape.lineTo(-0.44, 0.3);
  shape.closePath();
  return extrude(shape, { depth: 0.03 });
}

/**
 * A credential slab: a rounded rectangle with a machined bevel.
 *
 * The bevel is what sells it as milled metal — a flat box has no edge for the
 * key light to catch, so it reads as a dark rectangle no matter how it is lit.
 */
export function slabGeometry(width = 1.5, height = 2.05, radius = 0.08): BufferGeometry {
  const shape = new Shape();
  const w = width / 2;
  const h = height / 2;

  shape.moveTo(-w + radius, -h);
  shape.lineTo(w - radius, -h);
  shape.quadraticCurveTo(w, -h, w, -h + radius);
  shape.lineTo(w, h - radius);
  shape.quadraticCurveTo(w, h, w - radius, h);
  shape.lineTo(-w + radius, h);
  shape.quadraticCurveTo(-w, h, -w, h - radius);
  shape.lineTo(-w, -h + radius);
  shape.quadraticCurveTo(-w, -h, -w + radius, -h);

  return extrude(shape, { depth: 0.05, bevel: 0.018 });
}
