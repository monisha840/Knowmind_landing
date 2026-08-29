"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";

import { RefundEnvelope } from "@/components/ui/RefundEnvelope";
import { Reveal } from "@/components/ui/Reveal";
import { guarantee } from "@/lib/content";
import { usePrefersReducedMotion } from "@/lib/hooks";

export function GuaranteeSection() {
  const [open, setOpen] = useState(false);
  const reduced = usePrefersReducedMotion();
  const panelId = useId();

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

        {/* The conditions are part of the promise, so they are one click away
            and worded plainly — not buried in a footnote. */}
        <Reveal delay={0.36}>
          <div className="mt-11">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls={panelId}
              className="inline-flex items-center gap-2.5 text-sm font-medium text-cream-muted transition-colors hover:text-honey"
            >
              Refund conditions
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
              >
                <path
                  d="m6 9.5 6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  id={panelId}
                  role="region"
                  initial={reduced ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="mx-auto mt-6 max-w-xl rounded-card border border-cream/10 bg-wine-950/60 p-6 text-body text-cream-muted">
                    {guarantee.conditions}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
