# KnowMind3D

One sculptural profile head, held still, with a shallow recess pressed into the
near side of its cranial vault. Inside that recess is a thread.

    01 TANGLED ────────▶ 02 UNRAVELING ────────▶ 03 CLEAR
    mental clutter       awareness, reflection   clarity · 1% better

The head never changes — not its form, not its material, not its pose. What
changes is the thread, which reorganises as the visitor scrolls. That is the
whole idea: your mind does not need to become a different mind, it needs to
become clearer.

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

`MindEvolution.tsx` is the full worked example.

### Props

| prop | | |
|---|---|---|
| `trackRef` | `RefObject<HTMLElement \| null>` | The element whose scroll range drives the transformation. Progress runs 0 when its top meets the top of the viewport to 1 when its bottom meets the bottom. |
| `progressRef` | `RefObject<number>` | Drive it yourself from a ref you write at frame rate. Nothing re-renders. Preferred over `progress`. |
| `progress` | `number` | Drive it from React state. Re-renders on change, so use it for coarse control, never per frame. |
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

## How the head is built

`headGeometry.ts` builds the head as **a stack of horizontal cross-sections**,
one per height.

The obvious alternative — sweeping the profile outline sideways and shrinking it
— was tried first and does not work. Every slice keeps its own nose, so the face
stacks into a ridge fanning back toward the ear; the sweep converges on a *line*
rather than a point, which leaves a crease running down the centre of the face;
and it produces no interior at all, so cutting a window into it exposes the
nested rings of the sweep as a flat shelf hanging inside the skull. All three of
those are visible in a render and none are fixable by tuning.

Sections work because a head is a stack of ovals:

- the profile gives the **front and back** of every section, read off a densely
  sampled outline so the control points' uneven spacing never shows through;
- a width curve gives its **half-width** — widest across the parietal bone,
  narrower through the jaw, narrower again into the neck;
- the section is a **superellipse narrowed toward the face**, because a skull is
  fuller at the back than the front;
- the crown closes as a **dome** and the base is **capped flat** — a deliberate
  sculptural cut, not a head sitting on a cylinder;
- and the near side of the vault is **pressed inward into a bowl** for the
  thread, at a depth measured as a fraction of the local half-width and eased
  off as the dome closes. An absolute depth punches through the crown and takes
  a bite out of the silhouette.

The profile itself is laid out on the standard artistic canon rather than by
eye: crown to chin is exactly 1.0, the brow line sits on the midpoint of that,
the base of the nose halfway again from brow to chin, the mouth a third of the
way from nose to chin, and greatest cranial depth 0.83 of the height. The nose
projects 0.10 beyond the brow plane and no more; the chin sits a shade behind
the lower lip, which is what stops a profile reading as either weak or
pugnacious.

The mouth is four points and a few thousandths of relief, plus a light diffusion
pass over the whole sampled outline. A Catmull-Rom passes exactly through every
control point, so a mouth modelled properly at this scale comes out as a visible
staircase; two samples' worth of smoothing rounds those corners while leaving
the nose and chin, twenty samples wide, where they were.

## How the thread morphs

`states.ts` generates all three states from one family at three degrees of
disorder, from the same parameter `t`. Point `t` in the tangle and point `t` in
the spiral are the same point at different degrees of disorder, so interpolating
between them combs the knot out along its own length rather than dissolving one
shape into another. Scroll progress becomes a continuous stage in 0..2, damped,
so a flick of the wheel still reads as a transformation. No hard cuts anywhere.

The ordered mode is an Archimedean spiral. The chaotic mode is **a smooth random
walk** — a few octaves of noise driving x and y directly. That choice matters:
anything written in polar coordinates winds its angle one way and so lays down
loop inside loop, and noise on such a spiral gives wobbly rings, never a knot. A
walk changes direction, so it crosses what it already laid down.

Each state is then centred on its own mass, fitted per axis to the cranial
cavity by root-mean-square, and softly compressed inside it.

## Two colour traps, both fixed here

- three's `Color.lerpHSL` interpolates hue **linearly**. Wine violet (≈326°) to
  honey (≈27°) therefore runs the long way round and puts a bright cyan thread
  on the page mid-transition. `color.ts` takes the short path instead, easing
  saturation down at the midpoint so the moment it passes through red reads as
  warm clay rather than an alarm. The warmth is back-loaded, so at UNRAVELING
  the strand carries only a hint of gold.
- A warm key light eats the blue channel of every purple in a scene, and deep
  purple without its blue is just brown. The key is pure white and the sky fill
  near-neutral on purpose.

---

## What it does on its own

**Loading.** Text renders first. A flat SVG of the same head holds the space,
with the thread in whatever state the scroll has reached — so the crossfade has
nothing to jump. three.js is only fetched once the section is within 80% of a
viewport. It is not in the initial page bundle.

**Failure.** The probe asks for `webgl2` specifically, because three.js dropped
WebGL 1 in r163 and a WebGL-1-only browser otherwise throws *inside* the
renderer constructor, asynchronously, where no error boundary can catch it. If
WebGL 2 is missing, the context is lost, or anything in the canvas subtree
throws, the flat head stays and the canvas is unmounted so its context is
released.

**Quality tiers.** Cores, memory, pointer type, viewport, plus one check for a
software rasteriser (SwiftShader / llvmpipe → always `low`).

| | sections × around | control pts | tube segs | sides | max DPR | AA |
|---|---|---|---|---|---|---|
| high | 168 × 72 | 240 | 560 | 6 | 1.8 | yes |
| medium | 120 × 52 | 170 | 380 | 5 | 1.5 | yes |
| low | 84 × 36 | 110 | 240 | 4 | 1.25 | no |

Handhelds are capped at `medium`. On `low` the strand rebuilds at 30Hz while the
scene keeps rendering at full rate. If the first 2.5 seconds cannot hold ~34fps,
resolution drops once and stays down.

**No shadow maps**, measured rather than assumed: rendering the scene twice so
the strand could cast onto the skull changed the frame by 0.17 of a possible 765
per pixel. The key strikes the thread at too shallow an angle for its shadow to
clear it. The plumbing is in place behind `TIERS[...].shadows`.

**Pose.** The head stands a few degrees off dead profile. A head lit from the
front and seen at exactly ninety degrees loses all of its cheekbone, and a
sculpture with no cheek reads as a cut-out. The cursor adds ±4.6° of yaw and
±2.9° of pitch on top — a lean, never a spin.

**Reduced motion.** Float, breath and cursor lean all stop; the scroll-driven
transformation stays, damped harder so it tracks the wheel directly. All three
states are still shown.

**Memory.** Every geometry and material is created by hand rather than by r3f,
so every one is disposed by hand on unmount. Listeners and observers are torn
down with their effects.

---

## Files

    KnowMind3D.tsx        public component: probes, gating, fallback, crossfade
    KnowMindCanvas.tsx    the r3f Canvas, lighting, adaptive DPR, context guard
    HeadScene.tsx         framing, camera, pose, and the one per-frame update
    Head.tsx              the head and the thread inside it
    headGeometry.ts       the section stack
    ThreadSystem.tsx      the morphing strand
    tube.ts               tube kernel: build once, sweep in place
    states.ts             the three states and everything that differs between them
    constants.ts          the profile, proportions, recess, palette, tiers, timings
    color.ts / math.ts    interpolation
    KnowMindFallback.tsx  the flat SVG, traced from the same profile and states
    useScrollProgress.ts  scroll → ref, no re-renders
    usePerformanceTier.ts device capability guess
    useWebGL2.ts          the probe that matches what three actually needs
