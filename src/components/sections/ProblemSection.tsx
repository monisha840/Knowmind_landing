"use client";

import { motion } from "motion/react";

import { Reveal, RevealGroup, revealChild } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { problem } from "@/lib/content";

/**
 * Does this sound like you? — and the turn that answers it.
 *
 * One section, not two, deliberately. The deck sets "Does This Sound Like You?"
 * and "You are not lazy." on a single slide because the second only lands as
 * the answer to the first; splitting them into two sections would put a
 * scroll-length of nothing between the question and its relief, and would make
 * an already long page longer. So this is one continuous read in three
 * movements:
 *
 *   RECOGNITION  the question, then the loop in four beats
 *   THE TURN     a rule, a pause, and the one line that reframes all of it
 *   REALISATION  what to do with that
 *
 * The quieting the brief asks for around "You are not lazy." is done with
 * colour and space rather than motion — the beats above it are set in
 * `cream-muted`, the rule fades, and the turn is the only full-strength
 * `cream` on the screen. That way the emphasis survives `prefers-reduced-
 * motion`, where any animated version of it would not.
 *
 * The 3D stays as it was. This section keeps its `data-three-window` opt-in to
 * the shared background object, which is ambient and costs nothing extra. The
 * scroll-driven KnowMind character that once sat above this section has been
 * removed from the page entirely — three screens of 3D asking the visitor to
 * decode a metaphor was the opposite of what this redesign is for.
 */
export function ProblemSection() {
  const last = problem.beats.length - 1;

  return (
    <section
      id="the-problem"
      data-three-window
      aria-labelledby="problem-heading"
      // Deliberately tighter than `.section-y`: this is a beat, not a chapter.
      className="relative py-16 sm:py-20"
    >
      {/* Darkens toward the centre so the copy lands over the 3D. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(12,4,16,0) 0%, rgba(12,4,16,0.88) 22%, rgba(12,4,16,0.94) 78%, rgba(12,4,16,0) 100%)",
        }}
      />

      <div className="container-page">
        {/* ================= 1 · Recognition ================= */}
        <div className="max-w-3xl">
          <Reveal>
            <Eyebrow>{problem.eyebrow}</Eyebrow>
          </Reveal>

          {/*
            The two halves are coloured against each other rather than set in
            one weight: what the visitor believes about themselves, then what
            keeps happening to them. `leading-[1.1]` loosens the h2 token's 1.02
            for the same reason the hero's does — this runs to three lines on a
            phone, and 1.02 closes the descenders up (CLAUDE.md §5.3).
          */}
          <Reveal delay={0.05}>
            <h2
              id="problem-heading"
              className="mt-5 text-h2 leading-[1.1] font-semibold text-balance"
            >
              <span className="text-cream">{problem.heading.hopeful}</span>{" "}
              <span className="text-cream-muted">{problem.heading.pull}</span>
            </h2>
          </Reveal>
        </div>

        {/*
          The loop, in four beats.

          Each beat is one paragraph in two colours — the recognition bright,
          what undoes it quiet — rather than two stacked lines. Same contrast,
          roughly half the height, and it reads as a sentence instead of as a
          card. Two columns from `sm`; a single column on a phone, because a
          full sentence in a 130px cell is not a layout.
        */}
        <RevealGroup
          as="ol"
          className="mt-9 grid gap-x-10 gap-y-5 border-t border-cream/10 pt-7 sm:mt-11 sm:grid-cols-2 sm:gap-y-6 sm:pt-8"
          stagger={0.06}
        >
          {problem.beats.map((beat, i) => (
            <motion.li key={beat.lead} variants={revealChild} className="flex gap-3 sm:gap-4">
              {/* Decorative — the ordered list already carries the sequence.
                  The last marker closes the loop instead of counting it. */}
              <span
                aria-hidden
                className={`mt-[0.4em] shrink-0 text-xs font-medium tabular-nums ${
                  i === last ? "text-honey" : "text-cream-dim"
                }`}
              >
                {i === last ? "↻" : String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-body">
                <span className="font-medium text-cream">{beat.lead}</span>{" "}
                <span className="text-cream-muted">{beat.follow}</span>
              </p>
            </motion.li>
          ))}
        </RevealGroup>

        {/* ================= 2 · The turn ================= */}
        {/*
          The pause. A hairline, then space, then the one line the whole section
          exists to deliver. Centred and at `text-h1` — the largest type in the
          section by a clear step, so it cannot read as another paragraph.

          It is an `h3` under the section's `h2`: subordinate in the outline,
          dominant on the screen. Using a type token independently of the
          heading level is the established pattern here (CLAUDE.md §13.1).
        */}
        <div className="mt-12 border-t border-cream/10 pt-11 text-center sm:mt-16 sm:pt-14">
          <Reveal y={32}>
            <h3 className="text-h1 font-semibold text-cream">
              {problem.turn.before}
              <span className="text-honey">{problem.turn.accent}</span>
              {problem.turn.after}
            </h3>
          </Reveal>

          {/* Instrument Serif, which this design reserves for emotional lines
              rather than UI (§5.2). It is what makes the answer land as
              empathy rather than as a correction. */}
          <Reveal delay={0.12}>
            <p className="mx-auto mt-6 max-w-2xl font-serif text-lead text-cream-muted italic">
              {problem.turnSupport}
            </p>
          </Reveal>
        </div>

        {/* ================= 3 · The realisation ================= */}
        <div className="mt-11 text-center sm:mt-14">
          <Reveal>
            <p className="mx-auto max-w-2xl text-h3 font-semibold text-cream text-balance">
              {problem.realisation}
            </p>
          </Reveal>

          {/* The deck's two closing lines run together as one thought: the
              second names what "understand yourself better" actually means,
              and giving it its own block would have bought a paragraph break
              at the cost of another screen of scrolling. */}
          <Reveal delay={0.08}>
            <p className="mx-auto mt-5 max-w-xl text-lead text-honey">
              {problem.realisationSupport}{" "}
              <span className="text-cream-muted">{problem.realisationDetail}</span>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
