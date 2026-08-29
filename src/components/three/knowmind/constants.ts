/**
 * Every tunable number for the KnowMind character lives here.
 *
 * One character — a honey-coloured circular body with a quiet face, thin limbs,
 * and a single continuous thread that starts as a tangle around it and ends as
 * a clean halo. The character itself never changes shape. Only the thread
 * reorganises, and the colours warm to follow it.
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
  /** Darker members of the same two families, for the unlit start of the story. */
  wineDeep: "#2a0f22",
  wineMid: "#4c1c3c",
  purpleDeep: "#1e0e2e",
  /**
   * Lifted members of the same two families. A strand painted in the brand's
   * own wine violet sits within a few percent of the night behind it and simply
   * vanishes; these are the same hues carried up in lightness, and they are the
   * tokens the rest of the site already uses for exactly this reason.
   */
  purpleLift: "#4e2874",
  wineLift: "#6d2f58",
  wineLift2: "#8a4a72",
} as const;

/* -------------------------------------------------------------------------- */
/*  Chapters                                                                   */
/* -------------------------------------------------------------------------- */

export const CHAOS = 0;
export const FLOW = 1;
export const CLARITY = 2;

export const STATE_LABELS = ["Chaos", "Flow", "Clarity"] as const;

/**
 * Overlapping transition windows, in normalised scroll progress.
 *
 * Deliberately *not* hard thirds: the thread is already loosening while the
 * first chapter is still on screen, and has settled a little before the third
 * chapter's copy comes to rest — so nothing ever cuts. Scrolling back up runs
 * the same curve in reverse, because the stage is a pure function of progress
 * with no latching anywhere.
 */
export const CHAOS_TO_FLOW: readonly [number, number] = [0.22, 0.42];
export const FLOW_TO_CLARITY: readonly [number, number] = [0.54, 0.8];

/** Chapter index the surrounding HTML should consider active. */
export function chapterAt(progress: number): 0 | 1 | 2 {
  if (progress >= 0.6) return CLARITY;
  if (progress >= 0.3) return FLOW;
  return CHAOS;
}

/* -------------------------------------------------------------------------- */
/*  The character — identical proportions in all three states                  */
/* -------------------------------------------------------------------------- */

export const BODY = {
  /** Radius of the circular head/body — every other proportion follows it. */
  radius: 0.68,
  /**
   * How far it is flattened along z. A coin given depth, not a ball — much
   * above this and the shading gradient reads as a sphere, and the character
   * stops being a drawn circle.
   */
  depth: 0.36,
  /** Height of its centre above the character's origin. */
  y: 0.34,
  /** Where the face plane sits, in body-local space. */
  faceZ: 0.26,

  limbRadius: 0.042,
  handRadius: 0.052,
  footRadius: 0.076,

  armPivot: [0.52, 0.06, 0.04] as const,
  legPivot: [0.22, -0.6, 0.02] as const,

  /**
   * Limb paths, relative to their pivots. Shared with the flat fallback so the
   * SVG stand-in traces the same character rather than an approximation of it.
   *
   * The arm travels outward before it drops. It has to: the body is a flat disc
   * about a third of a unit deep, so an arm that curves straight down from the
   * shoulder spends most of its length *inside* the body and only its hand ever
   * shows.
   */
  armPath: [
    [0, 0, 0],
    [0.3, -0.09, 0.01],
    [0.48, -0.32, 0],
    [0.55, -0.58, -0.02],
  ] as const,
  legPath: [
    [0, 0, 0],
    [0.018, -0.21, 0],
    [0.014, -0.41, 0.008],
    [0, -0.6, 0.025],
  ] as const,
} as const;

/**
 * The face, as fractions of the body's radius, so it keeps its proportions
 * whatever size the body is set to — and so the 3D and the flat fallback can
 * never drift apart. The numbers are small on purpose: eyes at 8% of the
 * radius, a mouth spanning barely a third of the width. Anything larger and
 * this becomes a mascot.
 */
export const FACE = {
  eyeRadius: 0.078,
  eyeX: 0.315,
  eyeY: 0.235,
  smileRadius: 0.35,
  smileTube: 0.033,
  /** How far the mouth sits below the body's centre. */
  smileDrop: 0.044,
  /** Sweep of the arc. Not a fraction of anything — an angle. */
  smileArc: Math.PI * 0.58,
} as const;

/**
 * World-space box the character is fitted into, whatever the viewport.
 *
 * Measured, not guessed: across the three states the composition spans at most
 * 2.45 wide and 2.40 tall, sitting a fraction above the origin. These add about
 * a fifth again as breathing room, and `max` caps how large it may grow on a
 * very tall canvas.
 */
export const FIT = { height: 2.95, width: 2.95, min: 0.5, max: 1.4 } as const;

export const CAMERA = { fov: 38, near: 0.1, far: 40 } as const;

/* -------------------------------------------------------------------------- */
/*  Performance tiers                                                          */
/* -------------------------------------------------------------------------- */

export type Tier = "low" | "medium" | "high";

export type TierSettings = {
  /** Control points on the thread. Same count in every state, so they morph. */
  control: number;
  /** Tube segments along the thread. */
  tubular: number;
  /** Sides of the tube's cross-section. */
  radial: number;
  motes: number;
  dprMax: number;
  antialias: boolean;
  headSegments: [number, number];
  limbSegments: number;
  /** Skip thread rebuilds on some frames when the GPU is the cheap part. */
  threadHz: number;
};

export const TIERS: Record<Tier, TierSettings> = {
  high: {
    control: 240,
    tubular: 560,
    radial: 6,
    motes: 140,
    dprMax: 1.8,
    antialias: true,
    headSegments: [48, 32],
    limbSegments: 10,
    threadHz: 0,
  },
  medium: {
    control: 170,
    tubular: 380,
    radial: 5,
    motes: 64,
    dprMax: 1.5,
    antialias: true,
    headSegments: [36, 24],
    limbSegments: 8,
    threadHz: 0,
  },
  low: {
    control: 110,
    tubular: 240,
    radial: 4,
    motes: 0,
    dprMax: 1.25,
    antialias: false,
    headSegments: [26, 18],
    limbSegments: 6,
    threadHz: 30,
  },
};

/* -------------------------------------------------------------------------- */
/*  Motion                                                                     */
/* -------------------------------------------------------------------------- */

export const MOTION = {
  /** How fast the rendered state chases the scroll position. */
  stageLambda: 3.4,
  /** Cursor lean, in radians. ~5.4° and ~3.4° — a lean, never a spin. */
  pointerYaw: 0.095,
  pointerPitch: 0.06,
  pointerLambda: 2.4,
  breathAmplitude: 0.014,
  breathSpeed: 0.62,
  floatAmplitude: 0.045,
  floatSpeed: 0.44,
} as const;
