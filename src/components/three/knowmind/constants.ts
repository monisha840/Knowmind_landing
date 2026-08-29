/**
 * Every tunable number for the KnowMind head lives here.
 *
 * One sculptural profile head, held still while the thread inside its cranium
 * reorganises from a tangle, through an unravelling, into a clear spiral. The
 * head never changes — that is the point. Only the mind inside it does.
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
   * and they are tokens the rest of the site already uses (`wine-400`,
   * `wine-300`) for exactly this reason.
   */
  wineLift: "#8a4a72",
  wineLift2: "#a8709a",
  /** The head, and the wine violet that warms its lit side. */
  headBase: "#3b1c5a",
  headWarm: "#5a2348",
  headDeep: "#231038",
} as const;

/* -------------------------------------------------------------------------- */
/*  The three states                                                           */
/* -------------------------------------------------------------------------- */

export const TANGLED = 0;
export const UNRAVELING = 1;
export const CLEAR = 2;

export const STATE_LABELS = ["Tangled", "Unraveling", "Clear"] as const;

/**
 * Where the thread has got to, given the section's scroll progress.
 *
 * Returns a continuous stage in 0..2. The windows overlap the copy they belong
 * to rather than butting up against it: by the time each screen of text has
 * settled, the thread has arrived at the state that text describes.
 */
export function threadStage(progress: number): number {
  return smooth(0.22, 0.45, progress) + smooth(0.55, 0.8, progress);
}

/** Local copy so this module stays dependency-free for the fallback's sake. */
function smooth(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/** Which state the surrounding HTML should present as active. */
export function chapterAt(progress: number): 0 | 1 | 2 {
  if (progress >= 0.6) return CLEAR;
  if (progress >= 0.3) return UNRAVELING;
  return TANGLED;
}

/**
 * Where the thread's colour sits on the wine → honey path, given the stage.
 * Deliberately back-loaded: at UNRAVELING the strand should carry only a hint
 * of gold, not be half-way to it.
 */
export function threadWarmth(stage: number): number {
  return smooth(0.5, 1.9, stage);
}

/* -------------------------------------------------------------------------- */
/*  The profile                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The head in profile, as a closed loop running clockwise from the crown with
 * the face along +x.
 *
 * Laid out on the standard artistic canon rather than by eye. Crown to chin is
 * exactly 1.0, the brow line sits on the midpoint of that, the base of the nose
 * halfway again from brow to chin, and the mouth a third of the way from nose
 * to chin. Greatest cranial depth — glabella to occiput — is 0.83 of the
 * height, which is where an adult skull actually sits.
 *
 * The features are deliberately quiet. The nose projects 0.10 beyond the brow
 * plane and no more; the lips are a shallow double curve; the chin carries
 * moderate projection and sits a shade behind the lower lip, which is what
 * stops a profile reading as either weak or pugnacious. There are no eyes, no
 * brow, no ear — the silhouette carries the whole likeness.
 */
export const HEAD_PROFILE: readonly (readonly [number, number])[] = [
  [-0.05, 0.5], // vertex
  [0.055, 0.492],
  [0.15, 0.462],
  [0.228, 0.412], // frontal eminence
  [0.277, 0.34],
  [0.3, 0.255], // forehead
  [0.31, 0.155],
  [0.308, 0.075], // glabella
  [0.288, 0.03], // nasion — a shallow dip, not a notch
  [0.305, -0.02],
  [0.335, -0.085], // nasal bridge
  [0.372, -0.155],
  [0.405, -0.215],
  [0.418, -0.248], // pronasale
  [0.372, -0.264], // columella
  [0.34, -0.274],
  [0.322, -0.286], // subnasale
  // The mouth is four points and a few thousandths of relief. Any more and the
  // spline ripples through it — at this scale a lip modelled properly reads as
  // a staircase, not as a mouth.
  [0.322, -0.324], // upper lip
  [0.315, -0.352], // stomion
  [0.32, -0.382], // lower lip
  [0.3, -0.408], // labiomental sulcus
  [0.32, -0.442], // pogonion
  [0.302, -0.482],
  [0.252, -0.512], // gnathion
  [0.17, -0.545],
  [0.078, -0.578], // submental
  [0.04, -0.63], // cervicomental angle
  [0.056, -0.7],
  [0.078, -0.82],
  [0.092, -0.96],
  [0.096, -1.0], // the base is cut on a shallow rake, and carries enough
  [-0.02, -1.016], // points along it to stay a straight line rather than
  [-0.17, -1.032], // bowing out under the spline
  [-0.335, -1.048],
  [-0.352, -0.9],
  [-0.362, -0.76],
  [-0.372, -0.63], // nape
  [-0.398, -0.52],
  [-0.448, -0.408], // mastoid
  [-0.495, -0.27],
  [-0.52, -0.11], // occiput, the deepest point
  [-0.52, 0.05],
  [-0.498, 0.2],
  [-0.45, 0.33],
  [-0.368, 0.425],
  [-0.245, 0.48],
] as const;

export const HEAD = {
  /**
   * Half the head's width across the profile plane. A head is about 0.64 as
   * wide as it is tall, and crown to chin here is 1.0.
   */
  halfWidth: 0.32,
  /**
   * Shape of the horizontal section. 2 is an ellipse; a little above it is the
   * slightly squared oval a skull actually has.
   */
  sectionExponent: 2.35,
  /** How much narrower the form is toward the face than toward the occiput. */
  faceNarrow: 0.24,
  /** Over what height below the crown the dome closes. */
  domeRange: 0.34,

  /**
   * The form is not one width throughout. It is widest across the parietal
   * bone, narrows through the jaw, and narrows again into the neck — and
   * getting that wrong is most of what makes a lofted head read as a slab.
   */
  jawWidth: 0.82,
  neckWidth: 0.66,
  jawFrom: -0.55,
  jawTo: 0.02,
  neckFrom: -0.85,
  neckTo: -0.5,

  /** Height of the whole form, crown to base, used for framing. */
  height: 1.55,
  /** Widest span front to back, nose tip to occiput. */
  depth: 0.94,
  /** Middle of that box — the point the form is centred on and leans about. */
  pivotX: -0.051,
  pivotY: -0.275,
} as const;

/**
 * The window into the cranium.
 *
 * The thread lives inside the skull, so the skull has to be opened to show it.
 * The opening is elliptical, sits over the parietal region where a mind is
 * conventionally pictured, and is cut by *turning the surface inward* over that
 * region and removing the floor — so the rim is a curved wall following the
 * contour of the head rather than a flat boolean edge.
 */
export const WINDOW = {
  /**
   * The cranial recess: a bowl pressed into the near side of the vault, above
   * the brow, for the thread to sit in.
   *
   * A bowl rather than a hole, and that was arrived at the hard way. This loft
   * sweeps one outline inward across the head's width, so it has no interior
   * surface — cut a hole in it and what shows through is not a hollow skull but
   * the nested rings of the sweep itself, which read as a flat shelf hanging
   * inside the head. Pressing the surface in instead keeps the solid intact and
   * still puts the thread down inside the head rather than on top of it.
   *
   * Bounded by a height on the profile and a depth across the width, so the rim
   * runs from the forehead, over the crown, down to the occiput — following the
   * skull rather than cutting across it.
   */
  fromHeight: -0.08,
  toHeight: 0.32,
  fromDepth: 0.12,
  toDepth: 0.86,
  /** How deep the bowl is pressed, as a fraction of the local half-width. */
  depth: 0.62,
  /**
   * The dome is already narrowing as it closes, so pressing the same depth into
   * it there punches through the crown and takes a bite out of the silhouette.
   * Above this height the bowl eases back out again.
   */
  crownFrom: 0.3,
  crownTo: 0.46,
} as const;

/**
 * The cranial cavity the thread occupies — an ellipse in the profile plane,
 * a little larger than the window so the strand carries on past the rim
 * instead of stopping neatly at it.
 */
export const CAVITY = {
  x: -0.055,
  y: 0.215,
  rx: 0.195,
  ry: 0.155,
  /** How far past the ellipse a strand may bulge, asymptotically. */
  overflow: 1.16,
  /**
   * Target spread of each state across the cavity, as a root-mean-square in
   * normalised units. Every state is fitted to it, which is what keeps the
   * tangle, the loosening and the spiral the same size as each other.
   */
  fill: 0.46,
  /**
   * Depth inside the skull. Entirely behind the window's floor, so the strand
   * reads as suspended in the cranial space rather than laid on the surface.
   */
  zChaos: 0.155,
  zClear: 0.185,
  zDepth: 0.085,
} as const;

/* -------------------------------------------------------------------------- */
/*  Composition                                                                */
/* -------------------------------------------------------------------------- */

export const CAMERA = { fov: 32, near: 0.1, far: 40 } as const;

export const LAYOUT = {
  /** Fraction of the canvas the head may occupy. */
  widthFill: 0.62,
  heightFill: 0.86,
  minScale: 0.4,
  maxScale: 3.4,
  /** Below this the canvas is narrow enough that width, not height, decides. */
  narrowBreakpoint: 900,
} as const;

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
  /** Horizontal sections through the head, and points around each of them. */
  sections: number;
  around: number;
  dprMax: number;
  antialias: boolean;
  /**
   * Off everywhere, and measured rather than assumed: rendering the scene twice
   * so the strand could cast onto the skull changed the frame by 0.17 of a
   * possible 765 per pixel. The key strikes the thread at too shallow an angle
   * for its shadow to clear it, and the only way to expose one would be a
   * raking light that also drops the head into near-darkness. The depth cue
   * that works here is free: the strand really is inside the skull, and the
   * skull really does hide the parts of it that go behind.
   *
   * The plumbing is in place — flip this and the canvas, the head and the
   * strand all follow.
   */
  shadows: boolean;
  /** Rebuild the strand at a fixed lower rate when the CPU is the cheap part. */
  threadHz: number;
};

export const TIERS: Record<Tier, TierSettings> = {
  high: {
    control: 240,
    tubular: 560,
    radial: 6,
    sections: 168,
    around: 72,
    dprMax: 1.8,
    antialias: true,
    shadows: false,
    threadHz: 0,
  },
  medium: {
    control: 170,
    tubular: 380,
    radial: 5,
    sections: 120,
    around: 52,
    dprMax: 1.5,
    antialias: true,
    shadows: false,
    threadHz: 0,
  },
  low: {
    control: 110,
    tubular: 240,
    radial: 4,
    sections: 84,
    around: 36,
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
  /** How fast the rendered state chases the scroll position. */
  stageLambda: 3.2,
  /**
   * Cursor lean, in radians, and a standing turn away from dead profile.
   * ~4.6° and ~2.9° of lean; the 9° base turn is there because a head lit
   * from the front and seen at exactly ninety degrees loses all of its
   * cheekbone, and a sculpture with no cheek reads as a cut-out.
   */
  pointerYaw: 0.08,
  pointerPitch: 0.05,
  pointerLambda: 2.2,
  baseYaw: 0.11,
  /** Breathing and float. Deliberately near the threshold of notice. */
  breathAmplitude: 0.006,
  breathSpeed: 0.45,
  floatAmplitude: 0.018,
  floatSpeed: 0.34,
  /** Camera distance at the start and end of the journey. */
  cameraNear: 5.9,
  cameraFar: 6.5,
} as const;
