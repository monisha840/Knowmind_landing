import { CTAButton } from "@/components/ui/CTAButton";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { hero, offer } from "@/lib/content";
import { inr, programDetails } from "@/lib/config";

/**
 * What you get.
 *
 * The programme, stated plainly, and nothing more — the three bonuses are the
 * section immediately below this one, which is why this ends without listing
 * them. Between the two, a visitor has the whole offer.
 *
 * The six-cell inclusions grid that stood here is gone. It listed the workbook,
 * which the deck now gives as a bonus, so the page was about to count it twice;
 * the rest is the deck's own clarity box — duration, format, time, focus — with
 * the programme named above it.
 *
 * Now a server component. It was `"use client"` only for the staggered grid;
 * four static rows need no JavaScript, and `Reveal` is its own boundary
 * (CLAUDE.md §4.1).
 */
export function OfferSection() {
  return (
    <section
      id="whats-included"
      aria-labelledby="offer-heading"
      className="section-y relative bg-paper text-ink"
    >
      <div className="container-page">
        <SectionHeading
          id="offer-heading"
          tone="light"
          eyebrow="What you get"
          title={
            <>
              Your {inr(programDetails.price)} includes&hellip;
            </>
          }
        />

        {/* The programme itself, at the size of the thing being bought. */}
        <Reveal delay={0.06}>
          <p className="mt-10 max-w-3xl text-h2 leading-[1.1] font-semibold text-balance text-ink sm:mt-14">
            {offer.headline}
          </p>
        </Reveal>

        {/*
          The four facts, as a ruled index rather than four cards. They are
          label-and-value pairs — a specification, not a feature list — and a
          bordered box around each would make four small claims out of one
          plain statement.

          One column on a phone, two at `sm`, four at `lg`.
        */}
        <Reveal delay={0.1}>
          <dl className="mt-9 grid gap-x-10 border-t border-ink/12 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
            {offer.specs.map((spec) => (
              <div key={spec.label} className="border-b border-ink/12 py-5 lg:py-6">
                <dt className="text-eyebrow font-semibold tracking-[0.18em] text-ink-muted uppercase">
                  {spec.label}
                </dt>
                <dd className="mt-2.5 text-lead font-medium text-ink">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delay={0.14}>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5 sm:mt-12">
            <CTAButton>I want to begin</CTAButton>
            {/* The deck states scarcity as a batch, not a seat count. */}
            <p className="text-body text-ink-muted">{hero.batchNote}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
