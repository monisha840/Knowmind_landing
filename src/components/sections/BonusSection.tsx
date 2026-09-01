import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { bonuses, bonusesNote, totalBonusValue } from "@/lib/content";
import { inr } from "@/lib/config";

/* -------------------------------------------------------------------------- */
/*  The three bonuses                                                          */
/*                                                                            */
/*  These cards used to be a discovery: three closed objects whose contents    */
/*  opened on hover, on focus or on tap, with a meter that filled as each one  */
/*  was found. It was carefully built — nothing was ever removed from the DOM, */
/*  and touch devices got them open — but it asked a visitor to interact with  */
/*  three boxes before they could read what the offer actually contained, and  */
/*  the brief for this section is that the complete offer should be            */
/*  understandable quickly and never revealed by animation. So the cards are   */
/*  simply open.                                                              */
/*                                                                            */
/*  The art direction is unchanged: the same three drawn marks, the same       */
/*  thread resolving across the head of each card, the same wine-and-honey     */
/*  tag. Only the concealment is gone — and with it the state machine, so this */
/*  is now a server component with no client JavaScript at all.               */
/* -------------------------------------------------------------------------- */

/**
 * The card tag. Says "Free" rather than "Bonus deal": the label sits directly
 * beside "Bonus 01", so repeating the word there would be redundant, and this
 * section is art-directed as a gift rather than a discount.
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

/**
 * A quiet signature per bonus — a reflection, a repeating pattern, thirty
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
          eyebrow="And you also receive"
          title="Three things to begin with"
          lead={bonusesNote}
        />

        <ul className="mt-10 grid gap-4 sm:mt-14 lg:mt-16 lg:grid-cols-3 lg:gap-5">
          {bonuses.map((bonus, i) => (
            <Reveal as="li" key={bonus.index} delay={i * 0.08} className="min-w-0">
              <article className="relative flex h-full flex-col border border-ink/10 bg-paper px-6 pt-8 pb-7 transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-amber-ink/30 sm:px-7">
                {/* The thread, running across the head of each card. */}
                <span
                  aria-hidden
                  style={{ backgroundImage: THREAD_PAINT[i] ?? THREAD_PAINT[2] }}
                  className="absolute inset-x-0 top-0 h-[2px]"
                />

                <BonusMark
                  index={i}
                  className="absolute top-7 right-6 h-9 w-9 text-amber-ink/30 sm:right-7"
                />

                <div className="flex items-center gap-3">
                  <p className="text-eyebrow font-semibold tracking-[0.18em] text-ink-muted uppercase">
                    Bonus <span className="text-amber-ink">{bonus.index}</span>
                  </p>

                  {/* The one dark object on a light card, so the eye lands on
                      it first — wine and honey rather than black and white. */}
                  <span className="inline-flex shrink-0 items-center rounded-full bg-wine-950 px-2.5 py-1 text-[0.625rem] font-semibold tracking-[0.16em] text-honey uppercase shadow-[0_2px_10px_-3px_rgba(29,10,24,0.6)]">
                    {TAG_LABEL}
                  </span>
                </div>

                {/* The resource's name is the loudest thing on the card — louder
                    than "Bonus 01" above it and than the value below it. */}
                <h3 className="mt-5 pr-12 text-h3 font-semibold text-balance text-ink">
                  {bonus.title}
                </h3>

                <span aria-hidden className="mt-5 block h-px w-16 bg-amber-ink/35" />

                <p className="mt-5 text-body text-ink-muted">{bonus.description}</p>

                {/* Value last, and deliberately a step down from the name: what
                    the resource is matters more than what it is worth. */}
                <p className="mt-auto flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pt-8">
                  <span className="text-lead font-semibold tabular-nums text-amber-ink">
                    {inr(bonus.value)}
                  </span>
                  <span className="text-eyebrow font-semibold tracking-[0.18em] text-ink-muted uppercase">
                    Included
                  </span>
                </p>
              </article>
            </Reveal>
          ))}
        </ul>

        {/* ---------------- The payoff ---------------- */}
        <Reveal>
          <div className="mt-10 sm:mt-14 lg:mt-16">
            <div className="rule-gold" />

            <div className="flex flex-col gap-x-10 gap-y-5 pt-10 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-eyebrow font-semibold tracking-[0.18em] text-amber-ink uppercase">
                  Total bonus value
                </p>
                {/* Summed from the three cards above, never asserted — the page
                    cannot show a total that disagrees with its own list. */}
                <p className="mt-3 text-h2 leading-none font-semibold tabular-nums text-ink">
                  {inr(totalBonusValue)}
                </p>
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
