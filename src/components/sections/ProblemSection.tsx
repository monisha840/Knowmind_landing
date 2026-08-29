"use client";

import { motion } from "motion/react";

import { Reveal, RevealGroup, revealChild } from "@/components/ui/Reveal";
import { struggles } from "@/lib/content";

/**
 * The reframe.
 *
 * This is a beat, not a content section: the visitor should recognise their own
 * loop in a couple of seconds and move on to the method. So the six supplied
 * patterns are set as one compact chain — label, arrow, two small lines — rather
 * than six full-width rows, and the section runs on a tighter vertical rhythm
 * than `.section-y` so it reads as a single held thought.
 */
export function ProblemSection() {
  const lastIndex = struggles.length - 1;

  return (
    <section
      id="the-problem"
      data-three-window
      aria-labelledby="problem-heading"
      // Deliberately tighter than `.section-y` — see the note above.
      className="relative py-16 sm:py-20"
    >
      {/* Darkens toward the centre so the headline lands over the 3D. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(12,4,16,0) 0%, rgba(12,4,16,0.88) 22%, rgba(12,4,16,0.94) 78%, rgba(12,4,16,0) 100%)",
        }}
      />

      <div className="container-page">
        {/* ---- The reframe ---- */}
        <div className="max-w-3xl">
          <Reveal>
            <p className="text-eyebrow font-semibold tracking-[0.18em] text-cream-dim uppercase">
              Before anything else
            </p>
          </Reveal>

          <Reveal delay={0.05}>
            <h2 id="problem-heading" className="mt-5 text-h1 font-semibold text-cream">
              You are <span className="text-honey">not</span> lazy.
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-5 max-w-xl text-lead text-cream-muted">
              Maybe you are simply exhausted from starting again and stopping again.
            </p>
          </Reveal>
        </div>

        {/* ---- The loop, as one scannable chain ---- */}
        <RevealGroup
          as="ul"
          className="mt-10 grid grid-cols-2 gap-x-5 gap-y-6 border-t border-cream/10 pt-7 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-8 lg:grid-cols-6 lg:gap-x-6"
          stagger={0.05}
        >
          {struggles.map((item, i) => (
            <motion.li key={item.key} variants={revealChild} className="group">
              {/* `flex-wrap` is insurance, not decoration: at 320px two of these
                  labels are within a few pixels of the column width, and a
                  wrapped arrow is far cheaper than a sideways scroll. */}
              <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 sm:gap-x-2">
                <span className="text-xs font-medium tabular-nums text-cream-dim">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {/* Stays at 14px through `lg`, where six columns are only ~140px
                    wide; the 16px step waits for `xl`, where they are ~180px. */}
                <span className="text-sm font-semibold tracking-[0.08em] text-cream uppercase transition-colors duration-300 group-hover:text-honey xl:text-base xl:tracking-[0.12em]">
                  {item.label}
                </span>
                {/* The chain: each pattern hands over to the next, and the last
                    one hands back to the first. */}
                <span aria-hidden className="text-honey/70">
                  {i === lastIndex ? "↻" : "→"}
                </span>
              </p>

              <p className="mt-2 text-xs leading-relaxed text-cream-muted sm:text-sm">
                {item.line1} {item.line2}
              </p>
            </motion.li>
          ))}
        </RevealGroup>

        <Reveal delay={0.06}>
          <p className="mt-7 flex items-center gap-3 text-eyebrow font-semibold tracking-[0.18em] text-honey uppercase">
            <span aria-hidden className="h-px w-8 bg-honey/50" />
            And the cycle repeats.
          </p>
        </Reveal>

        {/* ---- The hand-off to the method ---- */}
        <div className="mt-8 flex flex-col gap-5 border-t border-cream/10 pt-7 sm:flex-row sm:items-end sm:justify-between sm:gap-12">
          <Reveal>
            <p className="max-w-md text-body text-cream-muted">
              You don&rsquo;t need another motivational speech. You don&rsquo;t need more
              information.
            </p>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="sm:text-right">
              <p className="text-eyebrow font-semibold tracking-[0.18em] text-cream-dim uppercase">
                You need
              </p>
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-h3 font-semibold text-honey sm:justify-end">
                <span>Awareness</span>
                <span className="text-gold/50">+</span>
                <span>Action</span>
                <span className="text-gold/50">+</span>
                <span>Repetition</span>
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
