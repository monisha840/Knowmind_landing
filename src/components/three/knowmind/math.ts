/**
 * Tiny interpolation kit shared by every part of the KnowMind character.
 *
 * All of it is frame-rate independent where it needs to be — the character is
 * driven from a scroll ref, and a visitor flicking through the section on a
 * 120 Hz phone must land in the same place as one crawling on a 30 Hz laptop.
 */

export const clamp = (v: number, min: number, max: number): number =>
  v < min ? min : v > max ? max : v;

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Hermite ease between two edges. The workhorse of every transition here. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const span = edge1 - edge0;
  const t = clamp01(span === 0 ? (x < edge0 ? 0 : 1) : (x - edge0) / span);
  return t * t * (3 - 2 * t);
}

/** Ken Perlin's C2 variant — no visible acceleration kink at the edges. */
export function smootherstep(edge0: number, edge1: number, x: number): number {
  const span = edge1 - edge0;
  const t = clamp01(span === 0 ? (x < edge0 ? 0 : 1) : (x - edge0) / span);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Exponential smoothing that behaves identically at any frame rate.
 * `lambda` is roughly "how many e-folds per second" — 6 is a brisk settle,
 * 2 is a long calm drift.
 */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

/* -------------------------------------------------------------------------- */
/*  Deterministic pseudo-noise                                                 */
/* -------------------------------------------------------------------------- */
/*  Seeded and stable across reloads so the tangle is *this* tangle, always —  */
/*  and cheap enough to call a few thousand times a frame without noticing.    */

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

/** Smooth 1D value noise in 0..1. */
export function noise1(x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash(i), hash(i + 1), u);
}

/** Same, signed to -1..1. */
export const snoise1 = (x: number): number => noise1(x) * 2 - 1;

/* -------------------------------------------------------------------------- */
/*  Curves                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Uniform Catmull-Rom (tension one half) evaluated straight off a flat xyz
 * array, writing into another one. No objects, no allocation — it is called a
 * few hundred times a frame.
 *
 * Lives here rather than beside the tube so the flat SVG fallback can trace
 * exactly the same curves without pulling three.js into the initial bundle.
 */
export function sampleSpline(
  pts: Float32Array,
  count: number,
  u: number,
  out: Float32Array,
  o: number,
): void {
  const idx = u * (count - 1);
  let i1 = Math.floor(idx);
  if (i1 > count - 2) i1 = count - 2;
  if (i1 < 0) i1 = 0;
  const f = idx - i1;
  const i0 = i1 > 0 ? i1 - 1 : 0;
  const i2 = i1 + 1;
  const i3 = i2 < count - 1 ? i2 + 1 : count - 1;

  const f2 = f * f;
  const f3 = f2 * f;

  for (let c = 0; c < 3; c += 1) {
    const p0 = pts[i0 * 3 + c];
    const p1 = pts[i1 * 3 + c];
    const p2 = pts[i2 * 3 + c];
    const p3 = pts[i3 * 3 + c];
    out[o + c] =
      0.5 *
      (2 * p1 +
        (-p0 + p2) * f +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * f2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * f3);
  }
}
