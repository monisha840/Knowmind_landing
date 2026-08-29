"use client";

import { motion } from "motion/react";

import { CTAButton } from "@/components/ui/CTAButton";
import { inr, programDetails, siteConfig } from "@/lib/config";
import { tamil } from "@/lib/content";

const facts = [
  programDetails.dateLabelShort.toUpperCase(),
  programDetails.timeShort,
  "LIVE ZOOM",
  "TAMIL + ENGLISH",
  `${programDetails.seats} PARTICIPANTS`,
  inr(programDetails.price),
];

const promises = [
  "Understand your patterns.",
  "Rebuild self-trust.",
  "Take small daily actions.",
  "Become 1% Better Every Day.",
];

/** Entrance choreography — one shared rhythm for the whole hero. */
const rise = {
  hidden: { opacity: 0, y: 26 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.09, duration: 0.85, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Hero() {
  return (
    <section
      id="top"
      data-three-window
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden pt-32 sm:pt-36"
    >
      {/* Depth wash behind the copy so text stays legible over the 3D. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1]"
        style={{
          background:
            "radial-gradient(90% 70% at 8% 42%, rgba(12,4,16,0.92) 0%, rgba(12,4,16,0.7) 42%, rgba(12,4,16,0) 78%)",
        }}
      />

      <div className="container-page grid flex-1 items-center gap-12 pb-14 lg:grid-cols-12">
        {/* Copy occupies just over half the field; the growth object holds the rest. */}
        <div className="lg:col-span-7 xl:col-span-6">
          <motion.div custom={0} variants={rise} initial="hidden" animate="visible">
            <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-2 text-eyebrow font-semibold tracking-[0.18em] text-honey uppercase">
              <span className="rounded-full border border-honey/35 px-3 py-1.5">
                {siteConfig.batch}
              </span>
              <span className="text-cream-muted">{siteConfig.programSubtitle}</span>
            </span>
          </motion.div>

          <h1 className="mt-7 text-display font-semibold text-cream">
            {["1% Better.", "Every Day."].map((line, i) => (
              <span key={line} className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{
                    delay: 0.22 + i * 0.1,
                    duration: 1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {i === 0 ? (
                    <>
                      <span className="text-honey">1%</span> Better.
                    </>
                  ) : (
                    line
                  )}
                </motion.span>
              </span>
            ))}
          </h1>

          {/* The emotional hook, in the visitor's own language. */}
          <motion.p
            custom={3}
            variants={rise}
            initial="hidden"
            animate="visible"
            lang="ta"
            className="mt-8 max-w-xl text-lead text-cream/90"
          >
            {tamil.heroQuestion}
          </motion.p>

          <motion.p
            custom={4}
            variants={rise}
            initial="hidden"
            animate="visible"
            className="mt-4 max-w-lg text-body text-cream-muted"
          >
            You know what you need to do. But why is it so difficult to keep doing it
            consistently?
          </motion.p>

          <motion.ul
            custom={5}
            variants={rise}
            initial="hidden"
            animate="visible"
            className="mt-8 flex flex-wrap gap-x-5 gap-y-2.5"
          >
            {promises.map((line) => (
              <li key={line} className="flex items-center gap-2.5 text-sm text-cream/80">
                <span aria-hidden className="h-1 w-1 rounded-full bg-gold" />
                {line}
              </li>
            ))}
          </motion.ul>

          <motion.div
            custom={6}
            variants={rise}
            initial="hidden"
            animate="visible"
            className="mt-11 flex flex-wrap items-center gap-x-6 gap-y-4"
          >
            <CTAButton size="lg">Begin Your 1% Journey</CTAButton>
            <p className="text-sm text-cream-muted">
              Founding price{" "}
              <span className="font-semibold text-cream">{inr(programDetails.price)}</span>
              <span className="mx-2 text-cream/25">·</span>
              {programDetails.seats} seats only
            </p>
          </motion.div>
        </div>
      </div>

      {/* Full-bleed fact strip — the architectural base of the hero. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.9 }}
        className="relative border-t border-cream/10 bg-night/40 backdrop-blur-sm"
      >
        <ul className="container-page flex flex-wrap items-center gap-x-6 gap-y-3 py-5 text-eyebrow font-semibold tracking-[0.16em] text-cream/70 uppercase sm:gap-x-9">
          {facts.map((fact, i) => (
            <li key={fact} className="flex items-center gap-6 sm:gap-9">
              {i > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-honey/70" />}
              <span className={i === facts.length - 1 ? "text-honey" : undefined}>{fact}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}
