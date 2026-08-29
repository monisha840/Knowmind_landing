/**
 * The thread inside the skull, in its three states.
 *
 * All three come out of a single parametric family — an Archimedean spiral,
 * progressively disordered. `disorder = 0` is a clean spiral; `disorder = 1`
 * buries that spiral under noise on its winding rate, its radius and the
 * position of its own centre, which is what a tangle actually is: order that
 * has lost track of itself.
 *
 * Generating all three from one family is what makes the morph work. Point `t`
 * in the tangle and point `t` in the spiral are the *same* point at different
 * degrees of disorder, so interpolating between them combs the knot out along
 * its own length rather than dissolving one shape into another.
 */

import { CAVITY } from "./constants";
import { lerp, noise1, snoise1 } from "./math";

const TAU = Math.PI * 2;

export type StateKind = 0 | 1 | 2; // TANGLED | UNRAVELING | CLEAR

/** How disordered each state is. */
const DISORDER = [1, 0.42, 0] as const;

/**
 * The two modes the family blends between.
 *
 * ORDER is an Archimedean spiral: one centre, a radius that grows steadily,
 * three and a bit turns.
 *
 * CHAOS is a smooth random walk — a few octaves of noise driving x and y
 * directly. That is what a dropped length of thread actually is, and it is the
 * only formulation that tangles. Anything written in polar coordinates winds
 * its angle in one direction and therefore lays down loop inside loop; noise on
 * such a spiral makes wobbly rings, never a knot. A walk changes direction, so
 * it has to cross what it already laid down, and it fills the middle of the
 * skull instead of hugging the inside of it.
 */
const ORDER = { turns: 3.3, radiusFrom: 0.07, radiusTo: 1.0 } as const;

/**
 * Frequencies and weights of the walk.
 *
 * Weighted toward the middle octaves on purpose. A walk dominated by its
 * lowest frequency takes long sweeping excursions and comes out as a loop with
 * a tail; spreading the energy across four closer octaves keeps the strand in
 * one place and makes it wander *within* that place, which is what a knot is.
 */
const WALK = [
  { f: 5.5, a: 0.3 },
  { f: 11.0, a: 0.34 },
  { f: 21.0, a: 0.26 },
  { f: 34.0, a: 0.14 },
] as const;

function walk(t: number, seed: number): number {
  let sum = 0;
  for (let i = 0; i < WALK.length; i += 1) {
    sum += snoise1(t * WALK[i].f + seed * (i + 1) * 1.7 + i * 4.3) * WALK[i].a;
  }
  return sum;
}

/* -------------------------------------------------------------------------- */
/*  Containment                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Compress a point softly back inside the cranial ellipse.
 *
 * Not a clamp — a clamp would flatten every stray loop against the same arc
 * and draw a visible hard edge around the tangle. This lets a strand bulge a
 * little past the boundary, less and less the further it tries to go, so the
 * knot presses against the inside of the skull instead of being cut by it.
 */
function contain(x: number, y: number, out: Float32Array, o: number): void {
  const dx = (x - CAVITY.x) / CAVITY.rx;
  const dy = (y - CAVITY.y) / CAVITY.ry;
  const d = Math.hypot(dx, dy);

  if (d <= 1) {
    out[o] = x;
    out[o + 1] = y;
    return;
  }

  const target = 1 + (CAVITY.overflow - 1) * (1 - Math.exp(-(d - 1) * 1.8));
  const k = target / d;
  out[o] = CAVITY.x + (x - CAVITY.x) * k;
  out[o + 1] = CAVITY.y + (y - CAVITY.y) * k;
}

/* -------------------------------------------------------------------------- */
/*  The family                                                                 */
/* -------------------------------------------------------------------------- */

function threadPoint(t: number, disorder: number, out: Float32Array, o: number): void {
  // Raw — containment and recentring are applied once the whole strand exists.

  const angle = t * TAU * ORDER.turns;
  const radius = ORDER.radiusFrom + (ORDER.radiusTo - ORDER.radiusFrom) * t;

  out[o] = CAVITY.x + lerp(Math.cos(angle) * radius, walk(t, 3.3), disorder) * CAVITY.rx;
  out[o + 1] = CAVITY.y + lerp(Math.sin(angle) * radius, walk(t, 8.8), disorder) * CAVITY.ry;

  // Depth. Ordered, the spiral lies almost flat, just proud of the skull, with
  // the gentlest forward drift as it winds outward. Disordered, it dives in and
  // out through the head's surface, and the strands that go behind are properly
  // hidden by it.
  out[o + 2] =
    lerp(CAVITY.zClear, CAVITY.zChaos, disorder) +
    (Math.sin(t * TAU * 2.2 + 1.1) * 0.3 + snoise1(t * 6.2 + 5.5) * 0.62) *
      CAVITY.zDepth *
      disorder +
    (t - 0.5) * 0.1 * (1 - disorder);
}

/**
 * `count` control points for one state, as a flat xyz array.
 *
 * The strand is generated, then recentred, then contained — in that order.
 * Recentring matters: value noise is not zero-mean over any finite sample, so
 * an untouched tangle drifts off to one side of the skull and sits further
 * forward than intended. Fixing that before containment means the compression
 * is symmetric rather than shaving one side of the knot flat.
 */
export function buildThreadPoints(kind: StateKind, count: number): Float32Array {
  const out = new Float32Array(count * 3);
  const disorder = DISORDER[kind];

  for (let i = 0; i < count; i += 1) {
    threadPoint(i / (count - 1), disorder, out, i * 3);
  }

  // Centred on the strand's mass, not on its bounding box: a walk usually has
  // one end reaching further than the rest, and centring the box around it
  // pushes the body of the knot off to the opposite side of the skull.
  let sumX = 0;
  let sumY0 = 0;
  let sumZ = 0;
  for (let i = 0; i < out.length; i += 3) {
    sumX += out[i];
    sumY0 += out[i + 1];
    sumZ += out[i + 2];
  }

  const dx = CAVITY.x - sumX / count;
  const dy = CAVITY.y - sumY0 / count;
  const dz = lerp(CAVITY.zClear, CAVITY.zChaos, disorder) - sumZ / count;

  // Then scaled to fill the skull. Summed octaves of noise reach nowhere near
  // the sum of their amplitudes, so a walk left as generated occupies the
  // middle third of the cavity and reads as a small knot floating in a large
  // empty head. Normalising is also what keeps the three states the same size
  // as each other, which matters more here than any absolute figure.
  // Each axis is fitted separately, and fitted on the spread of the whole
  // strand rather than on its furthest point. A walk is rarely as wide as it is
  // tall, and one stray end reaching for the skull would otherwise decide the
  // scale for everything else and shrink the knot away from the sides. The soft
  // containment above catches whatever this lets past.
  let spreadX = 0;
  let spreadY = 0;
  for (let i = 0; i < out.length; i += 3) {
    const u = (out[i] + dx - CAVITY.x) / CAVITY.rx;
    const v = (out[i + 1] + dy - CAVITY.y) / CAVITY.ry;
    spreadX += u * u;
    spreadY += v * v;
  }
  const rmsX = Math.sqrt(spreadX / count);
  const rmsY = Math.sqrt(spreadY / count);
  const fillX = rmsX > 0.01 ? CAVITY.fill / rmsX : 1;
  const fillY = rmsY > 0.01 ? CAVITY.fill / rmsY : 1;

  for (let i = 0; i < out.length; i += 3) {
    out[i + 2] += dz;
    contain(
      CAVITY.x + (out[i] + dx - CAVITY.x) * fillX,
      CAVITY.y + (out[i + 1] + dy - CAVITY.y) * fillY,
      out,
      i,
    );
  }

  return out;
}

/* -------------------------------------------------------------------------- */
/*  Blending                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Blend the three point sets into `out` at a continuous stage in 0..2.
 *
 * `restless` adds a per-point wander whose amplitude the caller ties to how
 * tangled the strand currently is — the knot fidgets, the spiral barely
 * breathes. Applied here so the movement travels *along* the thread rather
 * than shaking the whole mesh.
 */
export function blendThread(
  out: Float32Array,
  tangled: Float32Array,
  unraveling: Float32Array,
  clear: Float32Array,
  stage: number,
  time: number,
  restless: number,
): void {
  const second = stage > 1;
  const a = second ? unraveling : tangled;
  const b = second ? clear : unraveling;
  const t = second ? stage - 1 : stage;

  for (let i = 0; i < out.length; i += 3) {
    let x = lerp(a[i], b[i], t);
    let y = lerp(a[i + 1], b[i + 1], t);
    let z = lerp(a[i + 2], b[i + 2], t);

    if (restless > 0) {
      const p = i * 0.37;
      x += Math.sin(time * 0.9 + p) * restless;
      y += Math.sin(time * 0.73 + p * 1.7 + 2.1) * restless;
      z += Math.sin(time * 1.11 + p * 0.9 + 4.2) * restless * 1.4;
    }

    out[i] = x;
    out[i + 1] = y;
    out[i + 2] = z;
  }
}

/* -------------------------------------------------------------------------- */
/*  Per-state look and motion                                                  */
/* -------------------------------------------------------------------------- */

export type StateVisual = {
  threadRadius: number;
  /** Amplitude and speed of the strand's own restlessness. */
  restless: number;
  restlessSpeed: number;
  /** How much the head itself drifts — chaos is never quite still. */
  unrest: number;
};

export const STATE_VISUALS: readonly [StateVisual, StateVisual, StateVisual] = [
  {
    // 01 TANGLED — mental clutter.
    threadRadius: 0.0165,
    restless: 0.0105,
    restlessSpeed: 1.0,
    unrest: 1,
  },
  {
    // 02 UNRAVELING — awareness, reflection. The chaos being organised.
    threadRadius: 0.0185,
    restless: 0.0048,
    restlessSpeed: 0.58,
    unrest: 0.55,
  },
  {
    // 03 CLEAR — clarity. 1% better.
    threadRadius: 0.021,
    restless: 0.0016,
    restlessSpeed: 0.24,
    unrest: 0.2,
  },
];

/** Read any numeric field of `STATE_VISUALS` at a continuous stage in 0..2. */
export function visualAt(key: keyof StateVisual, stage: number): number {
  const second = stage > 1;
  const a = STATE_VISUALS[second ? 1 : 0][key];
  const b = STATE_VISUALS[second ? 2 : 1][key];
  return lerp(a, b, second ? stage - 1 : stage);
}

/** Deterministic noise re-exported so the flat fallback can trace the same curves. */
export { noise1, snoise1 };
