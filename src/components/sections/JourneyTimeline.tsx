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
  //
  // One band at every width, because the days are a vertical list at every
  // width now. The rail this used to allow for needed a *vertical* band —
  // sideways cards all share one vertical position, so a horizontal band
  // matched the whole week at once — and that special case went with it.
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

        <div className="mt-12 grid gap-10 sm:mt-20 sm:gap-14 lg:mt-24 lg:grid-cols-12 lg:gap-16">
          {/* ------------- Sticky day panel — from `lg` only -------------

              A 46rem-tall card that pins beside a list works because there is a
              second column to pin it against. On a phone there is no second
              column: the card just sat at the top of the section as a large
              static block, scrolled away, and the fourteen days below it then
              tracked a meter nobody could see any more. The phone gets the
              compact bar further down instead — same data, same active day,
              two rows of it — and this is `display: none` there rather than
              merely shrunk, so its `progressbar` never doubles up with the
              other one in the accessibility tree. */}
          <div className="hidden min-w-0 lg:col-span-5 lg:block">
            <div className="lg:sticky lg:top-32">
              <div className="rounded-card border border-cream/10 bg-wine-950/50 p-6 backdrop-blur-sm sm:p-10">
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

          {/* ------------- The days -------------

              `min-w-0` caps the track, and it is not decoration. An `auto`
              grid track takes its minimum from its item's min-content, and the
              bar below truncates its label — which means `white-space: nowrap`,
              which means that label's min-content is the whole untruncated
              string. Scrolling to a long day title ("Inner critic -> Inner
              coach") therefore widened this column past the page at 320px, a
              screen at a time, exactly the way the old sideways rail did.
              Clipping is the bar's job; sizing this track is not. */}
          <div className="min-w-0 lg:col-span-7">
            {/* ---- The phone's meter ----

                Sticky against this column rather than the viewport, so it
                arrives with the first day, follows the whole list, and leaves
                with the last — it is never pinned over a section it has nothing
                to say about. `top-0` is free: the page carries no fixed header,
                and the only other pinned layer is the registration bar at the
                bottom.

                Full-bleed by the usual pair of negative margins and matching
                padding, so the bar spans the screen while its contents stay on
                the page's own gutter. It is a block element, so that cannot
                widen the page the way the sideways rail here once did.

                No `AnimatePresence` swap: this is a status readout a thumb is
                scrolling past, and a 380ms exit on every one of fourteen days
                would spend more time animating than showing. The colour
                transitions, the text does not. */}
            <div
              className="sticky top-0 z-30 -mx-[var(--spacing-gutter)] mb-6 border-b border-cream/10 bg-night/92 px-[var(--spacing-gutter)] py-3 backdrop-blur-md lg:hidden"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 truncate text-eyebrow font-semibold tracking-[0.18em] text-honey uppercase">
                  {week.label}
                  <span className="text-cream-dim"> · {day.title}</span>
                </p>
                <p className="shrink-0 text-sm font-medium tabular-nums text-cream">
                  {pad(day.day)}
                  <span className="text-cream-dim"> / {journeyDays.length}</span>
                </p>
              </div>

              <div
                className="mt-2.5 flex gap-1"
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
            </div>

            {journeyWeeks.map((w) => (
              <div key={w.week} className="mb-10 last:mb-0 sm:mb-14">
                <Reveal>
                  <div className="flex items-baseline justify-between border-b border-honey/25 pb-4">
                    <h3 className="text-eyebrow font-semibold tracking-[0.18em] text-honey uppercase">
                      {w.label}
                    </h3>
                    <p className="text-lg font-medium text-cream sm:text-h3">{w.title}</p>
                  </div>
                </Reveal>

                {/* One vertical column at every width.
                    This was a sideways rail below `lg` to save phone scrolling,
                    and it broke the section outright: a horizontally scrolling
                    flex row inside a grid item sizes the grid track to its own
                    content, so the whole two-column area was laid out ~2100px
                    wide at 390px. `body { overflow-x: clip }` then cut it off,
                    taking the day panel's right edge, the fourteen progress
                    ticks and days 2-7 with it — unreachable, not merely
                    off-screen. The rows below are compact on a phone instead. */}
                <ul className="mt-3 flex flex-col gap-2.5 lg:mt-0 lg:gap-0">
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
                        className="rounded-card border border-cream/10 lg:rounded-none lg:border-0 lg:border-b"
                      >
                        <div
                          className={`flex h-full items-start gap-3.5 p-4 transition-opacity duration-500 sm:gap-4 lg:gap-8 lg:p-0 lg:py-8 ${
                            isActive ? "opacity-100" : "opacity-45"
                          }`}
                        >
                          <span
                            className={`mt-0.5 shrink-0 text-sm font-medium tabular-nums transition-colors duration-500 lg:mt-1 ${
                              isActive ? "text-honey" : "text-cream-dim"
                            }`}
                          >
                            {pad(d.day)}
                          </span>

                          <div className="min-w-0">
                            {/* Down a step on a phone only: fourteen of these
                                at `text-h3` is a page of headlines on a 320px
                                screen. From `sm` it is the size it always was. */}
                            <h4 className="text-lg font-medium text-cream sm:text-h3">
                              {d.title}
                            </h4>
                            <p className="mt-1 max-w-md text-sm text-cream-muted sm:mt-1.5 sm:text-body">
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
              {/* The line the desktop panel carries. It lives there and not
                  here from `lg` up, so this is the phone's only copy of it —
                  the compact bar has no room for a sentence. */}
              <p className="mt-8 text-sm text-cream-dim lg:hidden">
                The arithmetic of 1%:{" "}
                <span className="text-cream-muted tabular-nums">1.01¹⁴ ≈ 1.15</span>. Not a
                promise — just what repetition does.
              </p>

              <p className="mt-4 text-body text-cream-dim lg:mt-10">
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
