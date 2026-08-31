"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { Reveal } from "@/components/ui/Reveal";
import { beforeAfter } from "@/lib/content";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * The turn in the page: chaos resolving into calm.
 *
 * On large screens the two states occupy the same position and scroll wipes
 * one into the other, so the visitor watches their own sentences change rather
 * than comparing two columns. On small screens — and whenever motion is
 * reduced — the same content stacks as two plain panels.
 */

const { before, after } = beforeAfter;

/* -------------------------------------------------------------------------- */

function Panel({
  tone,
  label,
  quote,
  connector,
  points,
}: {
  tone: "before" | "after";
  label: string;
  quote: string;
  connector: string;
  points: readonly string[];
}) {
  const isBefore = tone === "before";

  return (
    <div
      className={`flex h-full w-full items-center ${
        isBefore ? "bg-wine-950" : "bg-paper"
      }`}
    >
      <div className="container-page py-10 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <span
            className={`text-eyebrow font-semibold tracking-[0.18em] uppercase ${
              isBefore ? "text-cream-dim" : "text-amber-ink"
            }`}
          >
            {label}
          </span>

          <p
            className={`mt-4 font-serif text-h3 italic sm:mt-5 sm:text-h2 ${
              isBefore ? "text-cream" : "text-ink"
            }`}
          >
            &ldquo;{quote}&rdquo;
          </p>

          <p
            className={`mt-5 text-sm sm:mt-6 sm:text-body ${isBefore ? "text-cream-dim" : "text-ink-muted"}`}
          >
            {connector}
          </p>

          <ul className="mt-4 flex flex-col gap-2 sm:mt-5 sm:gap-2.5">
            {points.map((point) => (
              <li
                key={point}
                className={`flex items-start gap-3 text-base sm:text-lead ${
                  isBefore ? "text-cream/80" : "text-ink"
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-[0.7em] h-1 w-1 shrink-0 rounded-full ${
                    isBefore ? "bg-wine-300" : "bg-amber-ink"
                  }`}
                />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function TransformationSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  /**
   * The wipe runs off the page's scroll position against a range we measure
   * ourselves, rather than off `useScroll({ target, offset })`.
   *
   * That hook's progress is not monotonic for a sticky stage like this one: it
   * climbs to ~0.9 while the stage is pinned, then falls back to 0 as the
   * section releases. The wipe therefore played backwards on the way out and
   * put the violet panel back over the white one during ordinary downward
   * scrolling. Measured against a fixed pixel range, progress can only move the
   * way the scroll moves — the transition opens once and stays open, while
   * scrolling back up still reverses it naturally.
   *
   * Lifecycle: progress 0 = INITIAL, 0→0.88 = ACTIVE (the sentence morphs),
   * ≥0.88 = EXITED. Clamped at both ends, so past the section it stays 1.
   */
  // Starts below the document so progress reads 0 — the "before" state — until
  // the first measurement lands. A browser restoring scroll into the middle of
  // this section would otherwise paint one frame of the finished wipe.
  const [range, setRange] = useState<[number, number]>(() => [
    Number.MAX_SAFE_INTEGER,
    Number.MAX_SAFE_INTEGER + 1,
  ]);

  useEffect(() => {
    const measure = () => {
      const el = ref.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      // The stage is pinned for exactly the section's height minus one screen.
      const travel = Math.max(el.offsetHeight - window.innerHeight, 1);
      setRange((prev) =>
        prev[0] === top && prev[1] === top + travel ? prev : [top, top + travel],
      );
    };

    measure();
    // Everything above this section settles after hydration — fonts, the 3D
    // canvas, images — and that moves our start point. Watch the document
    // rather than only listening for resize.
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { scrollY } = useScroll();
  const progress = useTransform(scrollY, range, [0, 1]);

  // The "after" state is revealed upward as the visitor scrolls.
  const clipPath = useTransform(
    progress,
    [0.12, 0.88],
    ["inset(100% 0% 0% 0%)", "inset(0% 0% 0% 0%)"],
  );
  const lineTop = useTransform(progress, [0.12, 0.88], ["100%", "0%"]);

  // Written straight to the DOM: the phase is observable without re-rendering
  // on scroll, so nothing remounts and no animation restarts.
  useMotionValueEvent(progress, "change", (p) => {
    const el = ref.current;
    if (el) el.dataset.phase = p >= 0.88 ? "exited" : p > 0 ? "active" : "initial";
  });

  // The wipe is not a desktop luxury — it is the turn the whole page pivots
  // on. It runs at every width now; only reduced motion opts out.
  const useWipe = !reduced;

  if (!useWipe) {
    return (
      <section
        id="transformation"
        ref={ref}
        aria-labelledby="transformation-heading"
        className="relative"
      >
        <h2 id="transformation-heading" className="sr-only">
          Before and after the journey
        </h2>
        <Panel tone="before" {...before} />
        <Panel tone="after" {...after} />
      </section>
    );
  }

  return (
    <section
      id="transformation"
      ref={ref}
      aria-labelledby="transformation-heading"
      /* Shorter on a phone. The stage is pinned for the section's height minus
         one screen, so 200svh spends a whole extra screen of scrolling on a
         wipe that is already legible in half of it — and on a phone that reads
         as the page having stalled. 160svh leaves ~0.5 screens of travel, which
         is enough for the rule to cross the copy at a readable speed. The
         measured range is derived from `offsetHeight`, so nothing else has to
         know this number changed. */
      className="relative h-[160svh] sm:h-[200svh]"
    >
      <h2 id="transformation-heading" className="sr-only">
        Before and after the journey
      </h2>

      {/* svh, not vh: mobile browser chrome makes vh unreliable for a pinned
          stage, and this one is pinned on phones now too. */}
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Base state */}
        <div className="absolute inset-0">
          <Panel tone="before" {...before} />
        </div>

        {/* Revealed state */}
        <motion.div className="absolute inset-0" style={{ clipPath }}>
          <Panel tone="after" {...after} />
        </motion.div>

        {/* The edge between the two — a single honey rule. */}
        <motion.div
          aria-hidden
          className="absolute inset-x-0 h-px bg-honey"
          style={{ top: lineTop }}
        />
      </div>
    </section>
  );
}
