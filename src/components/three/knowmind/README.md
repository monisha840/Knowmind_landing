# KnowMind3D

One character — a circular body with a quiet face and thin limbs — and one
continuous thread running around it.

    CHAOS ─────────▶ FLOW ─────────▶ CLARITY
    a dense tangle   loosening loops  a clean halo

The character never changes shape. As the visitor scrolls, the thread
reorganises and the colours warm with it: the body goes from near-black plum,
through wine violet, to honey, and the face surfaces only at the end. Scrolling
back up runs the whole thing in reverse.

Everything is procedural. There is no model file to download.

---

## Using it

```tsx
const track = useRef<HTMLElement>(null);

<section ref={track} className="relative">
  <div className="sticky top-0 h-[100svh]">
    <KnowMind3D trackRef={track} align="right" className="h-full w-full" />
  </div>
  {/* three screens of copy, one per state */}
</section>
```

`MindEvolution.tsx` is the full worked example — the character beside a column
of copy on desktop, above it on phones.

### Props

| prop | | |
|---|---|---|
| `trackRef` | `RefObject<HTMLElement \| null>` | The element whose scroll range drives the transformation. Progress runs 0 when its top meets the top of the viewport to 1 when its bottom meets the bottom. |
| `progressRef` | `RefObject<number>` | Drive it yourself from a ref you write at frame rate. Nothing re-renders. Preferred over `progress`. |
| `progress` | `number` | Drive it from React state. Re-renders on change, so use it for coarse control, never per frame. |
| `align` | `"center" \| "right"` | Where the character sits in a full-bleed canvas. `right` is ignored below 1024px. |
| `fade` | `[number, number]` | Fade the visual out across this progress range, e.g. `[0.93, 1]`. |
| `fadeRef` | `RefObject<HTMLElement \| null>` | An extra element to fade with it — the state rail, typically. |
| `quality` | `"auto" \| "low" \| "medium" \| "high"` | Force a tier instead of measuring the device. |
| `label` | `string` | Sets `role="img"` + `aria-label`. Omit and the canvas is decorative, which is correct whenever the surrounding HTML already says what it says. |
| `onChapterChange` | `(0 \| 1 \| 2) => void` | Fires on crossing into a new state. At most twice per pass — safe to drive React state with. |

The parent owns position, size, background and scroll. The component owns
geometry, animation, lighting, materials, quality and failure handling.

### One layout gotcha

`KnowMind3D` renders `display: grid` with an explicit `1fr` row and column, and
deliberately sets **no** `position` — so you may pass `absolute`, `sticky` or
nothing. Give it a box with a **definite height**. A grid area with no definite
height silently collapses every percentage height beneath it, and r3f then
measures its canvas square instead of matching the box.

---

## The character

A sphere flattened along z into a coin, so it reads as a drawn circle given
depth rather than as a ball; two inlaid eyes and one shallow arc for a mouth,
both sized as fractions of the body's radius so they can never drift out of
proportion; four thin tubes for limbs, swept along Catmull-Rom paths.

The arms travel outward before they drop. They have to: the body is a flat disc
about a third of a unit deep, so an arm that curves straight down from the
shoulder spends most of its length *inside* the body and only its hand ever
shows.

The face is deliberately restrained and deliberately still — eyes at 8% of the
body's radius, a mouth spanning barely a third of its width. It does not change
expression between states. The eyes surface as a faint darkening partway
through, and the smile only arrives once the thread has settled, scaling up from
a shorter, flatter arc so it reads as the mouth *finding* the expression rather
than switching to it. The psychological transformation is carried by the thread.

## How the thread morphs

`states.ts` describes the strand with the same number of control points in every
state, generated from the same parameter `t`. Point `t` in the tangle and point
`t` in the halo are the same point, so interpolating between them combs the knot
out along its own length rather than dissolving one shape into another. There
are no hard cuts and nothing fades in or out.

Scroll progress becomes a continuous stage in 0..2 through two overlapping
smoothsteps, then damped. Two consequences worth knowing:

- **It reverses for free.** The stage is a pure function of progress with
  nothing latched, so scrolling up runs clarity → flow → chaos on the same
  curve.
- **Fast scrolling settles rather than snapping.** The damping is frame-rate
  independent and the frame delta is clamped at 50ms, so returning to a
  backgrounded tab resumes instead of teleporting past the transition.

Each state is recentred on its bounding box at build time — the noise that makes
the tangle irregular is not zero-mean over any finite sample, so an untouched
tangle drifts off to one side, which reads as a mistake rather than as chaos.

`tube.ts` sweeps the tube along the result into buffers allocated once, using
rotation-minimising frames so it never twists where the thread doubles back. One
draw call, zero per-frame allocation.

## Two colour traps, both fixed here

- three's `Color.lerpHSL` interpolates hue **linearly**. Wine violet (≈326°) to
  honey (≈27°) therefore runs the long way round and puts a bright cyan body on
  the page mid-transition. `color.ts` takes the short path instead, easing
  saturation down at the midpoint so the moment it passes through red reads as
  warm clay rather than an alarm.
- A warm key light eats the blue channel of every purple in a scene, and wine
  violet without its blue is just red. The key is pure white and the sky fill
  near-neutral on purpose. All the warmth comes from the honey the character
  turns.

---

## What it does on its own

**Loading.** Text renders first. A flat SVG of the same character holds the
space, in whichever state the scroll has reached — so the crossfade has nothing
to jump. three.js is only fetched once the section is within 80% of a viewport.
It is not in the initial page bundle.

**Failure.** The probe asks for `webgl2` specifically, because three.js dropped
WebGL 1 in r163 and a WebGL-1-only browser otherwise throws *inside* the
renderer constructor, asynchronously, where no error boundary can catch it. If
WebGL 2 is missing, the context is lost, or anything in the canvas subtree
throws, the flat version stays and the canvas is unmounted so its context is
released.

**One character everywhere.** The canvas draws one, and so does the flat
fallback — it takes the current state as a prop rather than showing three
side by side, so the two can never contradict each other.

**Quality tiers.** Cores, memory, pointer type, viewport, plus one check for a
software rasteriser (SwiftShader / llvmpipe → always `low`).

| | control pts | tube segs | sides | motes | max DPR | AA |
|---|---|---|---|---|---|---|
| high | 240 | 560 | 6 | 140 | 1.8 | yes |
| medium | 170 | 380 | 5 | 64 | 1.5 | yes |
| low | 110 | 240 | 4 | 0 | 1.25 | no |

Handhelds are capped at `medium`. On `low` the strand rebuilds at 30Hz while the
scene keeps rendering at full rate. If the first 2.5 seconds cannot hold ~34fps,
resolution drops once and stays down. No shadow maps, no post-processing, no
environment map — three lights and a transparent canvas.

**Reduced motion.** Float, breath, sway, cursor lean and the thread's own
restlessness all stop; the scroll-driven transformation stays, damped harder so
it tracks the wheel directly. All three states are still shown.

**Memory.** Every geometry and material is created by hand rather than by r3f,
so every one is disposed by hand on unmount. Listeners and observers are torn
down with their effects.

---

## Files

    KnowMind3D.tsx        public component: probes, gating, fallback, crossfade
    KnowMindCanvas.tsx    the r3f Canvas, lighting, adaptive DPR, context guard
    Character.tsx         assembly, framing, camera, and the one per-frame update
    Face.tsx              the eyes and the smile, and how they emerge
    MoteField.tsx         the optional dust
    ThreadSystem.tsx      the morphing strand
    tube.ts               tube kernel: build once, sweep in place
    states.ts             the three states and everything that differs between them
    constants.ts          proportions, palette, tiers, timings
    color.ts / math.ts    interpolation
    KnowMindFallback.tsx  the flat SVG, traced from the same generators
    useScrollProgress.ts  scroll → ref, no re-renders
    usePerformanceTier.ts device capability guess
    useWebGL2.ts          the probe that matches what three actually needs
