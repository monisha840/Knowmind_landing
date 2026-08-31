/**
 * The character, drawn flat.
 *
 * Used in two places: as the placeholder that holds the space while the canvas
 * loads, and as the permanent stand-in when WebGL is unavailable or the GPU
 * context is lost. Either way the page keeps its visual and the story still
 * reads — nobody ever sees an empty hole or a black rectangle.
 *
 * One character here too, in whichever state the scroll has reached, so the
 * flat version never contradicts the canvas by showing three of them.
 *
 * Every path is traced from the *same* generators and the same limb curves the
 * 3D uses, projected orthographically, so this is genuinely the same character
 * rather than an artist's impression of it. It is computed once at module scope
 * from deterministic maths, which means the server and the client produce
 * identical markup, and no three.js is involved.
 */

import { BODY, FACE, PALETTE } from "./constants";
import { sampleSpline } from "./math";
import { buildThreadPoints, type StateKind, visualAt } from "./states";

/* -------------------------------------------------------------------------- */
/*  Projection                                                                 */
/* -------------------------------------------------------------------------- */

/** Profile units → a 200-wide viewBox, with the body's centre at (100, 96). */
const SCALE = 52;
const CX = 100;
const CY = 96;

const px = (x: number) => CX + x * SCALE;
const py = (y: number) => CY - (y - BODY.y) * SCALE;

/**
 * Trace a flat xyz array as SVG subpaths, keeping only the half in front of the
 * body or only the half behind it — so the strand can be drawn faintly where it
 * passes behind the circle and solid where it passes in front.
 */
function trace(points: Float32Array, front: boolean): string {
  let d = "";
  let open = false;
  for (let i = 0; i < points.length; i += 3) {
    if (front ? points[i + 2] < 0 : points[i + 2] >= 0) {
      open = false;
      continue;
    }
    d += `${open ? "L" : "M"}${px(points[i]).toFixed(1)} ${py(points[i + 1]).toFixed(1)} `;
    open = true;
  }
  return d.trim();
}

/** Resample the strand finely enough that a polyline reads as a smooth curve. */
function strand(kind: StateKind): { front: string; back: string; width: number } {
  const control = 200;
  const source = buildThreadPoints(kind, control);
  const samples = 520;
  const dense = new Float32Array((samples + 1) * 3);
  for (let i = 0; i <= samples; i += 1) {
    sampleSpline(source, control, i / samples, dense, i * 3);
  }
  return {
    front: trace(dense, true),
    back: trace(dense, false),
    width: visualAt("threadRadius", kind) * 2 * SCALE,
  };
}

const THREADS = ([0, 1, 2] as StateKind[]).map(strand);

/* -------------------------------------------------------------------------- */
/*  Limbs — the same curves the tubes are swept along                          */
/* -------------------------------------------------------------------------- */

function limb(
  path: readonly (readonly number[])[],
  pivot: readonly number[],
  mirror: boolean,
  angle: number,
): string {
  const control = new Float32Array(path.length * 3);
  path.forEach(([x, y, z], i) => {
    control[i * 3] = mirror ? -x : x;
    control[i * 3 + 1] = y;
    control[i * 3 + 2] = z;
  });

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const point = new Float32Array(3);
  let d = "";
  for (let i = 0; i <= 20; i += 1) {
    sampleSpline(control, path.length, i / 20, point, 0);
    const x = point[0] * cos - point[1] * sin + (mirror ? -pivot[0] : pivot[0]);
    const y = point[0] * sin + point[1] * cos + pivot[1] + BODY.y;
    d += `${i ? "L" : "M"}${px(x).toFixed(1)} ${py(y).toFixed(1)} `;
  }
  return d.trim();
}

const LIMBS = ([0, 1, 2] as StateKind[]).map((kind) => {
  const angle = visualAt("arm", kind);
  return {
    arms: [
      limb(BODY.armPath, BODY.armPivot, false, angle),
      limb(BODY.armPath, BODY.armPivot, true, -angle),
    ],
    legs: [
      limb(BODY.legPath, BODY.legPivot, false, 0),
      limb(BODY.legPath, BODY.legPivot, true, 0),
    ],
  };
});

/* -------------------------------------------------------------------------- */
/*  Look per state                                                             */
/* -------------------------------------------------------------------------- */

const LOOK = [
  { thread: PALETTE.purpleLift, body: PALETTE.wineDeep, limb: PALETTE.deepPurple, face: 0 },
  { thread: PALETTE.wineLift, body: PALETTE.wineLift, limb: PALETTE.wineMid, face: 0.34 },
  { thread: PALETTE.wineLift2, body: PALETTE.honey, limb: PALETTE.wineViolet, face: 1 },
] as const;

const R = BODY.radius * SCALE;
const LIMB_W = BODY.limbRadius * 2 * SCALE;
const FOOT = { rx: BODY.footRadius * 1.2 * SCALE, ry: BODY.footRadius * 0.5 * SCALE };
const FOOT_Y = py(BODY.y + BODY.legPivot[1] + BODY.legPath[3][1] - 0.015);
const FOOT_X = BODY.legPivot[0] * SCALE;
const EYE = { r: FACE.eyeRadius * R, x: FACE.eyeX * R, y: FACE.eyeY * R };

/**
 * The 3D mouth is an arc of a torus; here it is one quadratic. Both are solved
 * from the same numbers so they land in the same place: the corners sit where
 * the arc's endpoints do, and the control point is chosen so the curve's
 * midpoint passes exactly through the bottom of the arc.
 */
const SMILE = (() => {
  const radius = FACE.smileRadius * R;
  const drop = FACE.smileDrop * R;
  const half = FACE.smileArc / 2;
  const endY = radius * Math.cos(half) - drop;
  return {
    x: radius * Math.sin(half),
    y: endY,
    ctrl: 2 * (radius - drop) - endY,
    w: FACE.smileTube * 2 * R,
  };
})();

/* -------------------------------------------------------------------------- */

type GlyphProps = { state?: 0 | 1 | 2; className?: string };

/** The character, in whichever of its three states the scroll has reached. */
export function KnowMindGlyph({ state = 0, className }: GlyphProps) {
  const look = LOOK[state];
  const thread = THREADS[state];
  const limbs = LIMBS[state];
  const width = visualAt("threadRadius", state) * 2 * SCALE;

  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" aria-hidden focusable="false">
      {/* Limbs first, so the body covers where they join it. */}
      <g stroke={look.limb} strokeWidth={LIMB_W} strokeLinecap="round" fill="none">
        {[...limbs.legs, ...limbs.arms].map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g fill={look.limb}>
        <ellipse cx={CX + FOOT_X} cy={FOOT_Y} rx={FOOT.rx} ry={FOOT.ry} />
        <ellipse cx={CX - FOOT_X} cy={FOOT_Y} rx={FOOT.rx} ry={FOOT.ry} />
      </g>

      {/* The strand behind the body. */}
      <path
        d={thread.back}
        stroke={look.thread}
        strokeWidth={width}
        strokeOpacity={0.34}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx={CX} cy={CY} r={R} fill={look.body} />

      {/* Eyes and smile arrive only as the strand settles. */}
      {look.face > 0 && (
        <g opacity={look.face}>
          <circle cx={CX - EYE.x} cy={CY - EYE.y} r={EYE.r} fill="#2a0f22" />
          <circle cx={CX + EYE.x} cy={CY - EYE.y} r={EYE.r} fill="#2a0f22" />
          {look.face > 0.9 && (
            <path
              d={`M${CX - SMILE.x} ${CY + SMILE.y} Q ${CX} ${CY + SMILE.ctrl} ${CX + SMILE.x} ${CY + SMILE.y}`}
              stroke="#2a0f22"
              strokeWidth={SMILE.w}
              strokeLinecap="round"
              fill="none"
            />
          )}
        </g>
      )}

      {/* And the strand in front of it. */}
      <path
        d={thread.front}
        stroke={look.thread}
        strokeWidth={width}
        strokeOpacity={0.92}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */

type FallbackProps = {
  /** Which state the strand is in. Driven by scroll, like the canvas. */
  state?: 0 | 1 | 2;
  /** `loading` sits under a canvas that is still starting up. */
  variant?: "loading" | "static";
  className?: string;
};

export function KnowMindFallback({
  state = 0,
  variant = "loading",
  className = "",
}: FallbackProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none flex h-full w-full items-center justify-center ${className}`}
    >
      <KnowMindGlyph
        state={state}
        className={`h-[min(80%,30rem)] w-auto ${
          variant === "loading" ? "opacity-45" : "opacity-95"
        }`}
      />
    </div>
  );
}
