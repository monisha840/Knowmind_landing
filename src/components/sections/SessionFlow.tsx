"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { RevealGroup, revealChild } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { sessionSteps } from "@/lib/content";
import { programDetails } from "@/lib/config";

export function SessionFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });

  return (
    <section
      id="session-flow"
      data-three-window
      aria-labelledby="session-heading"
      className="section-y relative"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(12,4,16,1) 0%, rgba(21,7,24,0.94) 40%, rgba(21,7,24,0.94) 60%, rgba(12,4,16,1) 100%)",
        }}
      />

      <div className="container-page">
        <SectionHeading
          eyebrow="Inside a session"
          title={`How each ${programDetails.timeShort.replace(" ", " ")} session works`}
          lead="Forty-five minutes with a shape to them. The same five movements, every morning, so you always know where you are."
        />

        <div ref={ref} className="relative mt-20">
          {/* The rail the steps sit on — draws itself once, on arrival. */}
          <div
            aria-hidden
            className="absolute top-7 left-0 hidden h-px w-full bg-cream/12 lg:block"
          />
          <motion.div
            aria-hidden
            className="absolute top-7 left-0 hidden h-px w-full origin-left bg-honey lg:block"
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : undefined}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          />

          <RevealGroup as="ol" className="grid gap-10 lg:grid-cols-5 lg:gap-6" stagger={0.1}>
            {sessionSteps.map((step) => (
              <motion.li key={step.index} variants={revealChild} className="relative">
                <div className="flex items-center gap-5 lg:block">
                  <span className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full border border-honey/40 bg-night text-lead font-semibold text-honey">
                    {step.index}
                  </span>

                  <h3 className="text-h3 font-semibold text-cream lg:mt-7">{step.title}</h3>
                </div>

                <p className="mt-3 max-w-xs text-body text-cream-muted lg:mt-4">
                  {step.description}
                </p>
              </motion.li>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
