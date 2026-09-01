"use client";

import { motion } from "motion/react";

import { philosophyIcons } from "@/components/ui/MethodIcons";
import { Reveal, RevealGroup, revealChild } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { philosophy } from "@/lib/content";

/**
 * What is 1% Better Every Day? — the explainer.
 *
 * This replaces the auto-rotating five-node wheel that stood here. That version
 * showed one stage at a time and advanced itself every 3.6 seconds, which meant
 * a visitor could not read the model without waiting eighteen seconds for it to
 * come round — the brief rules out animation that makes someone wait, and this
 * was the clearest case of it on the page. Everything is now on screen at once
 * and the section reads identically with every animation disabled.
 *
 * Five movements, each answering the one before it:
 *
 *   RELEASE      you don't have to change everything — begin with one step
 *   OVERWHELM    the six things you might want, and why all six at once fails
 *   THE REFRAME  the question that overwhelms, beside the question that doesn't
 *   THE MODEL    Awareness → Choice → Repetition → Growth, all four visible
 *   THE CLOSE    not perfection; just 1% better
 *
 * The four stages are a plain list with a marker, a name and one line each. No
 * theory was added around them — the deck gives one sentence per stage and that
 * is exactly what is rendered.
 */
export function CoreMethod() {
  const last = philosophy.stages.length - 1;

  return (
    <section id="method" data-three-window aria-labelledby="method-heading" className="section-y relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(12,4,16,0) 0%, rgba(29,10,24,0.9) 30%, rgba(29,10,24,0.9) 70%, rgba(12,4,16,0) 100%)",
        }}
      />

      <div className="container-page">
        {/* ================= 1 · The release ================= */}
        <div className="max-w-4xl">
          <Reveal>
            <Eyebrow>{philosophy.eyebrow}</Eyebrow>
          </Reveal>

          {/*
            Two lines, deliberately unequal. The first lifts the weight off and
            is set quiet; the second is the instruction — the most important
            sentence in the section — and gets the display size and the honey.
            Both live inside the one `h2` because they are one statement.
          */}
          <Reveal delay={0.05}>
            <h2 id="method-heading" className="mt-5 font-semibold text-balance">
              <span className="block text-h3 text-cream-muted">{philosophy.heading.release}</span>
              <span className="mt-3 block text-h1 leading-[1.04] text-cream">
                {philosophy.heading.instruction.before}
                <span className="text-honey">{philosophy.heading.instruction.accent}</span>
              </span>
            </h2>
          </Reveal>
        </div>

        {/* ================= 2 · The overwhelm ================= */}
        <div className="mt-12 sm:mt-14">
          <Reveal>
            <p className="text-eyebrow font-semibold tracking-[0.18em] text-cream-dim uppercase">
              {philosophy.wantsIntro}
            </p>
          </Reveal>

          {/* Chips, not cards. Six of these as animated panels would outweigh
              the sentence they exist to support. */}
          <RevealGroup as="ul" className="mt-5 flex flex-wrap gap-2.5 sm:gap-3" stagger={0.04}>
            {philosophy.wants.map((want) => (
              <motion.li
                key={want}
                variants={revealChild}
                className="rounded-pill border border-cream/15 bg-cream/[0.03] px-4 py-2 text-sm text-cream-muted sm:text-body"
              >
                {want}
              </motion.li>
            ))}
          </RevealGroup>

          <Reveal delay={0.06}>
            <p className="mt-6 max-w-xl text-lead text-cream-muted">{philosophy.overwhelm}</p>
          </Reveal>
        </div>

        {/* ================= 3 · The reframe ================= */}
        {/*
          The whole argument in two lines: the question that overwhelms, then
          the question that does not. Set as a pair so the difference between
          them is the thing being read — the first dimmed and struck through in
          weight, the second full strength in honey.

          Side by side from `md`, stacked below it, because two questions in a
          160px column is not a comparison.
        */}
        <div className="mt-12 border-t border-cream/10 pt-10 sm:mt-16 sm:pt-12">
          <Reveal>
            <p className="text-lead font-medium text-cream">{philosophy.approach}</p>
          </Reveal>

          <div className="mt-7 grid gap-6 sm:gap-8 md:grid-cols-2 md:gap-12">
            <Reveal delay={0.05}>
              <p className="text-eyebrow font-semibold tracking-[0.18em] text-cream-dim uppercase">
                {philosophy.insteadLabel}
              </p>
              <p className="mt-3 font-serif text-h3 text-cream-dim italic">
                &ldquo;{philosophy.insteadQuestion}&rdquo;
              </p>
            </Reveal>

            <Reveal delay={0.12}>
              {/* The rule marks which of the two the page is actually
                  recommending, without a badge or a tick. */}
              <div className="border-cream/10 md:border-l md:pl-12">
                <p className="text-eyebrow font-semibold tracking-[0.18em] text-honey uppercase">
                  {philosophy.askLabel}
                </p>
                <p className="mt-3 font-serif text-h3 text-honey italic">
                  &ldquo;{philosophy.askQuestion}&rdquo;
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.06}>
            <p className="mt-8 max-w-2xl text-body text-cream-muted">{philosophy.compounding}</p>
          </Reveal>
        </div>

        {/* ================= 4 · The model ================= */}
        <div className="mt-14 sm:mt-20">
          <Reveal>
            <p className="text-eyebrow font-semibold tracking-[0.18em] text-cream-dim uppercase">
              {philosophy.stagesHeading}
            </p>
          </Reveal>

          {/*
            All four at once — no timer, no active state, nothing to click.

            One column on a phone, four across from `lg`. The connector is a
            chevron that turns with the axis: pointing down between stacked
            rows, and hidden from `lg` where the columns and their numbering
            already read left to right. It is `aria-hidden`; the ordered list
            carries the sequence for anyone not seeing it.
          */}
          <RevealGroup
            as="ol"
            className="mt-7 grid gap-5 sm:gap-6 lg:grid-cols-4 lg:gap-8"
            stagger={0.07}
          >
            {philosophy.stages.map((stage, i) => {
              const Icon = philosophyIcons[stage.key];
              return (
                <motion.li key={stage.key} variants={revealChild} className="relative">
                  <div className="flex items-start gap-4 lg:block">
                    <span
                      aria-hidden
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-honey/30 bg-honey/[0.07] text-honey"
                    >
                      <Icon className="h-5 w-5" />
                    </span>

                    <div className="lg:mt-5">
                      <p className="flex items-baseline gap-2.5">
                        <span aria-hidden className="text-xs tabular-nums text-cream-dim">
                          {stage.index}
                        </span>
                        <span className="text-h3 font-semibold text-cream">{stage.title}</span>
                      </p>
                      <p className="mt-1.5 text-body text-cream-muted">{stage.body}</p>
                    </div>
                  </div>

                  {i < last && (
                    <span
                      aria-hidden
                      className="mt-4 ml-[1.375rem] block h-4 w-px bg-honey/25 lg:hidden"
                    />
                  )}
                </motion.li>
              );
            })}
          </RevealGroup>
        </div>

        {/* ================= 5 · The close ================= */}
        <div className="mt-14 border-t border-cream/10 pt-10 text-center sm:mt-20 sm:pt-12">
          <Reveal>
            <p className="text-h3 font-semibold text-cream">{philosophy.closing.heading}</p>
          </Reveal>
          <Reveal delay={0.06}>
            <p className="mx-auto mt-4 max-w-xl text-body text-cream-dim">
              {philosophy.closing.intro}{" "}
              <span className="text-cream-muted">{philosophy.closing.items}</span>
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-7 text-h2 font-semibold text-cream">
              {philosophy.closing.signature.before}
              <span className="text-honey">{philosophy.closing.signature.accent}</span>
              {philosophy.closing.signature.after}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
