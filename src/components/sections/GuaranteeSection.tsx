import { RefundEnvelope } from "@/components/ui/RefundEnvelope";
import { Reveal } from "@/components/ui/Reveal";
import { guarantee } from "@/lib/content";

/**
 * My promise to you.
 *
 * The refund conditions used to sit behind a "Refund conditions" disclosure.
 * That was the right call when they ran to two sentences including a
 * requirement to share a completed workbook — a requirement that appears
 * nowhere in the approved source and has been removed. What is left is one
 * sentence, and material refund terms that fit on one line should not need a
 * click. They are stated in the open, quietly, directly under the promise.
 *
 * With the toggle went the component's only state, so this is now a server
 * component; `RefundEnvelope` keeps its own client boundary for the drawing.
 */
export function GuaranteeSection() {
  return (
    <section
      id="guarantee"
      aria-labelledby="guarantee-heading"
      className="section-y relative overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1]"
        style={{
          background:
            "radial-gradient(65% 60% at 50% 30%, rgba(59,28,90,0.75) 0%, rgba(12,4,16,1) 70%)",
        }}
      />

      <div className="container-narrow text-center">
        <Reveal>
          {/* The refund itself, drawn — it says what a seal only implies. */}
          <RefundEnvelope className="mx-auto w-full max-w-[27rem]" />
        </Reveal>

        <Reveal delay={0.06}>
          <h2 id="guarantee-heading" className="mt-9 text-h2 font-semibold text-cream">
            {guarantee.heading}
          </h2>
        </Reveal>

        <div className="mt-9 flex flex-col gap-4">
          {guarantee.body.map((line, i) => (
            <Reveal key={line} delay={0.1 + i * 0.06}>
              <p className="text-lead text-cream-muted">{line}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <p className="mt-8 font-serif text-h3 text-honey italic">{guarantee.emphasis}</p>
        </Reveal>

        {/* Why he is willing to make the promise. Set quieter than the promise
            itself — it is him speaking, not a second guarantee. */}
        <Reveal delay={0.36}>
          <p className="mx-auto mt-5 max-w-md text-body text-cream-muted">
            {guarantee.confidence}
          </p>
        </Reveal>

        {/* Stated, not tucked away. Quieter than the promise it qualifies,
            but on the page rather than behind a control. */}
        <Reveal delay={0.42}>
          <p className="mx-auto mt-10 max-w-xl border-t border-cream/10 pt-7 text-sm text-cream-dim">
            {guarantee.conditions}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
