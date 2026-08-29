/**
 * Every tunable number for the KnowMind head triptych lives here.
 *
 * Three sculptural profile heads, identical in every respect — same geometry
 * object, same material, same orientation — differing only in the state of the
 * thread inside the skull. That identity is the whole argument the visual
 * makes: the same mind, not three different people.
 *
 * Palette is the brand's four colours plus lifted members of the same two
 * families. Nothing else enters the scene; the lamps are neutral.
 */

/* -------------------------------------------------------------------------- */
/*  Palette                                                                    */
/* -------------------------------------------------------------------------- */

export const PALETTE = {
  wineViolet: "#5a2348",
  deepPurple: "#3b1c5a",
  honey: "#feb737",
  gold: "#e6b44c",
  /**
   * Lifted members of the same two families. A strand painted in the brand's
   * own wine violet sits within a few percent of the deep purple head behind
   * it and simply vanishes; these are the same hues carried up in lightness,
   * and they are the tokens the rest of the site already uses for exactly
   * this reason (`wine-400`, `wine-300`).
   */
  wineLift: "#7c3d63",
  wineLift2: "#a8709a",
  /** The head, and its shadow side. */
  headBase: "#3b1c5a",
  headDeep: "#2b1442",
} as const;

/* -------------------------------------------------------------------------- */
/*  The three states                                                           */
/* -------------------------------------------------------------------------- */

export const TANGLED = 0;
export const UNRAVELING = 1;
export const CLEAR = 2;

export const STATE_LABELS = ["Tangled", "Unraveling", "Clear"] as const;

/**
 * How far along its own journey each head has travelled, given the section's
 * scroll progress.
 *
 * The left head never moves: it is the before, and the label under it says so.
 * The middle head reorganises as far as UNRAVELING and stops there. The right
 * head goes all the way to CLEAR. They start *identical* — three tangles, the
 * same tangle — and separate as the visitor scrolls, which is the only honest
 * way to show one mind in three states rather than three different minds.
 *
 * Windows overlap on purpose, and the middle head leads the right one slightly
 * so the change reads left to right.
 */
export function headStage(index: 0 | 1 | 2, progress: number): number {
  if (index === 0) return 0;
  if (index === 1) return smooth(0.2, 0.48, progress);
  return smooth(0.25, 0.45, progress) + smooth(0.55, 0.75, progress);
}

/** Local copy so this module stays dependency-free for the fallback's sake. */
function smooth(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/** Which state the surrounding HTML should present as active. */
export function chapterAt(progress: number): 0 | 1 | 2 {
  if (progress >= 0.58) return CLEAR;
  if (progress >= 0.28) return UNRAVELING;
  return TANGLED;
}

/**
 * Where the thread's colour sits on the wine → honey path, given a head's
 * stage. Deliberately back-loaded: at UNRAVELING the strand should carry only
 * a hint of gold, not be half-way to it.
 */
export function threadWarmth(stage: number): number {
  return smooth(0.55, 1.9, stage);
}

/* -------------------------------------------------------------------------- */
/*  The head                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The profile, as a closed loop of control points running clockwise from the
 * crown, with the face looking along +x. A Catmull-Rom curve is drawn through
 * these once, at build time, and lofted into a solid.
 *
 * Landmarks rather than decoration: crown, forehead, brow ridge, nasion, nose,
 * philtrum, lips, chin, jaw, throat, nape, occiput. No eyes, no mouth opening,
 * no expression — the silhouette is the whole face.
 */
export const HEAD_PROFILE: readonly (readonly [number, number])[] = [
  [-0.04, 1.0], // crown
  [0.2, 0.96],
  [0.38, 0.82], // forehead upper
  [0.45, 0.62],
  [0.47, 0.46], // brow ridge
  [0.43, 0.38], // nasion
  [0.46, 0.3], // nose bridge
  [0.51, 0.2],
  [0.56, 0.1],
  [0.6, 0.03], // nose tip
  [0.5, -0.005], // columella
  [0.46, -0.03],
  [0.48, -0.075], // upper lip
  [0.455, -0.105], // mouth line
  [0.47, -0.135], // lower lip
  [0.42, -0.19],
  [0.44, -0.25], // chin
  [0.38, -0.32],
  [0.26, -0.38], // jaw
  [0.12, -0.43],
  [0.06, -0.55], // throat
  [0.05, -1.0], // neck, front
  [-0.3, -1.0], // neck, back
  [-0.32, -0.72],
  [-0.34, -0.52], // nape
  [-0.44, -0.34],
  [-0.52, -0.1], // occiput
  [-0.54, 0.16],
  [-0.52, 0.44],
  [-0.44, 0.72],
  [-0.26, 0.94],
] as const;

export const HEAD = {
  /** Half the head's width, across the profile plane. */
  halfWidth: 0.33,
  /**
   * Cross-section falloff. 1 would be a diamond, a large number a slab; 2.5
   * gives the full, softly rounded section a skull actually has.
   */
  sectionExponent: 2.5,
  /** How far the outline also shortens toward the sides. */
  verticalShrink: 0.22,
  /**
   * The neck is narrower than the skull. Without this the form reads as a slab
   * with a head on top; the taper runs between these two heights.
   */
  neckTaperFrom: -0.25,
  neckTaperTo: -0.7,
  neckWidth: 0.58,
  /** The axis each cross-section shrinks toward. */
  axisX: -0.02,
  axisY: 0.3,
  /** Height of the whole form, crown to neck base, used for framing. */
  height: 2.0,
  /** Widest span front to back. */
  depth: 1.14,
  /** Middle of that box — the point the form is centred on and leans about. */
  pivotX: 0.03,
  pivotY: 0.0,
} as const;

/**
 * The cranial cavity the thread lives in — an ellipse in the profile plane,
 * sitting where a skull is hollow. Every generated thread point is softly
 * compressed back inside it, so no amount of noise can push a strand out
 * through the forehead.
 */
export const CAVITY = {
  x: -0.04,
  y: 0.46,
  rx: 0.3,
  ry: 0.26,
  /** How far past the ellipse a strand may bulge, asymptotically. */
  overflow: 1.18,
  /**
   * Target spread of each state across the cavity, as a root-mean-square in
   * normalised units. Every state is fitted to it, which is what keeps the
   * tangle, the loosening and the spiral the same size as each other.
   */
  fill: 0.47,
  /**
   * How far forward the strand sits. The head's front surface across the
   * cranium sits at very nearly `HEAD.halfWidth`, so a tangle centred behind
   * that dives in and out through the skull and is properly occluded where it
   * goes behind — which is what makes it read as being *in* the head rather
   * than drawn on it. The clear spiral sits a little further forward, where
   * none of it is lost: by then there is nothing left to hide.
   */
  zChaos: 0.4,
  zClear: 0.43,
  zDepth: 0.3,
} as const;

/* -------------------------------------------------------------------------- */
/*  Composition                                                                */
/* -------------------------------------------------------------------------- */

export const CAMERA = { fov: 34, near: 0.1, far: 40 } as const;

export const LAYOUT = {
  /** Three columns; the heads sit on the sixths so HTML labels can align. */
  columns: 3,
  /** Fraction of a column the head may occupy. */
  columnFill: 0.78,
  /** Fraction of the canvas height the head may occupy. */
  heightFill: 0.84,
  minScale: 0.4,
  maxScale: 2.6,
  /**
   * Phones cannot read three heads at a sixth of the width each, so the row is
   * spread out and the camera tracks along it — the active head centred, its
   * neighbours held at the edges of the frame. The page never scrolls sideways;
   * the camera does.
   */
  mobileSpread: 0.66,
  mobileBreakpoint: 900,
} as const;

/* -------------------------------------------------------------------------- */
/*  Performance tiers                                                          */
/* -------------------------------------------------------------------------- */

export type Tier = "low" | "medium" | "high";

export type TierSettings = {
  /** Control points on each thread. Same count in every state, so they morph. */
  control: number;
  /** Tube segments along each thread. */
  tubular: number;
  /** Sides of the tube's cross-section. */
  radial: number;
  /** Samples around the head profile, and slices across its width. */
  headProfileSamples: number;
  headSlices: number;
  dprMax: number;
  antialias: boolean;
  /**
   * Off everywhere, and measured rather than assumed: rendering the scene twice
   * so the strand can cast onto the skull changed the frame by 0.17 of a
   * possible 765 per pixel. The key light strikes the thread at a shallow
   * enough angle that its shadow falls behind the thread itself, and the only
   * way to expose one would be a raking light that also drops the heads into
   * near-darkness. The depth cue that does work here is free: strands really do
   * pass behind the skull, and the skull really does hide them.
   *
   * The plumbing is in place — flip this and the canvas, the heads and the
   * strands all follow.
   */
  shadows: boolean;
  /** Rebuild the strands at a fixed lower rate when the CPU is the cheap part. */
  threadHz: number;
};

export const TIERS: Record<Tier, TierSettings> = {
  high: {
    control: 240,
    tubular: 560,
    radial: 6,
    headProfileSamples: 200,
    headSlices: 64,
    dprMax: 1.8,
    antialias: true,
    shadows: false,
    threadHz: 0,
  },
  medium: {
    control: 170,
    tubular: 380,
    radial: 5,
    headProfileSamples: 150,
    headSlices: 40,
    dprMax: 1.5,
    antialias: true,
    shadows: false,
    threadHz: 0,
  },
  low: {
    control: 110,
    tubular: 240,
    radial: 4,
    headProfileSamples: 104,
    headSlices: 24,
    dprMax: 1.25,
    antialias: false,
    shadows: false,
    threadHz: 30,
  },
};

/* -------------------------------------------------------------------------- */
/*  Motion                                                                     */
/* -------------------------------------------------------------------------- */

export const MOTION = {
  /** How fast a head's rendered state chases the scroll position. */
  stageLambda: 3.2,
  /** Cursor lean, in radians. ~4.6° and ~2.9° — a lean, never a spin. */
  pointerYaw: 0.08,
  pointerPitch: 0.05,
  pointerLambda: 2.2,
  /** Breathing and float. Deliberately near the threshold of notice. */
  breathAmplitude: 0.009,
  breathSpeed: 0.5,
  floatAmplitude: 0.026,
  floatSpeed: 0.38,
  /** Seconds of phase between neighbouring heads, so they never pulse in step. */
  floatStagger: 1.7,
  /** Camera distance at the start and end of the journey. */
  cameraNear: 6.6,
  cameraFar: 7.4,
} as const;
