"use client";

import { CTAButton } from "@/components/ui/CTAButton";
import { Reveal } from "@/components/ui/Reveal";
import { tamil } from "@/lib/content";
import { inr, programDetails } from "@/lib/config";

const excuses = ["“From next month.”", "“After this work is over.”", "“When I feel ready.”"];

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
          <p className="text-eyebrow font-semibold tracking-[0.18em] text-cream-dim uppercase">
            You have been thinking about changing.
          </p>
        </Reveal>

        <Reveal delay={0.06}>
          <p className="mt-8 text-body text-cream-muted">Maybe you said:</p>
        </Reveal>

        <div className="mt-5 flex flex-col gap-2.5">
          {excuses.map((excuse, i) => (
            <Reveal key={excuse} delay={0.12 + i * 0.07}>
              <p className="font-serif text-h3 text-cream/70 italic">{excuse}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.36}>
          <p className="mt-12 text-lead text-cream-muted">
            But when do we actually feel completely ready?
          </p>
        </Reveal>

        <Reveal delay={0.42}>
          <p className="mt-3 text-lead text-cream-muted">
            Maybe you don&rsquo;t need to wait. Maybe the next step is simply:
          </p>
        </Reveal>

        <Reveal delay={0.5}>
          <p className="mt-6 text-h2 font-semibold tracking-tight text-honey">Begin.</p>
        </Reveal>

        {/* The line the whole page has been building to. */}
        <Reveal delay={0.58}>
          <h2 id="final-heading" className="mt-16 text-display font-semibold text-cream">
            1% Better.
            <br />
            Every Day.
          </h2>
        </Reveal>

        <Reveal delay={0.64}>
          <p lang="ta" className="mt-10 font-tamil text-h3 font-medium text-honey">
            {tamil.itsOkayLetsSee}
          </p>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-xl gap-8 sm:grid-cols-2">
          <Reveal delay={0.7}>
            <p className="text-body text-cream-muted">
              Don&rsquo;t aim to become perfect.
              <br />
              <span className="text-cream">Aim to become aware.</span>
            </p>
          </Reveal>
          <Reveal delay={0.76}>
            <p className="text-body text-cream-muted">
              Don&rsquo;t wait for motivation.
              <br />
              <span className="text-cream">Trust small actions.</span>
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.82}>
          <div className="mt-14 rule-gold mx-auto max-w-xs" />
        </Reveal>

        <Reveal delay={0.86}>
          <p lang="ta" className="mt-10 font-tamil text-lead text-cream">
            {tamil.itsOkay}
            <br />
            {tamil.startAgain}
          </p>
        </Reveal>

        <Reveal delay={0.92}>
          <div className="mt-14 flex flex-col items-center gap-6">
            <CTAButton size="lg">Register now — {inr(programDetails.price)}</CTAButton>

            <p className="text-sm text-cream-dim">
              {programDetails.dateLabel} · {programDetails.timeLabel} ·{" "}
              {programDetails.seats} seats
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.98}>
          <p className="mt-14 text-lead text-cream-muted">
            See you at {programDetails.timeShort}. <span aria-hidden>🌅</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
