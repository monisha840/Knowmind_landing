"use client";

import { motion } from "motion/react";

import { Reveal, RevealGroup, revealChild } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { notForYou, outcomes, personas } from "@/lib/content";
import { programDetails } from "@/lib/config";

export function AudienceSection() {
  return (
    <section
      id="who-its-for"
      aria-labelledby="audience-heading"
      className="section-y relative bg-paper text-ink"
    >
      <div className="container-page">
        <SectionHeading
          tone="light"
          eyebrow="Who it's for"
          title={
            <>
              This journey is for you if&hellip;
            </>
          }
        />

        {/* ---- Four ways in ---- */}
        <RevealGroup as="ul" className="mt-16 grid gap-px bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
          {personas.map((persona, i) => (
            <motion.li
              key={persona.key}
              variants={revealChild}
              className="group bg-paper p-8 transition-colors duration-500 hover:bg-paper-2"
            >
              <span className="text-sm font-medium tabular-nums text-amber-ink">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-h3 font-semibold text-ink">{persona.title}</h3>
              <p className="mt-3 text-body text-ink-muted">{persona.description}</p>
            </motion.li>
          ))}
        </RevealGroup>

        {/* ---- What may shift, and what this is not ---- */}
        <div className="mt-24 grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Reveal>
              <h3 className="text-eyebrow font-semibold tracking-[0.18em] text-amber-ink uppercase">
                After {programDetails.days} days you may begin to&hellip;
              </h3>
            </Reveal>

            <RevealGroup as="ul" className="mt-8 flex flex-col">
              {outcomes.map((outcome) => (
                <motion.li
                  key={outcome}
                  variants={revealChild}
                  className="flex items-start gap-4 border-b border-ink/10 py-5"
                >
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    fill="none"
                    className="mt-1 h-5 w-5 shrink-0 text-amber-ink"
                  >
                    <path
                      d="m4.5 12.5 5 5 10-11"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-lead text-ink">{outcome}</span>
                </motion.li>
              ))}
            </RevealGroup>

            <Reveal delay={0.1}>
              <p className="mt-6 text-sm text-ink-muted">
                Written as &ldquo;may begin to&rdquo; on purpose. Fourteen days changes what you
                notice — what you then do with it stays yours.
              </p>
            </Reveal>
          </div>

          {/* Honest disqualification builds more trust than another promise. */}
          <div className="lg:col-span-5">
            <Reveal>
              <div className="rounded-card border border-ink/10 bg-paper-2 p-8 sm:p-9">
                <h3 className="text-eyebrow font-semibold tracking-[0.18em] text-ink-muted uppercase">
                  Not for you if&hellip;
                </h3>

                <ul className="mt-7 flex flex-col gap-4">
                  {notForYou.map((item) => (
                    <li key={item} className="flex items-start gap-3.5 text-body text-ink-muted">
                      <span
                        aria-hidden
                        className="mt-[0.62em] h-px w-3.5 shrink-0 bg-ink/30"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
