import { CTAButton } from "@/components/ui/CTAButton";
import { Reveal } from "@/components/ui/Reveal";
import { bonuses, finalCta, hero, offer, tamil, totalBonusValue } from "@/lib/content";
import { inr, programDetails } from "@/lib/config";

/**
 * The closing decision.
 *
 * The page's last screen, and the only one whose job is to be decided on. The
 * copy is the deck's, and the shape follows it: the statement, the question,
 * the release from having to change everything, the five things the next
 * fourteen days actually ask for, then the offer restated and the button.
 *
 * The summary above the button reads every figure — price, duration, bonus
 * names, bonus values, the total — from the same exports the sections above
 * use. Nothing is retyped here, so the last thing a visitor reads cannot
 * quietly disagree with the promise that got them here.
 *
 * A server component. The one interactive element is `CTAButton`, which is its
 * own client boundary (CLAUDE.md §4.1).
 */
export function FinalCTA() {
  return (
    <section
      id="begin"
      data-three-window
      aria-labelledby="final-heading"
      className="section-y relative overflow-hidden"
    >
      {/* First light again, this time behind the decision. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1]"
        style={{
          background:
            "radial-gradient(85% 65% at 50% 100%, rgba(254,183,55,0.18) 0%, rgba(90,35,72,0.3) 38%, rgba(12,4,16,0.82) 78%)",
        }}
      />

      <div className="container-narrow text-center">
        <Reveal>
          <p className="text-eyebrow font-semibold tracking-[0.18em] text-honey uppercase">
            {finalCta.opening}
          </p>
        </Reveal>

        <Reveal delay={0.06}>
          <h2
            id="final-heading"
            className="mt-6 text-h1 leading-[1.06] font-semibold text-balance text-cream"
          >
            {finalCta.question}
          </h2>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="mx-auto mt-8 max-w-xl text-lead text-cream-muted">
            {finalCta.release}{" "}
            <span className="font-medium text-cream">{finalCta.ask}</span>
          </p>
        </Reveal>

        {/* What the fourteen days actually ask for. Centred and wrapped rather
            than listed down the page — five short verbs read faster as a line
            of them than as five rows. */}
        <Reveal delay={0.18}>
          <ul className="mx-auto mt-9 flex max-w-lg flex-wrap justify-center gap-x-5 gap-y-2.5">
            {finalCta.actions.map((action) => (
              <li key={action} className="flex items-center gap-2.5 text-body text-cream/85">
                <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-gold" />
                {action}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.26}>
          <p lang="ta" className="mt-11 font-tamil text-h3 font-medium text-honey">
            {tamil.itsOkayLetsSee}
          </p>
        </Reveal>

        {/* ================= The offer, one last time ================= */}
        <Reveal delay={0.32}>
          <div className="mx-auto mt-12 max-w-xl rounded-card border border-cream/12 bg-wine-950/50 p-7 text-left backdrop-blur-sm sm:mt-14 sm:p-9">
            <p className="text-eyebrow font-semibold tracking-[0.18em] text-cream-dim uppercase">
              {finalCta.summaryHeading}
            </p>

            <p className="mt-4 text-h3 font-semibold text-cream">{offer.headline}</p>

            {/* The programme's four facts, inline — the full ruled table lives
                in "What you get"; this is a reminder, not a repeat. */}
            <p className="mt-3 text-sm text-cream-muted">
              {offer.specs.map((spec) => spec.value).join(" · ")}
            </p>

            <p className="mt-6 flex items-baseline gap-3 border-t border-cream/10 pt-6">
              <span className="text-h2 leading-none font-semibold tabular-nums text-honey">
                {inr(programDetails.price)}
              </span>
              <span className="text-sm text-cream-dim">{hero.batchNote}</span>
            </p>

            {/* ---- the three bonuses ---- */}
            <p className="mt-7 text-eyebrow font-semibold tracking-[0.18em] text-cream-dim uppercase">
              {finalCta.bonusesHeading}
            </p>

            <ul className="mt-4 flex flex-col gap-2.5">
              {bonuses.map((bonus) => (
                <li
                  key={bonus.index}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 text-body text-cream-muted"
                >
                  <span className="min-w-0 text-cream/90">{bonus.title}</span>
                  <span className="shrink-0 tabular-nums text-cream-dim">
                    {inr(bonus.value)}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-t border-cream/10 pt-4">
              <span className="text-eyebrow font-semibold tracking-[0.18em] text-honey uppercase">
                {finalCta.totalLabel}
              </span>
              {/* Summed from the list directly above it. */}
              <span className="text-lead font-semibold tabular-nums text-cream">
                {inr(totalBonusValue)}
              </span>
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.4}>
          <div className="mt-11 flex flex-col items-center gap-5">
            <CTAButton size="lg">{finalCta.cta}</CTAButton>

            <p className="text-sm text-cream-dim">
              {finalCta.footnote} {programDetails.platform} · {programDetails.timeShort}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.48}>
          <p lang="ta" className="mt-12 font-tamil text-lead text-cream">
            {tamil.itsOkay}
            <br />
            {tamil.startAgain}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
