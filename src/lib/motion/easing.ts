/** Shared easing curves — the motion signature of the whole site. */
export const easing = {
  /** Long cinematic settle. Matches --e-out in CSS. */
  out: [0.16, 1, 0.3, 1],
  inOut: [0.76, 0, 0.24, 1],
  drift: [0.33, 1, 0.68, 1],
  snap: [0.2, 0.9, 0.2, 1],
} as const;

export type EasingTuple = readonly [number, number, number, number];

export function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** 0 at both ends, 1 in the middle — the shape of a scene presence envelope. */
export function envelope(t: number, shoulder = 0.22): number {
  if (t <= 0 || t >= 1) return 0;
  if (t < shoulder) return easeOutExpo(t / shoulder);
  if (t > 1 - shoulder) return easeOutExpo((1 - t) / shoulder);
  return 1;
}

/** Bell curve peaking at `center`, used for one-off cinematic beats. */
export function pulse(t: number, center: number, width: number): number {
  const d = (t - center) / width;
  return Math.exp(-d * d * 4);
}
