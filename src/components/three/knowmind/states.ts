/**
 * The three states of one thread.
 *
 * There is a single strand. It is described by the same number of control
 * points in every state, generated from the same parameter `t`, so morphing is
 * a straight per-point interpolation — the loop you are watching in the tangle
 * is the loop that ends up in the halo. Nothing is cut and replaced.
 */

import { BODY, PALETTE } from "./constants";
import { lerp, noise1, snoise1 } from "./math";

const TAU = Math.PI * 2;

export type StateKind = 0 | 1 | 2; // CHAOS | FLOW | CLARITY

/* -------------------------------------------------------------------------- */
/*  Thread control points                                                      */
/* -------------------------------------------------------------------------- */

/**
 * CHAOS — a dense, restless nest around the character.
 *
 * The winding rate is pushed around by low-frequency noise, the radius swings
 * between a tight curl and a wide sweep, and — the part that actually makes it
 * a tangle rather than a spring — the centre each loop turns about drifts as
 * the strand travels. Loops that share a centre nest; loops that do not cross
 * each other.
 */
function chaosPoint(t: number, out: Float32Array, o: number): void {
  const a = t * TAU * 8.2 + snoise1(t * 3.1 + 11.3) * 3.4 + snoise1(t * 7.9 + 2.2) * 0.9;
  const r = 0.24 + 0.8 * noise1(t * 5.3 + 2.1);
  const wanderX = snoise1(t * 2.1 + 3.3) * 0.58;
  const wanderY = snoise1(t * 1.9 + 8.8) * 0.58;
  const depth = 0.55 + 0.45 * noise1(t * 3.3 + 6.6);

  out[o] = wanderX + Math.cos(a) * r;
  out[o + 1] = wanderY + Math.sin(a) * r * 0.96 + BODY.y;
  out[o + 2] = (Math.sin(t * TAU * 3.1 + 1.1) * 0.6 + snoise1(t * 6.2 + 5.5) * 0.46) * depth;
}

/**
 * FLOW — the same strand, wound down to a few wide loops.
 *
 * Still loops in the picture plane, so the eye can follow one strand all the
 * way round, but they now drift slowly through depth instead of scattering.
 * Fewer crossings, far more negative space, still visibly in motion.
 */
function flowPoint(t: number, out: Float32Array, o: number): void {
  const a = t * TAU * 3.7 + snoise1(t * 2.0 + 3.1) * 0.44;
  const r = 0.8 + 0.4 * noise1(t * 2.6 + 4.4);
  // The same wander as the tangle, damped almost out of existence — enough to
  // keep the loops from stacking into a target, not enough to read as chaos.
  const wanderX = snoise1(t * 1.5 + 3.3) * 0.2;
  const wanderY = snoise1(t * 1.4 + 8.8) * 0.2;

  out[o] = wanderX + Math.cos(a) * r;
  out[o + 1] = wanderY + Math.sin(a) * r * 0.94 + BODY.y;
  out[o + 2] = Math.sin(t * TAU * 1.35 + 0.6) * 0.38 + snoise1(t * 2.4 + 7.1) * 0.11;
}

/**
 * CLARITY — one elegant loop, tilted just enough to stay three-dimensional.
 *
 * The two ends of the thread come round to almost meet at the bottom. They do
 * not quite touch, and they pass on either side of each other: the ring is
 * closed enough to read as whole, honest enough to admit it is still a thread.
 */
const TILT_X = 0.2;
const TILT_Y = 0.16;
function clarityPoint(t: number, out: Float32Array, o: number): void {
  const a = t * TAU * 0.978 - Math.PI * 0.5;
  const r = 1.09 + 0.02 * Math.sin(t * TAU * 3 + 0.6);

  let x = Math.cos(a) * r;
  const y0 = Math.sin(a) * r * 0.99;
  // Ends drift apart in z so they cross cleanly rather than fight for pixels.
  let z = Math.sin(a * 2) * 0.07 + (t - 0.5) * 0.13;

  // Tilt about x, then y — a halo seen slightly from above and the side.
  const cx = Math.cos(TILT_X);
  const sx = Math.sin(TILT_X);
  const y1 = y0 * cx - z * sx;
  const z1 = y0 * sx + z * cx;
  const cy = Math.cos(TILT_Y);
  const sy = Math.sin(TILT_Y);
  const x1 = x * cy + z1 * sy;
  z = -x * sy + z1 * cy;
  x = x1;

  out[o] = x;
  out[o + 1] = y1 + BODY.y;
  out[o + 2] = z;
}

const GENERATORS = [chaosPoint, flowPoint, clarityPoint] as const;

/**
 * Nudge a generated state so its bounding box sits centred on the body.
 *
 * The noise that makes the tangle irregular is not zero-mean over any finite
 * sample, so an untouched tangle drifts off to one side — which reads as a
 * mistake rather than as chaos. Applied once, at build time, so the three
 * states stay in register with each other and with the character.
 */
function recentre(points: Float32Array): void {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (let i = 0; i < points.length; i += 3) {
    if (points[i] < minX) minX = points[i];
    if (points[i] > maxX) maxX = points[i];
    if (points[i + 1] < minY) minY = points[i + 1];
    if (points[i + 1] > maxY) maxY = points[i + 1];
    if (points[i + 2] < minZ) minZ = points[i + 2];
    if (points[i + 2] > maxZ) maxZ = points[i + 2];
  }

  const dx = (minX + maxX) / 2;
  const dy = (minY + maxY) / 2 - BODY.y;
  const dz = (minZ + maxZ) / 2;

  for (let i = 0; i < points.length; i += 3) {
    points[i] -= dx;
    points[i + 1] -= dy;
    points[i + 2] -= dz;
  }
}

/** `count` control points for one state, as a flat xyz array. */
export function buildThreadPoints(kind: StateKind, count: number): Float32Array {
  const out = new Float32Array(count * 3);
  const gen = GENERATORS[kind];
  for (let i = 0; i < count; i += 1) {
    gen(i / (count - 1), out, i * 3);
  }
  recentre(out);
  return out;
}

/* -------------------------------------------------------------------------- */
/*  Blending                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Blend the three point sets into `out` at a continuous stage in 0..2.
 *
 * `restless` adds a per-point wander whose amplitude the caller ties to how
 * tangled the strand currently is — the knot fidgets, the halo barely breathes.
 * It is applied here so the movement travels *along* the thread instead of
 * shaking the whole mesh.
 */
export function blendThread(
  out: Float32Array,
  chaos: Float32Array,
  flow: Float32Array,
  clarity: Float32Array,
  stage: number,
  time: number,
  restless: number,
): void {
  const second = stage > 1;
  const a = second ? flow : chaos;
  const b = second ? clarity : flow;
  const t = second ? stage - 1 : stage;

  for (let i = 0; i < out.length; i += 3) {
    let x = lerp(a[i], b[i], t);
    let y = lerp(a[i + 1], b[i + 1], t);
    let z = lerp(a[i + 2], b[i + 2], t);

    if (restless > 0) {
      const p = i * 0.37;
      x += Math.sin(time * 0.9 + p) * restless;
      y += Math.sin(time * 0.73 + p * 1.7 + 2.1) * restless;
      z += Math.sin(time * 1.11 + p * 0.9 + 4.2) * restless;
    }

    out[i] = x;
    out[i + 1] = y;
    out[i + 2] = z;
  }
}

/* -------------------------------------------------------------------------- */
/*  Material + motion configuration per state                                  */
/* -------------------------------------------------------------------------- */

export type StateVisual = {
  thread: string;
  threadRadius: number;
  threadEmissive: number;
  head: string;
  headEmissive: number;
  headRoughness: number;
  limb: string;
  /** Amplitude / speed of the thread's own restlessness. */
  restless: number;
  restlessSpeed: number;
  /** Slow sway of the whole character, in radians. */
  spin: number;
  cameraZ: number;
  /** Eye and smile presence, 0..1. */
  eyes: number;
  smile: number;
  /** Arm pivot angle — drooping, neutral, open. */
  arm: number;
  motes: number;
};

export const STATE_VISUALS: readonly [StateVisual, StateVisual, StateVisual] = [
  {
    // CHAOS — something is happening inside me.
    thread: PALETTE.purpleLift,
    threadRadius: 0.024,
    threadEmissive: 0,
    head: PALETTE.wineDeep,
    headEmissive: 0,
    headRoughness: 0.78,
    limb: PALETTE.purpleDeep,
    restless: 0.05,
    restlessSpeed: 1.0,
    spin: 0.13,
    cameraZ: 6.75,
    eyes: 0,
    smile: 0,
    arm: -0.5,
    motes: 1,
  },
  {
    // FLOW — I am beginning to understand my patterns.
    thread: PALETTE.wineLift,
    threadRadius: 0.028,
    threadEmissive: 0,
    head: PALETTE.wineLift,
    headEmissive: 0,
    headRoughness: 0.72,
    limb: PALETTE.wineMid,
    restless: 0.021,
    restlessSpeed: 0.62,
    spin: 0.075,
    cameraZ: 7.1,
    eyes: 0.32,
    smile: 0,
    arm: -0.2,
    motes: 0.72,
  },
  {
    // CLARITY — I don't need to be perfect. I know how to return.
    thread: PALETTE.wineLift2,
    threadRadius: 0.032,
    threadEmissive: 0,
    head: PALETTE.honey,
    headEmissive: 0.17,
    headRoughness: 0.66,
    limb: PALETTE.wineViolet,
    restless: 0.007,
    restlessSpeed: 0.26,
    spin: 0.035,
    cameraZ: 7.45,
    eyes: 1,
    smile: 1,
    arm: 0.13,
    motes: 0.38,
  },
];

/** The fields of `StateVisual` that interpolate. Colours are handled by hand. */
type NumericKey =
  | "threadRadius"
  | "threadEmissive"
  | "headEmissive"
  | "headRoughness"
  | "restless"
  | "restlessSpeed"
  | "spin"
  | "cameraZ"
  | "eyes"
  | "smile"
  | "arm"
  | "motes";

/** Read any numeric field of `STATE_VISUALS` at a continuous stage in 0..2. */
export function visualAt(key: NumericKey, stage: number): number {
  const second = stage > 1;
  const a = STATE_VISUALS[second ? 1 : 0][key];
  const b = STATE_VISUALS[second ? 2 : 1][key];
  return lerp(a, b, second ? stage - 1 : stage);
}
