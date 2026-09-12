export function clamp(value: number, min = 0, max = 1): number {
  return value < min ? min : value > max ? max : value;
}

/** Remap a value from one range to another, clamped to the output range. */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin = 0,
  outMax = 1,
): number {
  if (inMax === inMin) return outMin;
  const t = clamp((value - inMin) / (inMax - inMin));
  return outMin + (outMax - outMin) * t;
}

/** Smooth 0..1 ramp with eased shoulders. */
export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}
