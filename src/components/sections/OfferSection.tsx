"use client";

import { motion } from "motion/react";

import { CTAButton } from "@/components/ui/CTAButton";
import { Reveal, RevealGroup, revealChild } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { inclusions } from "@/lib/content";
import { inr, programDetails } from "@/lib/config";

export function OfferSection() {
  return (
    <section
      id="whats-included"
      aria-labelledby="offer-heading"
      className="section-y relative bg-paper text-ink"
    >
      <div className="container-page">
        <SectionHeading
          tone="light"
          eyebrow="What you get"
          title={
            <>Your {inr(programDetails.price)} includes&hellip;</>
          }
        />

        <RevealGroup as="ul" className="mt-16 grid gap-px bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
          {inclusions.map((item, i) => (
            <motion.li
              key={item.key}
              variants={revealChild}
              className="group relative bg-paper p-8 transition-colors duration-500 hover:bg-paper-2 sm:p-9"
            >
              <span className="text-sm font-medium tabular-nums text-amber-ink">
                {String(i + 1).padStart(2, "0")}
              </span>

              <h3 className="mt-5 text-h3 font-semibold text-ink">{item.title}</h3>
              <p className="mt-3 text-body text-ink-muted">{item.description}</p>

              {/* Honey rule that draws in on hover. */}
              <span
                aria-hidden
                className="absolute bottom-0 left-0 h-px w-0 bg-honey transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-full"
              />
            </motion.li>
          ))}
        </RevealGroup>

        <Reveal delay={0.1}>
          <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-5">
            <CTAButton>I want to begin</CTAButton>
            <p className="text-body text-ink-muted">
              {programDetails.seats} seats · {programDetails.dateLabel}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
