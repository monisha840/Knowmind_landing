"use client";

import { motion } from "motion/react";

import { Reveal, RevealGroup, revealChild } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { testimonials, videoTestimonials } from "@/lib/content";

export function Testimonials() {
  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="section-y relative bg-paper-2 text-ink"
    >
      <div className="container-page">
        <SectionHeading
          tone="light"
          eyebrow="From the founding batch"
          title={
            <>
              Real words.
              <br />
              Real people.
            </>
          }
        />

        {/* Swipeable on phones, a grid from md up. */}
        <RevealGroup
          className="-mx-[var(--spacing-gutter)] mt-16 flex snap-x snap-mandatory gap-5 overflow-x-auto px-[var(--spacing-gutter)] pb-4 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3"
          stagger={0.07}
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.name}
              variants={revealChild}
              className="w-[85vw] shrink-0 snap-start sm:w-[60vw] md:w-auto md:shrink"
            >
              <TestimonialCard testimonial={testimonial} />
            </motion.div>
          ))}
        </RevealGroup>

        {/* ---- Video slots ---- */}
        <div className="mt-20">
          <Reveal>
            <h3 className="text-eyebrow font-semibold tracking-[0.18em] text-ink-muted uppercase">
              In their own voice
            </h3>
          </Reveal>

          <RevealGroup className="mt-7 grid gap-5 sm:grid-cols-3">
            {videoTestimonials.map((video) => (
              <motion.div key={video.id} variants={revealChild}>
                {video.src ? (
                  <video
                    className="aspect-video w-full rounded-card object-cover"
                    controls
                    preload="none"
                    poster={video.poster ?? undefined}
                    aria-label={video.label}
                  >
                    <source src={video.src} />
                  </video>
                ) : (
                  /* No recordings supplied yet — an honest placeholder rather
                     than a stock video or an invented quote. */
                  <div
                    className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-card border border-dashed border-ink/20 bg-paper/60 text-center"
                    role="img"
                    aria-label={`${video.label} — not yet available`}
                  >
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-8 w-8 text-ink/25"
                    >
                      <rect
                        x="2.5"
                        y="5"
                        width="19"
                        height="14"
                        rx="3"
                        stroke="currentColor"
                        strokeWidth="1.4"
                      />
                      <path d="m10 9.5 5 2.5-5 2.5v-5Z" fill="currentColor" />
                    </svg>
                    <span className="text-sm text-ink-muted">{video.label}</span>
                    <span className="text-xs text-ink-muted/70">Coming soon</span>
                  </div>
                )}
              </motion.div>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
