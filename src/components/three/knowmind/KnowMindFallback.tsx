/**
 * The triptych, drawn flat.
 *
 * Used in two places: as the placeholder that holds the space while the canvas
 * loads, and as the permanent stand-in when WebGL is unavailable or the GPU
 * context is lost. Either way the page keeps its visual and the story still
 * reads — nobody ever sees an empty hole or a black rectangle.
 *
 * The profile and the three thread states are traced from the *same* data the
 * 3D uses, so this is genuinely the same head and the same tangle rather than
 * an artist's impression of them. It is all computed once at module scope from
 * deterministic maths, which means the server and the client produce identical
 * markup, and no three.js is involved.
 */

import { HEAD, HEAD_PROFILE, PALETTE } from "./constants";
import { sampleSpline } from "./math";
import { buildThreadPoints, type StateKind, visualAt } from "./states";

/* -------------------------------------------------------------------------- */
/*  Projection                                                                 */
/* -------------------------------------------------------------------------- */

/** Profile units → a 120 × 200 viewBox, with the form centred on its pivot. */
const SCALE = 86;
const CX = 60;
const CY = 100;

const px = (x: number) => CX + (x - HEAD.pivotX) * SCALE;
const py = (y: number) => CY - (y - HEAD.pivotY) * SCALE;

/* -------------------------------------------------------------------------- */
/*  The head outline                                                           */
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

/* -------------------------------------------------------------------------- */
/*  The thread                                                                 */
/* -------------------------------------------------------------------------- */

/** The head's front surface across the cranium sits at very nearly this depth. */
const SURFACE = HEAD.halfWidth;

/**
 * Trace one state as two polylines: the part of the strand in front of the
 * skull, and the part behind it. In three dimensions the head simply hides
 * what passes behind; flat, that half is drawn faintly instead, which reads as
 * depth rather than as a gap.
 */
function strand(kind: StateKind): { front: string; back: string; width: number } {
  const control = 128;
  const source = buildThreadPoints(kind, control);
  const samples = 460;
  const point = new Float32Array(3);

  let front = "";
  let back = "";
  let openFront = false;
  let openBack = false;

  for (let i = 0; i <= samples; i += 1) {
    sampleSpline(source, control, i / samples, point, 0);
    const x = px(point[0]).toFixed(1);
    const y = py(point[1]).toFixed(1);

    if (point[2] >= SURFACE) {
      front += `${openFront ? "L" : "M"}${x} ${y} `;
      openFront = true;
      openBack = false;
    } else {
      back += `${openBack ? "L" : "M"}${x} ${y} `;
      openBack = true;
      openFront = false;
    }
  }

  return {
    front: front.trim(),
    back: back.trim(),
    width: visualAt("threadRadius", kind) * 2 * SCALE,
  };
}

const THREADS = ([0, 1, 2] as StateKind[]).map(strand);

/**
 * Thread colour per state, matching the 3D's back-loaded warmth: wine while
 * the mind is tangled, a hint of gold as it unravels, honey once it is clear.
 */
const THREAD_COLOUR = [PALETTE.wineLift2, "#c78a63", PALETTE.honey] as const;

/* -------------------------------------------------------------------------- */

type HeadProps = { state: 0 | 1 | 2; className?: string };

/** One head, in one of its three states. */
export function KnowMindHead({ state, className }: HeadProps) {
  const thread = THREADS[state];
  const colour = THREAD_COLOUR[state];

  return (
    <svg viewBox="0 0 120 200" className={className} fill="none" aria-hidden focusable="false">
      <path d={HEAD_PATH} fill={PALETTE.headBase} />
      {/* A hint of the form's own shading, so the flat version is not a slab. */}
      <path d={HEAD_PATH} fill="url(#km-head-shade)" />
      <path
        d={thread.back}
        stroke={colour}
        strokeWidth={thread.width}
        strokeOpacity={0.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={thread.front}
        stroke={colour}
        strokeWidth={thread.width}
        strokeOpacity={0.95}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** One shared gradient definition for however many heads are on the page. */
function ShadeDefs() {
  return (
    <svg aria-hidden focusable="false" className="absolute h-0 w-0">
      <defs>
        <linearGradient id="km-head-shade" x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0%" stopColor={PALETTE.headDeep} stopOpacity="0.85" />
          <stop offset="55%" stopColor={PALETTE.headDeep} stopOpacity="0.1" />
          <stop offset="100%" stopColor={PALETTE.wineLift} stopOpacity="0.28" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */

type FallbackProps = {
  /**
   * `loading` holds the space under a canvas that is still starting up, and so
   * shows what the canvas will show first: three identical tangled minds.
   * `static` is the permanent stand-in, and tells the whole story at once.
   */
  variant?: "loading" | "static";
  className?: string;
};

export function KnowMindFallback({ variant = "loading", className = "" }: FallbackProps) {
  const states: readonly (0 | 1 | 2)[] = variant === "loading" ? [0, 0, 0] : [0, 1, 2];

  return (
    <div
      aria-hidden
      className={`pointer-events-none flex h-full w-full items-center justify-center ${className}`}
    >
      <ShadeDefs />
      {/* Three equal columns, matching the canvas — so the state labels in the
          HTML underneath line up with the heads either way. */}
      <div className="grid w-full grid-cols-3 items-center px-2">
        {states.map((state, i) => (
          // The padding is a guard, not decoration: at 320px a third of the
          // viewport is barely a hundred pixels, and a head allowed to fill its
          // column edge to edge touches the side of the screen.
          <div key={i} className="flex justify-center px-1.5">
            <KnowMindHead
              state={state}
              className={`h-auto w-full max-w-[7.5rem] sm:max-w-[10rem] lg:max-w-[12rem] ${
                variant === "loading" ? "opacity-45" : "opacity-95"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
