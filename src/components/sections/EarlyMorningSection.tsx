"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { Reveal } from "@/components/ui/Reveal";
import { tamil } from "@/lib/content";
import { programDetails } from "@/lib/config";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * The hinge of the page: first light.
 *
 * The sun is drawn rather than photographed, and it rises once when the
 * section is reached — the only literal image in an otherwise abstract page,
 * because 5:30 AM is the one concrete promise being made.
 */
export function EarlyMorningSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const reduced = usePrefersReducedMotion();

  const risen = inView || reduced;

  return (
    <section
      id="why-early"
      aria-labelledby="early-heading"
      className="relative overflow-hidden bg-paper text-ink"
    >
      {/* First light, warming the page from the horizon up. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 108%, rgba(254,183,55,0.5) 0%, rgba(230,180,76,0.22) 32%, rgba(251,247,242,0) 68%)",
        }}
      />

      <div ref={ref} className="container-page section-y relative">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-3 text-eyebrow font-semibold tracking-[0.18em] text-amber-ink uppercase">
              <span aria-hidden className="h-px w-8 bg-current opacity-60" />
              The hour
            </span>
          </Reveal>

          <Reveal delay={0.06}>
            <h2 id="early-heading" className="mt-6 text-h1 font-semibold text-ink">
              Why {programDetails.timeShort}?
            </h2>
          </Reveal>
        </div>

        {/* ---- The sun ---- */}
        <div className="relative mx-auto mt-12 h-[13rem] w-full max-w-3xl sm:h-[17rem]">
          <svg viewBox="0 62 400 140" className="h-full w-full" aria-hidden>
            <defs>
              <linearGradient id="sunFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#feb737" />
                <stop offset="100%" stopColor="#e6b44c" />
              </linearGradient>
              <clipPath id="horizonClip">
                <rect x="0" y="0" width="400" height="160" />
              </clipPath>
            </defs>

            {/* Rays */}
            <g clipPath="url(#horizonClip)">
              {Array.from({ length: 11 }).map((_, i) => {
                const angle = (-90 + (i - 5) * 15) * (Math.PI / 180);
                const x = 200 + Math.cos(angle) * 178;
                const y = 160 + Math.sin(angle) * 178;
                return (
                  <motion.line
                    key={i}
                    x1={200}
                    y1={160}
                    x2={x}
                    y2={y}
                    stroke="#e6b44c"
                    strokeWidth="1"
                    strokeOpacity="0.3"
                    initial={reduced ? false : { pathLength: 0, opacity: 0 }}
                    animate={risen ? { pathLength: 1, opacity: 1 } : undefined}
                    transition={{ duration: 0.9, delay: 0.35 + i * 0.035, ease: [0.22, 1, 0.36, 1] }}
                  />
                );
              })}

              {/* The disc, rising past the horizon */}
              <motion.circle
                cx="200"
                cy="160"
                r="70"
                fill="url(#sunFill)"
                initial={reduced ? false : { cy: 240, opacity: 0 }}
                animate={risen ? { cy: 160, opacity: 1 } : undefined}
                transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </g>

            {/* Horizon */}
            <line x1="0" y1="160" x2="400" y2="160" stroke="#2a0f22" strokeOpacity="0.25" />

            <text
              x="200"
              y="184"
              textAnchor="middle"
              className="fill-ink-muted"
              style={{ fontSize: 11, letterSpacing: "0.18em", fontWeight: 600 }}
            >
              {programDetails.timeLabel.toUpperCase()}
            </text>
          </svg>
        </div>

        {/* ---- The argument ---- */}
        <div className="mx-auto mt-14 max-w-2xl text-center">
          <Reveal>
            <p className="text-h3 font-medium text-ink">
              Before the world starts demanding your attention —
              <br />
              you give 45 minutes to yourself.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-lead text-ink-muted">
              <span>No office.</span>
              <span>No meetings.</span>
              <span>No notifications.</span>
            </p>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-h2 font-semibold text-ink">
              <span>You</span>
              <span className="text-amber-ink">+</span>
              <span>Your growth</span>
            </p>
          </Reveal>
        </div>

        {/* ---- Permission to miss a day ---- */}
        <Reveal>
          <div className="mx-auto mt-20 max-w-2xl rounded-card border border-ink/10 bg-paper/70 p-9 text-center backdrop-blur-sm sm:p-11">
            <p className="text-eyebrow font-semibold tracking-[0.18em] text-ink-muted uppercase">
              Miss a day?
            </p>

            <p lang="ta" className="mt-6 font-tamil text-h3 font-medium text-ink">
              {tamil.itsOkay}
            </p>

            <p className="mt-6 text-lead text-ink-muted">Don&rsquo;t disappear.</p>

            <p lang="ta" className="mt-6 font-tamil text-h3 font-medium text-amber-ink">
              {tamil.nextDay}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
