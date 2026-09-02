"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";

import { kalee } from "@/lib/content";

/**
 * The hero portrait, given depth.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS IS
 * ---------------------------------------------------------------------------
 *
 * The artwork is a single flat WebP: a finished piece of art direction that
 * arrives already graded to the brand's purple, already carrying its own gold
 * rim, with the GROWTH lettering composed into the frame. Nothing here
 * redesigns it. At rest — before hydration, with JavaScript off, under reduced
 * motion, once the hero scrolls away — what renders is the composition that was
 * always here, in register, pixel for pixel.
 *
 * What this adds is parallax between planes the picture already contains, and
 * two lights the picture already implies.
 *
 * ---------------------------------------------------------------------------
 * WHY NOT WEBGL
 * ---------------------------------------------------------------------------
 *
 * The whole effect is bounded at roughly five pixels of travel. At that
 * amplitude a depth-map displacement shader and a CSS transform are visually
 * identical, so three.js would buy nothing — and it would cost the one thing
 * this composition cannot lose. The portrait is dissolved into the hero by four
 * intersecting CSS mask ramps (`portraitEdge` below); rasterising it into a
 * canvas hands that job to a shader and puts a rectangle back on the page. The
 * repo already ships three.js for the background scene and the KnowMind
 * character, so this is not a bundle argument — it is a compositing one.
 *
 * So: DOM layers, CSS masks, one rAF loop writing two custom properties.
 * No new dependency.
 *
 * ---------------------------------------------------------------------------
 * WHERE THE DEPTH COMES FROM
 * ---------------------------------------------------------------------------
 *
 * A flat image has no planes to separate — unless the composition itself is
 * built out of them, and this one is. It is split by a hard vertical seam at
 * x = 63.7% (measured off the plate, not guessed): the portrait to its left,
 * the GROWTH column to its right. That seam is a real compositional boundary,
 * so a second copy of the picture masked to the right of it is a real
 * foreground plane rather than an invented one.
 *
 * Five planes, back to front, each moving a little more than the one behind:
 *
 *   BED       the glow the hero paints behind him       +5.0px  (moves *with*
 *                                                                the pointer)
 *   FIGURE    the photograph                            -6.0px
 *   TYPE      the GROWTH column, a masked second copy   -8.4px
 *   MATERIAL  the two gradients that light that column  -10.5 / -12.0px
 *   GLASS     the reflection in his lens                +9.0px  (counter again)
 *
 * All of it inside a slab that tilts by up to 1.8 degrees — see `TILT`, which
 * is what actually makes the depth legible.
 *
 * The bed and the glass move *against* the rest, which is what buys the
 * separation cheaply: 4px one way and 5px the other reads as 9px of depth while
 * nothing on screen has moved more than 5px. See `DEPTH` for why these are not
 * smaller.
 *
 * ---------------------------------------------------------------------------
 * THE ONE RULE THAT MATTERS
 * ---------------------------------------------------------------------------
 *
 * A layer masked by geometry taken from the artwork must move *exactly* with
 * the artwork. The rim light is masked by his own silhouette and the specular
 * is masked to his own lens; let either drift a single pixel against the
 * picture and the light slides off the edge it is meant to be lighting, and the
 * illusion collapses into a decal. So both are locked to FIGURE, and the motion
 * that makes them feel alive happens *inside* them — the travelling band within
 * the rim, the streak within the lens.
 *
 * Depth is carried by the planes. Life is carried by the light within a plane.
 */

const PORTRAIT = "/kalee/hero-growth.webp";

/**
 * His own gold rim, lifted out of the picture as an alpha matte by
 * `scripts/optimize-assets.mjs` — see the note on that job for how it is
 * extracted and why it is a PNG. It is derived from the portrait, so it cannot
 * fall out of register with it: replace the artwork, re-run the script, and the
 * light still traces the silhouette.
 */
const RIM_MATTE = "/kalee/hero-growth-rim.png";

/** The frame's own proportions, so `contain` fits exactly and leaves no gap. */
const PORTRAIT_ASPECT = "940 / 1215";

/**
 * The edges, dissolved.
 *
 * Three ramps intersected — left, right and bottom. Without them the picture
 * ends on three hard lines and reads as a rectangle pasted onto the hero,
 * which is the one thing this composition must not look like. The top is left
 * alone deliberately: his hair starts a few pixels below the frame edge, and a
 * ramp there would eat into it.
 *
 * The percentages are chosen against the image itself. His face occupies
 * roughly 22–53% of the width and the GROWTH letters end around 79%, so the
 * left and right ramps only ever touch background.
 */
const EDGE_RAMPS = [
  "linear-gradient(to right, transparent 0%, #000 17%)",
  "linear-gradient(to left, transparent 0%, #000 7%)",
  "linear-gradient(to top, transparent 0%, #000 4%)",
  "linear-gradient(to bottom, transparent 0%, #000 4.5%)",
];

const portraitEdge = {
  WebkitMaskImage: EDGE_RAMPS.join(", "),
  maskImage: EDGE_RAMPS.join(", "),
  WebkitMaskComposite: "source-in",
  maskComposite: "intersect",
} as const;

/**
 * The same feather, intersected with his silhouette.
 *
 * Applied from the effect rather than rendered into the markup, and that is a
 * performance decision, not a stylistic one. A `mask-image: url(…)` sitting in
 * server-rendered inline style is visible to the preload scanner, so the
 * browser fetches the matte while it is still parsing the document: measured,
 * it landed at 77ms, competing with the 89 kB portrait for the LCP window it is
 * supposed to stay out of. Withholding the URL until the effect asks for it
 * moves that fetch to ~650ms, behind the picture, where an enhancement belongs.
 *
 * Setting it here does cost one extra conditional request — `next start` serves
 * /public with `max-age=0`, so the mask resolves the URL a second time and gets
 * a 304 back. Measured at 300 bytes, which is not worth a workaround.
 *
 * The matte is listed first because `-webkit-mask-composite: source-in` folds
 * the list left to right and the ramps are what gets cut down. Both spellings
 * are set: WebKit's keyword vocabulary predates the standard property and the
 * two do not share names.
 *
 * The feather is not optional here. His lapel light runs out to x≈3%, where the
 * left ramp has faded the picture underneath almost to nothing — an unfeathered
 * glow there would hang in empty space with no shoulder beneath it.
 */
const RIM_MASK: ReadonlyArray<[string, string]> = [
  ["-webkit-mask-image", ["url(" + RIM_MATTE + ")", ...EDGE_RAMPS].join(", ")],
  ["mask-image", ["url(" + RIM_MATTE + ")", ...EDGE_RAMPS].join(", ")],
  ["-webkit-mask-size", "100% 100%"],
  ["mask-size", "100% 100%"],
  ["-webkit-mask-composite", "source-in"],
  ["mask-composite", "intersect"],
];

/**
 * The GROWTH column, isolated as a foreground plane.
 *
 * The ramp opens at the seam (63.7%) and is solid by 74%, so from 74% rightward
 * this copy replaces the base outright and there is nothing to double. Only the
 * band between them cross-fades two copies of the same pixels 2.2px apart — and
 * that band holds the letters' left stems, dark plum on dark plum, plus the
 * ghosted repeat of his face, which is soft by design. Checked at 4x zoom
 * against the same frame at rest: no doubling on the seam or the letterforms.
 *
 * The ramp was widened from 72% to 74% when the amplitudes went up, to spread
 * the cross-fade over more distance as the offset grew.
 *
 * This is why TYPE sits 2.2px from FIGURE rather than 5px: the separation
 * budget here is set by what the seam can absorb, not by taste. The depth the
 * column actually reads with comes from the two gradients above it, which are
 * soft and can move as far as they like.
 */
const typeColumn = {
  WebkitMaskImage: "linear-gradient(to right, transparent 63.7%, #000 74%)",
  maskImage: "linear-gradient(to right, transparent 63.7%, #000 74%)",
} as const;

/**
 * His lens, measured off the plate: the glass spans x 36–62%, y 33–44%, and
 * this ellipse sits comfortably inside it. Bounding the reflection matters more
 * than lighting it — an unbounded highlight lands on his eyebrow and immediately
 * stops being glass.
 *
 * Only the near lens. The frame carries a ghosted repeat of his face behind the
 * lettering, and the art direction deliberately holds it back; the existing
 * gold ramp already starts right of it for the same reason.
 */
const lensMask = {
  WebkitMaskImage: "radial-gradient(ellipse 11% 4.6% at 48.8% 38.5%, #000 22%, transparent 74%)",
  maskImage: "radial-gradient(ellipse 11% 4.6% at 48.8% 38.5%, #000 22%, transparent 74%)",
} as const;

/**
 * How far each plane travels, in px, at full pointer excursion.
 *
 * These were half this size to begin with, chosen against the brief's "1-3px".
 * Measured on the built page that put the portrait's whole travel at 4.6px, or
 * 0.69% of its width, and it was invisible — correctly implemented and below
 * the threshold at which a person can see anything at all.
 *
 * The reason is specific to this composition rather than a matter of taste.
 * Parallax is perceived against a reference, and this portrait deliberately has
 * none: it is feathered into the hero on four sides precisely so that no edge
 * is visible. With no boundary to move against, a few pixels of displacement on
 * a soft-edged image over a soft-edged ground reads as nothing.
 *
 * So the separation is carried where it can be seen. BED against FIGURE is the
 * load-bearing pair — 9px of relative travel between them, and safe to push
 * because the bed is a smooth gradient with no detail to smear. TYPE stays
 * close to FIGURE for the seam reason documented on `typeColumn`; what sells
 * the column's depth is the two gradients above it, which are soft and can
 * move freely.
 */
const DEPTH = {
  bed: [5.0, 2.8],
  figure: [-6.0, -3.4],
  type: [-8.4, -4.6],
  knock: [-10.5, -5.6],
  goldEdge: [-12.0, -6.2],
  glass: [9.0, 5.0],
} as const;

type Depth = (typeof DEPTH)[keyof typeof DEPTH];

const plane = (d: Depth) => ({
  transform:
    "translate3d(calc(var(--hp-x, 0) * " +
    d[0] +
    "px), calc(var(--hp-y, 0) * " +
    d[1] +
    "px), 0)",
});

/**
 * The tilt, and why translation alone was never going to work.
 *
 * Two rounds of raising the parallax did not make this composition read as
 * dimensional, and more pixels would not have fixed it either. Sliding layers
 * sideways is not what the eye uses to judge depth — foreshortening is. Worse,
 * this portrait is deliberately feathered into the hero on all four sides, so
 * there is no edge anywhere to measure a displacement against. Translation with
 * no reference frame is close to invisible however far you push it, and pushing
 * it far enough to notice would just look like the picture sliding about.
 *
 * A tilt changes the picture's *shape* rather than its position, which needs no
 * reference to be read. Under 1400px of perspective, 1.8 degrees is enough for
 * the near side to grow and the far side to shrink perceptibly, and small
 * enough that nobody can point at a rotation — which is exactly the register
 * the brief asked for: the question should be "why does this feel 3D", not
 * "look, it's rotating".
 *
 * It is one transform on one wrapper, deliberately. The layered translations
 * keep doing the parallax *inside* the slab, and because every layer shares
 * this single rotation, the two masks cut from the artwork — the silhouette and
 * the lens — stay in register with the picture they are lighting. A per-layer
 * rotation would break that on the first frame.
 */
const TILT = {
  transform:
    "rotateY(calc(var(--hp-x, 0) * 1.8deg)) rotateX(calc(var(--hp-y, 0) * -1.1deg))",
};

/** Drift amplitude without a pointer, where the motion is autonomous and must not be noticed. */
const COARSE_AMPLITUDE = 0.55;

/** ~300ms to settle. Frame-rate corrected below, so it is a duration and not a per-frame step. */
const SETTLE = 0.06;

export function LivingPortrait({ className }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    // The added lights are revealed from here rather than declared in the
    // markup, so a browser that cannot mask — where the rim matte would fail
    // open into a gold rectangle across his face — simply never shows them.
    // Failing closed costs only the enhancement; the composition underneath is
    // already complete.
    const canMask =
      CSS.supports("mask-image", "url(x.png)") ||
      CSS.supports("-webkit-mask-image", "url(x.png)");

    let disposed = false;

    // The mask is attached and the lights revealed only once the matte has
    // actually decoded. That order is what makes this safe: until the matte
    // exists there is no `mask-image` on the rim layer at all, so the one frame
    // in which an unmasked gold rectangle could paint across his face never
    // gets to happen. The layer is also still at `opacity: 0` throughout, which
    // is the second lock on the same door.
    const loadMatte = () => {
      const rim = el.querySelector<HTMLElement>(".hp-rim");
      const matte = new Image();
      matte.src = RIM_MATTE;
      matte
        .decode()
        .then(() => {
          if (disposed || !rim) return;
          for (const [prop, value] of RIM_MASK) rim.style.setProperty(prop, value);
          el.dataset.hpLit = "true";
        })
        .catch(() => {
          /* No matte, no added light. The artwork is already complete without it. */
        });
    };

    // Reduced motion is answered by never starting, not by animating to zero:
    // no loop, no listener, no observer. The custom properties stay unset,
    // every plane falls back to 0 through its `var(--hp-x, 0)` default, and
    // what renders is the artwork in register. The rim still gets its light —
    // held still by the reduced-motion rule in globals.css — because a soft
    // warm edge that never moves is a treatment, not an animation.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const amplitude = fine ? 1 : COARSE_AMPLITUDE;

    let frame = 0;
    let last = 0;
    let visible = false;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const tick = (now: number) => {
      const dt = last ? Math.min(now - last, 64) : 16.7;
      last = now;

      if (!fine && visible) {
        // No pointer to follow, so the light does the moving instead. Two
        // periods with no common multiple, which is what keeps a phone's idle
        // hero from visibly looping.
        target.x = Math.sin(now / 4300) * amplitude;
        target.y = Math.sin(now / 6700) * amplitude;
      }

      // Frame-rate corrected exponential ease, so a 120Hz display and a
      // throttled tab settle over the same ~300ms rather than over the same
      // number of frames.
      const k = 1 - Math.pow(1 - SETTLE, dt / 16.7);
      current.x += (target.x - current.x) * k;
      current.y += (target.y - current.y) * k;

      el.style.setProperty("--hp-x", current.x.toFixed(4));
      el.style.setProperty("--hp-y", current.y.toFixed(4));

      // Off screen and settled: stop completely. The planes are back in
      // register, so stopping here is indistinguishable from never having run.
      if (!visible && Math.abs(current.x) < 0.001 && Math.abs(current.y) < 0.001) {
        el.style.setProperty("--hp-x", "0");
        el.style.setProperty("--hp-y", "0");
        frame = 0;
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (frame || disposed) return;
      last = 0;
      frame = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (!visible) return;
      target.x = ((e.clientX / window.innerWidth) * 2 - 1) * amplitude;
      target.y = ((e.clientY / window.innerHeight) * 2 - 1) * amplitude;
      start();
    };

    // Leaving the viewport hands the loop a target of zero rather than killing
    // it outright, so the planes ease home and *then* it stops. Scrolling past
    // the hero at speed never leaves it frozen mid-excursion.
    let io: IntersectionObserver | null = null;

    // Everything above this point only defines work. Nothing has observed,
    // listened, fetched or scheduled a frame yet — and that is the point.
    //
    // The whole effect waits for the main thread to go quiet, for two reasons
    // that happen to agree.
    //
    // Measured on the production build, starting eagerly cost ~120ms of LCP.
    // The work is individually small — a PNG decode, an observer, a rAF loop
    // writing two custom properties — but it lands squarely in hydration, where
    // it competes with the entrance animation that the largest element is
    // actually waiting on.
    //
    // And the hero's own entrance runs to ~1.55s. Parallax during that fade is
    // motion nobody asked for on a composition that has not finished arriving,
    // and a gold light that shows up mid-fade reads as part of the page loading
    // rather than as something the picture does. Waiting fixes both, and the
    // effect gets to begin the way it should: on a hero that has settled.
    const begin = () => {
      if (disposed) return;
      if (canMask) loadMatte();
      if (reduced) return;

      io = new IntersectionObserver(
        (entries) => {
          visible = entries[entries.length - 1].isIntersecting;
          el.dataset.hpActive = visible ? "true" : "false";
          if (!visible) {
            target.x = 0;
            target.y = 0;
          }
          start();
        },
        { threshold: 0.2 },
      );
      io.observe(el);

      if (fine) window.addEventListener("pointermove", onMove, { passive: true });
    };

    // A short fixed delay, and deliberately not `requestIdleCallback`.
    //
    // Idle never arrives on this page. The hero opts into the shared 3D
    // background, which holds a rAF loop for as long as it is on screen, so the
    // callback always fell through to its 2600ms timeout — and with the 1.2s
    // reveal behind it the gold light did not finish arriving until 3.46s,
    // measured from navigation. Long enough that the effect simply was not
    // there for anyone who looked at the hero and scrolled.
    //
    // 400ms is past first paint and past the worst of hydration, and lands
    // inside the portrait's own 0.45-1.55s entrance, so the light comes up with
    // the picture rather than arriving late on top of a settled one.
    const timer = window.setTimeout(begin, 400);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      io?.disconnect();
      if (fine) window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <motion.div
      ref={root}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.45, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      style={{ aspectRatio: PORTRAIT_ASPECT, perspective: "1400px" }}
      className={"relative " + (className ?? "")}
    >
      {/* The slab. Everything below tilts together; the parallax happens
          between the layers inside it. `perspective` lives on the parent
          because a rotation is only foreshortened by an ancestor's
          perspective — set it here and the rotation would be an affine shear
          with no near side and no far side, which is the flat-looking version
          of this effect. */}
      <div className="absolute inset-0" style={TILT}>
      {/* The bed.

          Measured, not guessed: the picture's own background sits at
          rgb(15,5,25) while the hero's is rgb(12,4,16) — nine points of
          blue apart. That gap is the whole reason it reads as a rectangle
          laid on top, because feathering an edge only helps if the two
          sides meet at the same tone. So rather than darkening him, this
          lifts the hero to meet him, spilling past his bounds so the ramps
          dissolve into an identical colour instead of into a darker field.

          It is also the back plane, and it drifts *with* the pointer while he
          drifts against it. Most of the separation in this composition comes
          from those two small opposing moves rather than from either of them
          travelling far. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[16%] z-0"
        style={{
          ...plane(DEPTH.bed),
          background:
            "radial-gradient(50% 50% at 50% 47%, rgba(16,6,27,0.98) 0%, rgba(15,5,25,0.62) 52%, rgba(12,4,16,0) 78%)",
        }}
      />
      {/* Light spilling from behind him — layer 0, explicitly below the
          picture. A positioned element outranks a static sibling, so without
          these z-indices the glow washes across his face. It reads only
          through the feathered left edge, which is what keeps it
          a halo rather than an outline. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          ...plane(DEPTH.bed),
          background:
            "radial-gradient(38% 54% at 27% 44%, rgba(254,183,55,0.34) 0%, transparent 70%), " +
            "radial-gradient(62% 62% at 40% 38%, rgba(254,183,55,0.13) 0%, transparent 76%)",
        }}
      />

      {/* FIGURE — the photograph, and the hero's LCP element. Untouched:
          eagerly fetched, not lazy, not wrapped in anything that could delay
          it. A transform is a compositor property, so carrying one costs the
          first paint nothing. */}
      <img
        src={PORTRAIT}
        alt={kalee.name + " – Growth"}
        fetchPriority="high"
        decoding="async"
        style={{ ...portraitEdge, ...plane(DEPTH.figure) }}
        className="relative z-[1] h-full w-full object-contain"
      />

      {/* TYPE — the GROWTH column as its own plane.

          The same file, so it is the same bytes out of cache: one extra decode,
          no extra request. It is the picture's own right-hand third, lifted
          forward by 1.1px relative to him.

          `alt=""` and `aria-hidden`, because it is literally the same pixels as
          the image above. Announcing the portrait twice would be worse than not
          announcing it at all. */}
      <img
        src={PORTRAIT}
        alt=""
        aria-hidden
        decoding="async"
        style={{ ...typeColumn, ...plane(DEPTH.type) }}
        className="pointer-events-none absolute inset-0 z-[2] h-full w-full object-contain"
      />

      {/* The GROWTH column, knocked back. It is part of the photograph, so
          it cannot be re-typeset — but it can be given less contrast, which
          is what keeps his face the focal point rather than the lettering.
          The ramp reaches transparent by 52% and his face occupies 20-62%
          of the frame, so none of it touches him. Masked with the same edge
          ramp as the picture so it cannot square off the corner.

          It is now also the column's cast shadow. It sits in front of the
          lettering and further still in front of him, so the dark edge tucked
          against the seam deepens on one side of a pointer sweep and thins on
          the other. That, rather than the 1.1px translation, is what actually
          reads as the letters having thickness. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{
          ...portraitEdge,
          ...plane(DEPTH.knock),
          background:
            "linear-gradient(to left, rgba(12,4,16,0.30) 0%, rgba(12,4,16,0.12) 26%, rgba(12,4,16,0) 52%)",
        }}
      />
      {/* A thin gold light on the GROWTH lettering.

          `overlay`, after trying `dodge` and `screen` and rejecting both.
          The lettering reads rgb(38,27,48) — a purple, with more blue in
          it than red. Dodge and screen can only raise channels, so on a
          purple they lift red toward the blue and land on pink rather than
          gold. Overlay multiplies in the shadows: it drives red and green
          up *and* blue down, taking rgb(38,27,48) to roughly rgb(76,39,21)
          — actually warm. The field around the letters is far darker, so
          it barely moves, which is what keeps this a glow on the type
          instead of a lighter block. The ramp is transparent until 56% and
          his face occupies 20-62% of the frame, so no gold lands on him.

          It starts at 64% rather than 56% for a second reason: the frame
          carries a ghosted repeat of his face behind the lettering at
          57-75%, and being brighter than the type it caught far more of
          the overlay, going visibly orange. Beginning right of the split
          leaves the ghost alone and puts the gold on the letters.

          The frontmost of the type planes, so its highlight rakes across the
          letterforms slightly ahead of everything else — the material response
          that sells the column as a solid object rather than as ink printed on
          a photograph. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[3] mix-blend-overlay"
        style={{
          ...portraitEdge,
          ...plane(DEPTH.goldEdge),
          background:
            "linear-gradient(to right, transparent 64%, rgba(230,180,76,0.18) 73%, rgba(254,183,55,0.40) 86%, rgba(254,183,55,0.24) 100%)",
        }}
      />

      {/* ------------------------------------------------------------------
          The travelling rim light.

          Locked to FIGURE — see the header note. The matte is his silhouette,
          so a pixel of drift slides the light off the edge it is lighting.
          What moves is the band *inside* it, on a CSS keyframe rather than from
          the rAF loop: a transform animation the compositor owns outright, that
          the reduced-motion rule in globals.css already neutralises, and that
          pauses from a data attribute when he leaves the viewport.

          `screen` rather than `plus-lighter`: the rim's core is already close to
          clipping, so an additive blend does almost nothing there, while the
          matte's soft falloff — blurred before the downsample, deliberately —
          has headroom to spare. The band therefore blooms the *shoulders* of
          the rim rather than its centre, and blooming shoulders is most of the
          difference between light and a drawn stroke.
          ------------------------------------------------------------------ */}
      <div
        aria-hidden
        className="hp-lit hp-rim pointer-events-none absolute inset-0 z-[4] mix-blend-screen"
        style={plane(DEPTH.figure)}
      >
        {/* Exactly the frame's own height, so the band's thickness and its
            travel are both read in frame percentages and stay honest. An
            oversized carrier here makes the gradient's stops resolve against
            the carrier instead, which turns the travelling band into a
            full-height pulse — the light stops moving along him and simply
            swells on and off. */}
        <div className="hp-rim-sweep absolute inset-0" />
      </div>

      {/* ------------------------------------------------------------------
          The lens.

          Same rule, same decomposition: the wrapper carries the lens ellipse
          and is locked to FIGURE so it stays over the glass, while the streak
          inside runs counter to him — which is how a reflection behaves when
          the viewer moves rather than the surface. The two together slide the
          highlight ~7px across the lens out of 2.4px of actual movement.

          A bar and not a blob: real glasses catch a softbox, and the linear
          form is most of why this reads as glass at all. Warm white from the
          cream ramp, kept low enough that nothing about it glows.
          ------------------------------------------------------------------ */}
      <div
        aria-hidden
        className="hp-lit pointer-events-none absolute inset-0 z-[5] mix-blend-screen"
        style={{ ...lensMask, ...plane(DEPTH.figure) }}
      >
        <div
          className="absolute inset-0"
          style={{
            ...plane(DEPTH.glass),
            background:
              "linear-gradient(104deg, transparent 36%, rgba(255,247,233,0.10) 45%, rgba(255,252,246,0.19) 50%, rgba(255,247,233,0.10) 55%, transparent 64%)",
          }}
        />
      </div>
      </div>
    </motion.div>
  );
}
