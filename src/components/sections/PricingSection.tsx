"use client";

import { CTAButton } from "@/components/ui/CTAButton";
import { Reveal } from "@/components/ui/Reveal";
import { inr, programDetails, siteConfig } from "@/lib/config";

const facts = [
  { label: "Duration", value: `${programDetails.days} days` },
  { label: "Format", value: programDetails.platform },
  { label: "Time", value: programDetails.timeLabel },
  { label: "Language", value: programDetails.language },
  { label: "Cohort size", value: `${programDetails.seats} participants` },
];

export function PricingSection() {
  return (
    <section
      id="register"
      data-three-window
      aria-labelledby="pricing-heading"
      className="section-y relative scroll-mt-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1]"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 45%, rgba(90,35,72,0.55) 0%, rgba(12,4,16,0.9) 62%, rgba(12,4,16,1) 100%)",
        }}
      />

      <div className="container-page">
        <Reveal>
          {/* The only light card in the closing act — the eye goes here. */}
          <div className="mx-auto max-w-4xl overflow-hidden rounded-[1.75rem] bg-paper text-ink shadow-[0_40px_120px_-30px_rgba(0,0,0,0.85)]">
            <div className="grid lg:grid-cols-12">
              {/* ---- The offer ---- */}
              {/* `min-w-0` is load-bearing, not tidiness. A grid item's
                  automatic minimum size is the min-content width of what is
                  inside it, and the setup note below holds a 33-character
                  environment-variable name with nowhere to break. At 320px that
                  one token sized this track to 300px inside a 280px container,
                  so the whole registration card hung 20px past the page gutter
                  and lost its right-hand margin and its rounded corner. */}
              <div className="min-w-0 p-6 sm:p-12 lg:col-span-7">
                <span className="text-eyebrow font-semibold tracking-[0.18em] text-amber-ink uppercase">
                  Founding journey — {siteConfig.batch}
                </span>

                <h2 id="pricing-heading" className="sr-only">
                  Register for the {programDetails.days}-day journey
                </h2>

                <div className="mt-7 flex items-baseline gap-4">
                  <span className="text-[clamp(3.5rem,9vw,5.5rem)] leading-none font-semibold tracking-tight text-ink tabular-nums">
                    {inr(programDetails.price)}
                  </span>
                  <span className="text-body text-ink-muted">one time</span>
                </div>

                <p className="mt-4 text-body text-ink-muted">
                  Founding price for this batch. The next batch is{" "}
                  <span className="font-semibold text-ink tabular-nums">
                    {inr(programDetails.nextBatchPrice)}
                  </span>
                  .
                </p>

                <div className="mt-9">
                  <CTAButton className="w-full sm:w-auto">Yes, I want to begin</CTAButton>
                </div>

                <p className="mt-6 flex items-start gap-2.5 text-sm text-ink-muted">
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    fill="none"
                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-ink"
                  >
                    <path
                      d="M12 3 4.5 6.2v5.1c0 4.5 3.2 8.7 7.5 9.7 4.3-1 7.5-5.2 7.5-9.7V6.2L12 3Z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>
                    Secure payment via Razorpay. Zoom link and WhatsApp group access within 24
                    hours.
                  </span>
                </p>

              </div>

              {/* ---- The particulars ---- */}
              <div className="min-w-0 border-t border-ink/10 bg-paper-2 p-6 sm:p-12 lg:col-span-5 lg:border-t-0 lg:border-l">
                <p className="text-eyebrow font-semibold tracking-[0.18em] text-ink-muted uppercase">
                  {programDetails.dateLabel}
                </p>

                <dl className="mt-7 flex flex-col">
                  {facts.map((fact) => (
                    <div
                      key={fact.label}
                      className="flex items-baseline justify-between gap-4 border-b border-ink/10 py-3.5 last:border-b-0"
                    >
                      <dt className="text-sm text-ink-muted">{fact.label}</dt>
                      <dd className="text-right text-sm font-medium text-ink">{fact.value}</dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-8 border-t border-ink/10 pt-6 text-sm text-ink-muted">
                  Only {programDetails.seats} people join each batch — small enough that Kalee
                  can actually see you in the room.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
