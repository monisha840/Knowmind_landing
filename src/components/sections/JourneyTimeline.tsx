"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { journeyDays, journeyWeeks } from "@/lib/content";
import { programDetails } from "@/lib/config";

const pad = (n: number) => String(n).padStart(2, "0");

export function JourneyTimeline() {
  const [active, setActive] = useState(0);
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);

  // Whichever day is crossing the middle of the viewport is the active one.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (!Number.isNaN(index)) setActive(index);
        }
      },
      { rootMargin: "-48% 0px -48% 0px", threshold: 0 },
    );

    const rows = rowRefs.current.filter(Boolean) as HTMLLIElement[];
    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, []);

  const day = journeyDays[active];
  const week = journeyWeeks.find((w) => w.week === day.week)!;
  const progress = (active + 1) / journeyDays.length;

  return (
    <section
      id="journey"
      data-three-window
      aria-labelledby="journey-heading"
      className="section-y relative"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(12,4,16,0) 0%, rgba(42,15,34,0.92) 18%, rgba(42,15,34,0.94) 82%, rgba(12,4,16,0) 100%)",
        }}
      />

      <div className="container-page">
        <SectionHeading
          eyebrow="The 14-day journey"
          title={
            <>
              Small steps.
              <br />
              <span className="text-honey">Big transformation.</span>
            </>
          }
          lead={
            <>
              Every morning — 45 minutes of guided psychological practice. Every night — 10
              minutes of honest reflection. Fourteen days that compound into real change.
            </>
          }
        />

        <div className="mt-20 grid gap-14 lg:mt-24 lg:grid-cols-12 lg:gap-16">
          {/* ------------- Sticky day panel ------------- */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <div className="rounded-card border border-cream/10 bg-wine-950/50 p-8 backdrop-blur-sm sm:p-10">
                <div className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-honey" />
                  <span className="text-eyebrow font-semibold tracking-[0.18em] text-honey uppercase">
                    {week.label} · {week.title}
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="mt-7 flex items-baseline gap-3">
                      <span className="text-[clamp(4rem,10vw,7rem)] leading-[0.85] font-semibold tabular-nums text-cream">
                        {pad(day.day)}
                      </span>
                      <span className="text-sm text-cream-dim">
                        / {journeyDays.length}
                      </span>
                    </div>

                    <h3 className="mt-6 text-h3 font-semibold text-honey">{day.title}</h3>
                    <p className="mt-3 max-w-sm text-body text-cream-muted">{day.description}</p>
                  </motion.div>
                </AnimatePresence>

                {/* Fourteen ticks — the journey as a meter you can see filling. */}
                <div
                  className="mt-9 flex gap-1"
                  role="progressbar"
                  aria-valuemin={1}
                  aria-valuemax={journeyDays.length}
                  aria-valuenow={day.day}
                  aria-label="Journey progress"
                >
                  {journeyDays.map((d, i) => (
                    <span
                      key={d.day}
                      className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                        i <= active ? "bg-honey" : "bg-cream/15"
                      }`}
                    />
                  ))}
                </div>

                <p className="mt-6 text-sm text-cream-dim">
                  The arithmetic of 1%:{" "}
                  <span className="text-cream-muted tabular-nums">1.01¹⁴ ≈ 1.15</span>. Not a
                  promise — just what repetition does.
                </p>
              </div>

              <motion.div
                className="mt-6 h-px origin-left bg-gradient-to-r from-honey to-transparent"
                initial={false}
                animate={{ scaleX: progress }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden
              />
            </div>
          </div>

          {/* ------------- The days ------------- */}
          <div className="lg:col-span-7">
            {journeyWeeks.map((w) => (
              <div key={w.week} className="mb-14 last:mb-0">
                <Reveal>
                  <div className="flex items-baseline justify-between border-b border-honey/25 pb-4">
                    <h3 className="text-eyebrow font-semibold tracking-[0.18em] text-honey uppercase">
                      {w.label}
                    </h3>
                    <p className="text-h3 font-medium text-cream">{w.title}</p>
                  </div>
                </Reveal>

                <ul>
                  {w.days.map((d) => {
                    const index = d.day - 1;
                    const isActive = index === active;
                    return (
                      <li
                        key={d.day}
                        data-index={index}
                        ref={(el) => {
                          rowRefs.current[index] = el;
                        }}
                        className="border-b border-cream/10"
                      >
                        <div
                          className={`flex items-start gap-6 py-7 transition-opacity duration-500 sm:gap-8 sm:py-8 ${
                            isActive ? "opacity-100" : "opacity-45"
                          }`}
                        >
                          <span
                            className={`mt-1 shrink-0 text-sm font-medium tabular-nums transition-colors duration-500 ${
                              isActive ? "text-honey" : "text-cream-dim"
                            }`}
                          >
                            {pad(d.day)}
                          </span>

                          <div>
                            <h4 className="text-h3 font-medium text-cream">{d.title}</h4>
                            <p className="mt-1.5 max-w-md text-body text-cream-muted">
                              {d.description}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            <Reveal>
              <p className="mt-10 text-body text-cream-dim">
                {programDetails.days} mornings. {programDetails.timeLabel}. Live on Zoom, in
                Tamil and English.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
