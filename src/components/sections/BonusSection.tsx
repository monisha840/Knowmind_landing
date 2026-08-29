"use client";

import { motion } from "motion/react";
import { useId, useState } from "react";

import { RevealGroup, revealChild, Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { bonuses, totalBonusValue } from "@/lib/content";
import { inr } from "@/lib/config";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";

/* -------------------------------------------------------------------------- */
/*  The bonus discovery                                                        */
/*                                                                            */
/*  Three closed objects rather than three information cards. The title is     */
/*  always legible; what the bonus actually contains opens on hover, on focus  */
/*  or on tap.                                                                */
/*                                                                            */
/*  Two decisions worth knowing before editing:                               */
/*                                                                            */
/*  1. Nothing is ever removed from the DOM or hidden from assistive tech.     */
/*     The concealed layer is clipped and faded, never `hidden` and never      */
/*     `aria-hidden`, so screen readers and crawlers get the full offer while  */
/*     sighted visitors get the discovery (§13.3, §16). `aria-expanded`        */
/*     therefore describes the *visual* state of a widget whose content is     */
/*     always readable — deliberate, and the reason it is not a plain          */
/*     `Accordion`.                                                            */
/*                                                                            */
/*  2. The concealed layer stays in normal flow at all times, so a card is the */
/*     same height open and closed. That is what makes the reveal impossible   */
/*     to shift the page — there is no height animation anywhere here.         */
/* -------------------------------------------------------------------------- */

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/**
 * The card tag. Says "Free" rather than "Bonus deal": the label sits directly
 * beside "Bonus 01", so repeating the word there would be redundant, and this
 * section is art-directed as a gift rather than a discount. It restates the
 * section's own eyebrow — "Included at no extra cost" — in one word.
 */
const TAG_LABEL = "Free";

/**
 * The thread, resolving — chaos → flow → clarity, the same idea the 3D
 * character carries, at a whisper. Painted as a repeating gradient so the
 * "dashes" cost nothing. Rule 01 is sparse and broken, 02 closes up, 03 runs
 * solid.
 */
const THREAD_PAINT = [
  "repeating-linear-gradient(to right, rgba(90,35,72,0.5) 0 4px, transparent 4px 13px)",
  "repeating-linear-gradient(to right, rgba(154,101,49,0.55) 0 9px, transparent 9px 14px)",
  "linear-gradient(to right, rgba(230,180,76,0.95), rgba(254,183,55,0.35))",
];

/* -------------------------------------------------------------------------- */

/**
 * A quiet signature per bonus — a reflection, a repeating pattern, fourteen
 * marks. Drawn rather than imported: the page carries no icon dependency.
 */
function BonusMark({ index, className = "" }: { index: number; className?: string }) {
  const common = { viewBox: "0 0 48 48", fill: "none", "aria-hidden": true, className } as const;

  if (index === 0) {
    return (
      <svg {...common}>
        <circle cx="24" cy="24" r="15" stroke="currentColor" strokeWidth="1" />
        <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="1" />
        <circle cx="24" cy="24" r="1.75" fill="currentColor" />
      </svg>
    );
  }

  if (index === 1) {
    return (
      <svg {...common}>
        {[12, 19, 26, 33].map((y, i) => (
          <line
            key={y}
            x1="9"
            y1={y}
            x2={i % 2 === 0 ? 39 : 30}
            y2={y}
            stroke="currentColor"
            strokeWidth="1"
          />
        ))}
      </svg>
    );
  }

  return (
    <svg {...common}>
      {Array.from({ length: 14 }, (_, i) => (
        <circle
          key={i}
          cx={10 + (i % 7) * 4.7}
          cy={i < 7 ? 20 : 28}
          r="1.4"
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */

export function BonusSection() {
  const reduced = usePrefersReducedMotion();
  // Hover only drives the reveal where hovering is real. On touch the same
  // state is driven by tap, so the interaction is identical in spirit.
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");

  const [active, setActive] = useState<number | null>(null);
  const [found, setFound] = useState<readonly number[]>([]);
  const baseId = useId();

  const open = (i: number) => {
    setActive(i);
    setFound((prev) => (prev.includes(i) ? prev : [...prev, i]));
  };

  const foundRatio = found.length / bonuses.length;
  const allFound = found.length === bonuses.length;

  /* -- the concealed layer, and the two ways it can behave ---------------- */

  const conceal = reduced
    ? // Reduced motion: it still opens, it just does not travel.
      "opacity-0 group-data-[open=true]:opacity-100 transition-opacity duration-200"
    : `opacity-0 translate-y-2 blur-[2px] [clip-path:inset(0_0_100%_0)] ` +
      `group-data-[open=true]:opacity-100 group-data-[open=true]:translate-y-0 ` +
      // `blur-[0px]`, not `blur-0` — the latter is not a utility in Tailwind v4,
      // so it compiles to nothing and the text stays blurred once opened.
      `group-data-[open=true]:blur-[0px] group-data-[open=true]:[clip-path:inset(0_0_0%_0)] ` +
      `transition-[opacity,transform,filter,clip-path] duration-500 ${EASE}`;

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

        {/* ---------------- Three closed objects ---------------- */}
        <RevealGroup
          as="ul"
          className="mt-14 grid gap-4 lg:mt-16 lg:grid-cols-3 lg:gap-5"
          stagger={0.09}
        >
          {bonuses.map((bonus, i) => {
            const isOpen = active === i;
            const dimmed = active !== null && !isOpen;
            const panelId = `${baseId}-bonus-${i}`;

            return (
              <motion.li key={bonus.index} variants={revealChild} className="min-w-0">
                <article
                  data-open={isOpen}
                  onMouseEnter={canHover ? () => open(i) : undefined}
                  onMouseLeave={canHover ? () => setActive(null) : undefined}
                  className={`group relative flex h-full flex-col border border-ink/10 bg-paper/40 px-6 pt-8 pb-7 transition-[background-color,border-color,transform,opacity] duration-500 sm:px-7 ${EASE} data-[open=true]:border-amber-ink/25 data-[open=true]:bg-paper ${
                    dimmed ? "opacity-90" : "opacity-100"
                  } ${reduced ? "" : "data-[open=true]:-translate-y-1.5"}`}
                >
                  {/* The thread, running across the head of each card. */}
                  <span
                    aria-hidden
                    style={{ backgroundImage: THREAD_PAINT[i] ?? THREAD_PAINT[2] }}
                    className={`absolute inset-x-0 top-0 h-[2px] opacity-60 transition-opacity duration-500 group-data-[open=true]:opacity-100 ${EASE}`}
                  />

                  <BonusMark
                    index={i}
                    className={`absolute top-7 right-6 h-9 w-9 text-ink/15 transition-colors duration-500 group-data-[open=true]:text-amber-ink/40 sm:right-7 ${EASE}`}
                  />

                  {/* ---- Always legible: which bonus, and what it is ---- */}
                  <div className="flex items-center gap-3">
                    <p className="text-eyebrow font-semibold tracking-[0.18em] text-ink-muted uppercase">
                      Bonus <span className="text-amber-ink">{bonus.index}</span>
                    </p>

                    {/* The tag: the one dark object on a light card, so the eye
                        lands on it first. Wine rather than black and honey
                        rather than white — the reference's lit-badge treatment,
                        rendered in the brand's own two colours. The halo tightens
                        as the card opens, so the tag belongs to the interaction
                        instead of sitting on top of it as a sticker. */}
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full bg-wine-950 px-2.5 py-1 text-[0.625rem] font-semibold tracking-[0.16em] text-honey uppercase [text-shadow:0_0_10px_rgba(254,183,55,0.45)] shadow-[0_2px_10px_-3px_rgba(29,10,24,0.6)] transition-shadow duration-500 group-data-[open=true]:shadow-[0_0_0_1px_rgba(254,183,55,0.3),0_4px_16px_-4px_rgba(254,183,55,0.5)] ${EASE}`}
                    >
                      {TAG_LABEL}
                    </span>
                  </div>

                  <h3 className="mt-5 pr-12 text-h3 font-semibold tracking-[0.005em] hyphens-auto text-ink uppercase">
                    {bonus.title}
                  </h3>

                  {/* The accent line that opens with the card. */}
                  <span
                    aria-hidden
                    className={`mt-5 h-px w-16 origin-left scale-x-50 bg-amber-ink/35 transition-transform duration-500 group-data-[open=true]:scale-x-100 ${EASE}`}
                  />

                  {/* ---- Concealed until opened, but never hidden ---- */}
                  {/* Beat two of three: the rule opens, the description follows,
                      the value settles last. ~650ms end to end. */}
                  <div
                    id={panelId}
                    className={`mt-5 ${conceal} ${
                      reduced ? "" : "group-data-[open=true]:delay-75"
                    }`}
                  >
                    <p className="text-body text-ink-muted">{bonus.description}</p>
                    {bonus.detail && (
                      <p className="mt-3 text-sm text-ink-muted/85">{bonus.detail}</p>
                    )}
                  </div>

                  {/* ---- The swap: a cue becomes a value ----
                      Both states share one grid cell, so the row is exactly as
                      tall as the taller of the two and nothing moves. */}
                  <div className="mt-auto grid pt-8">
                    <span
                      className={`col-start-1 row-start-1 flex items-center gap-2 self-end text-eyebrow font-semibold tracking-[0.18em] text-ink-muted uppercase transition-opacity duration-300 group-data-[open=true]:opacity-0 ${EASE}`}
                    >
                      Discover
                      <svg
                        aria-hidden
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-3.5 w-3.5"
                      >
                        <path
                          d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>

                    <p
                      // The delay is open-only, so the value settles last on the
                      // way in but leaves immediately on the way out.
                      className={`col-start-1 row-start-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 self-end ${conceal} ${
                        reduced ? "" : "group-data-[open=true]:delay-150"
                      }`}
                    >
                      <span className="text-h3 font-semibold tabular-nums text-amber-ink">
                        {inr(bonus.value)}
                      </span>
                      <span className="text-eyebrow font-semibold tracking-[0.18em] text-ink-muted uppercase">
                        Included
                      </span>
                    </p>
                  </div>

                  {/* The whole card is the control: tappable, focusable, and
                      the only thing that carries the interaction semantics.

                      Every handler here *opens* — none of them toggles closed.
                      That is deliberate: on touch, `focus` fires before `click`,
                      so a toggling click would close the card in the same tap
                      that opened it. Closing is handled by moving away instead —
                      blur, mouseleave, or opening a different card — which also
                      gives the section its one-open-at-a-time behaviour for
                      free, on every input type. */}
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onFocus={() => open(i)}
                    onBlur={() => setActive(null)}
                    onClick={() => open(i)}
                    className="absolute inset-0 cursor-pointer"
                  >
                    <span className="sr-only">{bonus.title} — bonus details</span>
                  </button>
                </article>
              </motion.li>
            );
          })}
        </RevealGroup>

        {/* ---------------- The payoff ---------------- */}
        <Reveal>
          <div className="mt-14 lg:mt-16">
            <div className="rule-gold" />

            <div className="flex flex-col gap-x-10 gap-y-5 pt-10 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p
                  className={`text-eyebrow font-semibold tracking-[0.18em] uppercase transition-colors duration-700 ${EASE} ${
                    allFound ? "text-amber-ink" : "text-ink-muted"
                  }`}
                >
                  Total bonus value
                </p>
                <p className="mt-3 text-h1 leading-none font-semibold tabular-nums text-ink">
                  {inr(totalBonusValue)}
                </p>

                {/* Fills as each bonus is opened — the discovery adding up to
                    the number, rather than the number being asserted. */}
                <span
                  aria-hidden
                  style={{ transform: `scaleX(${foundRatio})` }}
                  className={`mt-4 block h-px w-full max-w-56 origin-left bg-honey transition-transform duration-700 ${EASE}`}
                />
              </div>

              <p className="text-lead text-ink-muted sm:text-right">
                Included with your registration.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
