/**
 * The head, drawn flat.
 *
 * Used in two places: as the placeholder that holds the space while the canvas
 * loads, and as the permanent stand-in when WebGL is unavailable or the GPU
 * context is lost. Either way the page keeps its visual and the story still
 * reads — nobody ever sees an empty hole or a black rectangle.
 *
 * The silhouette and the three thread states are traced from the *same* data
 * the 3D uses, so this is genuinely the same head and the same tangle rather
 * than an artist's impression of them. It is all computed once at module scope
 * from deterministic maths, which means the server and the client produce
 * identical markup, and no three.js is involved.
 */

import { CAVITY, HEAD, HEAD_PROFILE, PALETTE } from "./constants";
import { sampleSpline } from "./math";
import { buildThreadPoints, type StateKind, visualAt } from "./states";

/* -------------------------------------------------------------------------- */
/*  Projection                                                                 */
/* -------------------------------------------------------------------------- */

/** Profile units → a 200 × 260 viewBox, with the form centred on its pivot. */
const SCALE = 148;
const CX = 100;
const CY = 130;

const px = (x: number) => CX + (x - HEAD.pivotX) * SCALE;
const py = (y: number) => CY - (y - HEAD.pivotY) * SCALE;

/* -------------------------------------------------------------------------- */
/*  The outline                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The profile, as one closed cubic path.
 *
 * A uniform Catmull-Rom through n points converts exactly to n cubic Béziers,
 * which is both smaller than a polyline and smooth at every joint — worth the
 * six lines of algebra for a shape that is on screen at full size.
 */
const HEAD_PATH = (() => {
  const n = HEAD_PROFILE.length;
  const at = (i: number) => HEAD_PROFILE[((i % n) + n) % n];
  const f = (v: number) => v.toFixed(1);

  let d = `M${f(px(at(0)[0]))} ${f(py(at(0)[1]))}`;
  for (let i = 0; i < n; i += 1) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    d +=
      `C${f(px(p1[0] + (p2[0] - p0[0]) / 6))} ${f(py(p1[1] + (p2[1] - p0[1]) / 6))} ` +
      `${f(px(p2[0] - (p3[0] - p1[0]) / 6))} ${f(py(p2[1] - (p3[1] - p1[1]) / 6))} ` +
      `${f(px(p2[0]))} ${f(py(p2[1]))}`;
  }
  return `${d}Z`;
})();

/** The cranial window, a little wider than the cavity the strand fills. */
const OPENING = {
  cx: px(CAVITY.x),
  cy: py(CAVITY.y),
  rx: CAVITY.rx * 1.16 * SCALE,
  ry: CAVITY.ry * 1.16 * SCALE,
};

/* -------------------------------------------------------------------------- */
/*  The thread                                                                 */
/* -------------------------------------------------------------------------- */

/** Trace one state as a single polyline through the cranial cavity. */
function strand(kind: StateKind): { d: string; width: number } {
  const control = 200;
  const source = buildThreadPoints(kind, control);
  const samples = 460;
  const point = new Float32Array(3);

  let d = "";
  for (let i = 0; i <= samples; i += 1) {
    sampleSpline(source, control, i / samples, point, 0);
    d += `${i ? "L" : "M"}${px(point[0]).toFixed(1)} ${py(point[1]).toFixed(1)} `;
  }

  return { d: d.trim(), width: visualAt("threadRadius", kind) * 2 * SCALE };
}

const THREADS = ([0, 1, 2] as StateKind[]).map(strand);

/**
 * Thread colour per state, matching the 3D's back-loaded warmth: wine while the
 * mind is tangled, a hint of gold as it unravels, honey once it is clear.
 */
const THREAD_COLOUR = [PALETTE.wineLift, "#c98a52", PALETTE.honey] as const;

/* -------------------------------------------------------------------------- */

type HeadProps = { state?: 0 | 1 | 2; className?: string };

/** The head, with the thread in whichever state it has reached. */
export function KnowMindHead({ state = 0, className }: HeadProps) {
  const thread = THREADS[state];

  return (
    <svg viewBox="0 0 200 260" className={className} fill="none" aria-hidden focusable="false">
      <defs>
        <linearGradient id="km-head-shade" x1="0.1" y1="0" x2="0.95" y2="0.85">
          <stop offset="0%" stopColor={PALETTE.headDeep} stopOpacity="0.9" />
          <stop offset="52%" stopColor={PALETTE.headDeep} stopOpacity="0.12" />
          <stop offset="100%" stopColor={PALETTE.headWarm} stopOpacity="0.4" />
        </linearGradient>
        <radialGradient id="km-window" cx="0.5" cy="0.45">
          <stop offset="0%" stopColor="#12061c" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#12061c" stopOpacity="0.45" />
        </radialGradient>
        <clipPath id="km-window-clip">
          <ellipse cx={OPENING.cx} cy={OPENING.cy} rx={OPENING.rx} ry={OPENING.ry} />
        </clipPath>
      </defs>

      <path d={HEAD_PATH} fill={PALETTE.headBase} />
      {/* A hint of the form's own modelling, so the flat version is not a slab. */}
      <path d={HEAD_PATH} fill="url(#km-head-shade)" />

      {/* The cranium, opened. The strand is clipped to it, so it reads as being
          inside the head rather than drawn across the forehead. */}
      <ellipse
        cx={OPENING.cx}
        cy={OPENING.cy}
        rx={OPENING.rx}
        ry={OPENING.ry}
        fill="url(#km-window)"
      />
      <g clipPath="url(#km-window-clip)">
        <path
          d={thread.d}
          stroke={THREAD_COLOUR[state]}
          strokeWidth={thread.width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */

type FallbackProps = {
  /** Which state the strand is in. Driven by scroll, like the canvas. */
  state?: 0 | 1 | 2;
  /** `loading` sits under a canvas that is still starting up. */
  variant?: "loading" | "static";
  /**
   * Match the canvas's placement. The height and the offset here are the flat
   * equivalents of `LAYOUT.heightFill` and the scene's side-by-side offset — if
   * they drift apart the head visibly jumps at the moment the canvas fades in.
   */
  align?: "center" | "right";
  className?: string;
};

export function KnowMindFallback({
  state = 0,
  variant = "loading",
  align = "center",
  className = "",
}: FallbackProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none flex h-full w-full items-center justify-center ${
        align === "right" ? "lg:justify-end lg:pr-[13%]" : ""
      } ${className}`}
    >
      <KnowMindHead
        state={state}
        className={`h-[72%] w-auto ${variant === "loading" ? "opacity-40" : "opacity-95"}`}
      />
    </div>
  );
}
