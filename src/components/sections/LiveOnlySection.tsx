"use client";

import { motion } from "motion/react";

import { RevealGroup, revealChild } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { liveReasons } from "@/lib/content";

export function LiveOnlySection() {
  return (
    <section
      id="why-live"
      aria-labelledby="live-heading"
      className="section-y relative bg-wine-950"
    >
      <div className="container-page">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="Live only"
              title="Why live?"
              lead="There is no recording for the first four batches. That is a deliberate choice, not a limitation."
            />
          </div>

          <div className="lg:col-span-7">
            <RevealGroup as="ul" className="border-t border-cream/10">
              {liveReasons.map((reason) => (
                <motion.li
                  key={reason.title}
                  variants={revealChild}
                  className="grid gap-2 border-b border-cream/10 py-7 sm:grid-cols-12 sm:gap-8"
                >
                  <h3 className="text-h3 font-medium text-honey sm:col-span-4">
                    {reason.title}
                  </h3>
                  <p className="text-body text-cream-muted sm:col-span-8">
                    {reason.description}
                  </p>
                </motion.li>
              ))}
            </RevealGroup>

            <RevealGroup className="mt-10">
              <motion.p variants={revealChild} className="max-w-xl text-body text-cream-dim">
                Recorded courses have their place — most of us own several we never finished.
                This one asks for something different: that you show up, once a day, for
                fourteen days. That is the whole mechanism.
              </motion.p>
            </RevealGroup>
          </div>
        </div>
      </div>
    </section>
  );
}
