"use client";

import { motion, type Variants } from "motion/react";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { bonuses, totalBonusValue } from "@/lib/content";
import { inr } from "@/lib/config";
import { usePrefersReducedMotion } from "@/lib/hooks";

/* -------------------------------------------------------------------------- */
/*  The bonus reveal                                                          */
/*                                                                            */
/*  Three discoveries rather than three product cards. Each stage arrives in   */
/*  six beats — number, title, thread, description, value, "included" — so the */
/*  bonus reads as being opened rather than displayed.                         */
/*                                                                            */
/*  Motion note: §11 names `Reveal` as the page's single scroll-reveal         */
/*  language. A six-beat sequence cannot be expressed with it, so this section */
/*  runs its own variant tree — but on the same library, the same easing and   */
/*  the same duration band, and still `viewport={{ once: true }}`. The         */
/*  exception is deliberate and scoped to this section.                        */
/* -------------------------------------------------------------------------- */

const EASE = [0.22, 1, 0.36, 1] as const;

/** Parent: paces the six beats of one bonus. */
const stageVariants = (reduced: boolean): Variants => ({
  hidden: {},
  visible: {
    transition: {
      delayChildren: reduced ? 0 : 0.14,
      staggerChildren: reduced ? 0 : 0.16,
    },
  },
});

/** The default beat — opacity plus a short rise. */
const beat = (reduced: boolean): Variants => ({
  hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: reduced ? 0.25 : 0.65, ease: EASE },
  },
});

/** The title travels further, behind a mask, so it reads as a lift not a fade. */
const titleBeat = (reduced: boolean): Variants => ({
  hidden: reduced ? { opacity: 0 } : { opacity: 0, y: "42%" },
  visible: {
    opacity: 1,
    y: "0%",
    transition: { duration: reduced ? 0.25 : 0.85, ease: EASE },
  },
});

/** The thread draws downward. Transform only — no height animation. */
const threadBeat = (reduced: boolean): Variants => ({
  hidden: reduced ? { opacity: 0 } : { opacity: 0, scaleY: 0 },
  visible: {
    opacity: 1,
    scaleY: 1,
    transition: { duration: reduced ? 0.25 : 0.9, ease: EASE },
  },
});

const nodeBeat = (reduced: boolean): Variants => ({
  hidden: reduced ? { opacity: 0 } : { opacity: 0, scale: 0.3 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: reduced ? 0.25 : 0.5, ease: EASE },
  },
});

/**
 * The thread, resolving.
 *
 * Bonus 01 is sparse and broken, 02 closes up, 03 runs solid — the same
 * chaos → flow → clarity idea the 3D character carries, at a whisper. Painted
 * with a repeating gradient so the "dashes" cost nothing to animate.
 */
const THREAD_PAINT = [
  "repeating-linear-gradient(to bottom, rgba(90,35,72,0.55) 0 4px, transparent 4px 13px)",
  "repeating-linear-gradient(to bottom, rgba(154,101,49,0.6) 0 9px, transparent 9px 14px)",
  "linear-gradient(to bottom, rgba(230,180,76,0.9), rgba(254,183,55,0.3))",
];

export function BonusSection() {
  const reduced = usePrefersReducedMotion();

  const stage = stageVariants(reduced);
  const item = beat(reduced);
  const title = titleBeat(reduced);
  const thread = threadBeat(reduced);
  const node = nodeBeat(reduced);

  return (
    <section
      id="bonuses"
      aria-labelledby="bonus-heading"
      className="section-y relative overflow-hidden bg-paper-2 text-ink"
    >
      {/* A single warm wash — the bonuses should feel like a gift, not a fire sale. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 55% at 85% 0%, rgba(254,183,55,0.18) 0%, transparent 65%)",
        }}
      />

      <div className="container-page relative">
        <SectionHeading
          id="bonus-heading"
          tone="light"
          eyebrow="Included at no extra cost"
          title="Three things to begin with"
          lead="Small tools that make the first day easier and the last day clearer."
        />

        {/* ---------------- The three discoveries ---------------- */}
        <ol className="mt-16 lg:mt-20">
          {bonuses.map((bonus, i) => (
            <motion.li
              key={bonus.index}
              variants={stage}
              initial="hidden"
              whileInView="visible"
              // Each stage waits its turn simply by being further down the page.
              // `once` means a revealed bonus never dims or re-animates.
              viewport={{ once: true, amount: 0.4 }}
              className="relative"
            >
              {/* The thread runs the full height of the stage, so consecutive
                  stages join into one continuous line down the section. */}
              <motion.span
                aria-hidden
                variants={thread}
                style={{ backgroundImage: THREAD_PAINT[i] ?? THREAD_PAINT[2] }}
                className="absolute top-0 left-0 h-full w-px origin-top"
              />
              <motion.span
                aria-hidden
                variants={node}
                className="absolute top-12 -left-[3px] h-[7px] w-[7px] rounded-full bg-honey lg:top-16"
              />

              <article className="grid gap-y-6 py-12 pl-8 sm:pl-12 lg:grid-cols-12 lg:gap-x-10 lg:py-16 lg:pl-16">
                {/* ---- Beat 1: the number ---- */}
                <motion.div variants={item} className="min-w-0 lg:col-span-2">
                  <p className="text-eyebrow font-semibold tracking-[0.18em] text-ink-muted uppercase">
                    Bonus
                  </p>
                  <p className="mt-2 flex items-baseline gap-2">
                    <span className="text-h1 leading-none font-semibold tabular-nums text-ink">
                      {bonus.index}
                    </span>
                    <span className="text-sm tabular-nums text-ink-muted">
                      / {String(bonuses.length).padStart(2, "0")}
                    </span>
                  </p>
                </motion.div>

                {/* ---- Beats 2-4: title, rule, description ---- */}
                <div className="min-w-0 lg:col-span-7">
                  {/* Mask: the title lifts into place rather than fading in. */}
                  <div className="overflow-hidden pb-1">
                    <motion.h3
                      variants={title}
                      className="text-h2 font-semibold tracking-[0.005em] break-words hyphens-auto text-ink uppercase"
                    >
                      {bonus.title}
                    </motion.h3>
                  </div>

                  <motion.div
                    aria-hidden
                    variants={item}
                    className="mt-6 h-px w-16 origin-left bg-amber-ink/45"
                  />

                  <motion.p variants={item} className="mt-6 max-w-md text-lead text-ink-muted">
                    {bonus.description}
                  </motion.p>

                  {bonus.detail && (
                    <motion.p variants={item} className="mt-4 max-w-md text-sm text-ink-muted">
                      {bonus.detail}
                    </motion.p>
                  )}
                </div>

                {/* ---- Beats 5-6: value, then "included" ---- */}
                <div className="min-w-0 lg:col-span-3 lg:text-right">
                  <motion.p
                    variants={item}
                    className="text-eyebrow font-semibold tracking-[0.18em] text-ink-muted uppercase"
                  >
                    Value
                  </motion.p>
                  <motion.p
                    variants={item}
                    className="mt-2 text-h3 font-semibold tabular-nums text-amber-ink"
                  >
                    {inr(bonus.value)}
                  </motion.p>
                  <motion.p
                    variants={item}
                    className="mt-2 text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase"
                  >
                    Included
                  </motion.p>
                </div>
              </article>
            </motion.li>
          ))}
        </ol>

        {/* ---------------- The payoff ---------------- */}
        <motion.div
          variants={stage}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          className="relative pl-8 sm:pl-12 lg:pl-16"
        >
          {/* The thread finishes here, then hands over to the page. */}
          <motion.span
            aria-hidden
            variants={thread}
            className="absolute top-0 left-0 h-10 w-px origin-top"
            style={{ backgroundImage: THREAD_PAINT[2] }}
          />

          <div className="rule-gold mt-10" />

          <div className="flex flex-col gap-x-10 gap-y-4 pt-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <motion.p
                variants={item}
                className="text-eyebrow font-semibold tracking-[0.18em] text-ink-muted uppercase"
              >
                Total bonus value
              </motion.p>
              <motion.p
                variants={item}
                className="mt-3 text-h1 leading-none font-semibold tabular-nums text-ink"
              >
                {inr(totalBonusValue)}
              </motion.p>
            </div>

            <motion.p variants={item} className="text-lead text-ink-muted sm:text-right">
              Included with your registration.
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
