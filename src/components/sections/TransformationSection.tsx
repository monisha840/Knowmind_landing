"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { Reveal } from "@/components/ui/Reveal";
import { beforeAfter } from "@/lib/content";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";

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
      <div className="container-page py-16">
        <div className="mx-auto max-w-2xl">
          <span
            className={`text-eyebrow font-semibold tracking-[0.18em] uppercase ${
              isBefore ? "text-cream-dim" : "text-amber-ink"
            }`}
          >
            {label}
          </span>

          <p
            className={`mt-5 font-serif text-h2 italic ${
              isBefore ? "text-cream" : "text-ink"
            }`}
          >
            &ldquo;{quote}&rdquo;
          </p>

          <p
            className={`mt-6 text-body ${isBefore ? "text-cream-dim" : "text-ink-muted"}`}
          >
            {connector}
          </p>

          <ul className="mt-5 flex flex-col gap-2.5">
            {points.map((point) => (
              <li
                key={point}
                className={`flex items-start gap-3 text-lead ${
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
  const isDesktop = useMediaQuery("(min-width: 1024px)");
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

  const useWipe = isDesktop && !reduced;

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
      className="relative h-[200vh]"
    >
      <h2 id="transformation-heading" className="sr-only">
        Before and after the journey
      </h2>

      <div className="sticky top-0 h-screen overflow-hidden">
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
