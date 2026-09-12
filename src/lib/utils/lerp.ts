export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Frame-rate independent smoothing.
 * `smoothing` is the fraction of the remaining distance left after one second.
 */
export function damp(current: number, target: number, smoothing: number, delta: number): number {
  return lerp(current, target, 1 - Math.pow(smoothing, delta));
}
