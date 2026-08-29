# KnowMind3D

Three sculptural profile heads. Identical form, identical material, identical
orientation — the same geometry object rendered three times. The only thing
that differs is the thread inside each skull.

    01 TANGLED ────────▶ 02 UNRAVELING ────────▶ 03 CLEAR
    mental clutter       awareness, reflection   clarity · 1% better

They start as three copies of the same tangle and come apart as the visitor
scrolls: the left head holds, the middle reorganises, the right resolves into a
spiral. The last thing on screen is the whole story at once. That is the
argument the visual makes — one mind in three states, not three people.

Everything is procedural. There is no model file to download.

---

## Using it

```tsx
const track = useRef<HTMLElement>(null);

<section ref={track} className="relative">
  <div className="sticky top-0 h-[100svh]">
    <KnowMind3D trackRef={track} className="h-full w-full" />
  </div>
  {/* three screens of copy, one per state */}
</section>
```

`MindEvolution.tsx` is the full worked example — a pinned triptych, captions on
the same three columns as the heads, and mobile handled as its own layout
rather than as a shrunken desktop.

### Props

| prop | | |
|---|---|---|
| `trackRef` | `RefObject<HTMLElement \| null>` | The element whose scroll range drives the transformation. Progress runs 0 when its top meets the top of the viewport to 1 when its bottom meets the bottom. |
| `progressRef` | `RefObject<number>` | Drive it yourself from a ref you write at frame rate. Nothing re-renders. Preferred over `progress`. |
| `progress` | `number` | Drive it from React state. Re-renders on change, so use it for coarse control, never per frame. |
| `fade` | `[number, number]` | Fade the visual out across this progress range, e.g. `[0.93, 1]`. |
| `fadeRef` | `RefObject<HTMLElement \| null>` | An extra element to fade with it — the captions, typically. |
| `quality` | `"auto" \| "low" \| "medium" \| "high"` | Force a tier instead of measuring the device. |
| `fallback` | `"sequence" \| "single"` | Flat stand-in when WebGL is unavailable. |
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

## How the head is built

`headGeometry.ts` lofts one closed profile — crown, brow, nasion, nose,
philtrum, lips, chin, jaw, throat, nape, occiput — across the head's width.
Three details do the work:

- **A superellipse cross-section**, not a circle. The form stays full out to
  about three-quarters of its width and only then rounds off, which is the
  section a skull actually has and the difference between a sculpted head and a
  flat cut-out.
- **The features fade toward the sides.** A head has a nose in the middle and
  none at all at the ear. Sweeping one outline across the whole width gives
  every slice its own nose, and those stack into a ridge fanning back from the
  face. So a second outline is derived by repeatedly averaging each point with
  its neighbours — diffusion erases anything narrower than it runs long, taking
  out the nose, lips and chin notch and leaving the skull, jaw and neck — and
  the two are blended per slice. Because it is the *same* points, moved, they
  stay in register.
- **The neck is narrower than the skull.** Without that the form is a slab with
  a face on it.

Built once and shared by all three heads. They are the same mind, so they are
the same geometry object and the same material instance.

## How the thread morphs

`states.ts` generates all three states from one family, at three degrees of
disorder, from the same parameter `t`. Point `t` in the tangle and point `t` in
the spiral are the same point at different degrees of disorder, so interpolating
between them combs the knot out along its own length rather than dissolving one
shape into another. There are no hard cuts anywhere; scroll progress becomes a
continuous stage in 0..2 per head, damped so a flick of the wheel still reads as
a transformation.

The ordered mode is an Archimedean spiral. The chaotic mode is **a smooth random
walk** — a few octaves of noise driving x and y directly. That last choice
matters: anything written in polar coordinates winds its angle one way and
therefore lays down loop inside loop, and noise on such a spiral gives wobbly
rings, never a knot. A walk changes direction, so it has to cross what it
already laid down.

Each state is then centred on its own mass, fitted per axis to the cranial
cavity by root-mean-square, and softly compressed back inside it. Noise is not
zero-mean over any finite sample, so an untouched walk drifts off to one side of
the skull and sits further forward than intended; fitting on spread rather than
on the furthest point stops one stray end deciding the scale for everything
else.

`tube.ts` sweeps a tube along the result into buffers allocated once, using
rotation-minimising frames so it never twists where the thread doubles back.
One draw call per strand, zero per-frame allocation.

## Two colour traps, both fixed here

- three's `Color.lerpHSL` interpolates hue **linearly**. Wine violet (≈326°) to
  honey (≈27°) therefore runs the long way round and puts a bright cyan thread
  on the page mid-transition. `color.ts` takes the short path instead, easing
  saturation down at the midpoint so the moment it passes through red reads as
  warm clay rather than an alarm. The warmth is also back-loaded: at UNRAVELING
  the strand carries only a hint of gold, which is what `threadWarmth` encodes.
- A warm key light eats the blue channel of every purple in a scene, and deep
  purple without its blue is just brown. The key is pure white and the sky fill
  near-neutral on purpose. All the warmth comes from the honey the thread turns.

---

## What it does on its own

**Loading.** Text renders first. A flat SVG of three tangled heads holds the
space — which is exactly what the canvas shows first, so the crossfade has
nothing to jump. three.js is only fetched once the section is within 80% of a
viewport, then fades in over 900ms. three.js is not in the initial page bundle.

**Failure.** The probe asks for `webgl2` specifically, because three.js dropped
WebGL 1 in r163 and a WebGL-1-only browser otherwise throws *inside* the
renderer constructor, asynchronously, where no error boundary can catch it. If
WebGL 2 is missing, the context is lost, or anything in the canvas subtree
throws, the flat version stays and the canvas is unmounted so its context is
released. The page is never left with a black rectangle.

**Quality tiers.** Cores, memory, pointer type, viewport, plus one check for a
software rasteriser (SwiftShader / llvmpipe → always `low`).

| | control pts | tube segs | sides | profile × slices | max DPR | AA |
|---|---|---|---|---|---|---|
| high | 240 | 560 | 6 | 200 × 64 | 1.8 | yes |
| medium | 170 | 380 | 5 | 150 × 40 | 1.5 | yes |
| low | 110 | 240 | 4 | 104 × 24 | 1.25 | no |

Handhelds are capped at `medium`. On `low` the strand's own micro-movement
rebuilds at 30Hz while the scene keeps rendering at full rate. If the first 2.5
seconds cannot hold ~34fps, resolution drops once and stays down.

**No shadow maps**, and measured rather than assumed: rendering the scene twice
so the strand could cast onto the skull changed the frame by 0.17 of a possible
765 per pixel. The key strikes the thread at a shallow enough angle that its
shadow falls behind the thread itself, and the only way to expose one would be a
raking light that also drops the heads into near-darkness. The depth cue that
works here is free — strands really do pass behind the skull, and the skull
really does hide them. The plumbing is in place behind `TIERS[...].shadows`.

**Layout.** Wide viewports get three equal columns, so the heads land on the
sixths and the HTML captions line up with them. Narrow viewports spread the row
out and pan the camera along it instead, with the active head centred and its
neighbours held at the edges — three heads at a sixth of a phone's width are
unreadable, and the page must never scroll sideways.

Each head is turned to face the camera. A wide canvas puts the outer two more
than thirty degrees off axis, and left alone they would read as three-quarter
views of two different people. Their size needs no correction: all three sit in
the same plane, so the perspective divide scales them identically. Perspective
still does its work *within* each head, which is what makes them sculptural
rather than flat.

**Reduced motion.** Float, breath, sway and cursor lean all stop; the
scroll-driven transformation stays, damped harder so it tracks the wheel
directly. All three states are still shown.

**Memory.** Every geometry and material is created by hand rather than by r3f,
so every one is disposed by hand on unmount. Listeners and observers are torn
down with their effects.

---

## Files

    KnowMind3D.tsx        public component: probes, gating, fallback, crossfade
    KnowMindCanvas.tsx    the r3f Canvas, lighting, adaptive DPR, context guard
    HeadRow.tsx           three heads, framing, camera, and the one per-frame update
    Head.tsx              one head: shared form, its own thread, its own breath
    headGeometry.ts       the lofted profile
    ThreadSystem.tsx      the morphing strand
    tube.ts               tube kernel: build once, sweep in place
    states.ts             the three states and everything that differs between them
    constants.ts          the profile, proportions, cavity, palette, tiers, timings
    color.ts / math.ts    interpolation
    KnowMindFallback.tsx  the flat SVG, traced from the same profile and states
    useScrollProgress.ts  scroll → ref, no re-renders
    usePerformanceTier.ts device capability guess
    useWebGL2.ts          the probe that matches what three actually needs
