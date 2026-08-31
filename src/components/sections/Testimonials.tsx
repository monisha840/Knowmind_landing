"use client";

import { motion } from "motion/react";
import { type CSSProperties, type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";

import { Reveal, RevealGroup, revealChild } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { testimonials, videoTestimonials } from "@/lib/content";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";

/* -------------------------------------------------------------------------- */
/*  Quiet evidence                                                             */
/*                                                                            */
/*  A paged track rather than a grid: three cards at a time on desktop, two on */
/*  tablet, one on a phone — and the visitor moves between pages themselves.   */
/*  There is no autoplay and no wrap-around; the arrows simply disable at both */
/*  ends. Testimonials are evidence, not a slideshow to sit through.           */
/*                                                                            */
/*  How the paging works, because it is doing something slightly unusual:      */
/*  `--pages` is set per breakpoint in CSS, so the track sizes itself without  */
/*  measuring anything and without a layout flash before hydration. The track  */
/*  is `--pages` viewports wide, each of the six cards is a sixth of it, and   */
/*  one page step is exactly one viewport. JavaScript owns only the page index.*/
/*  No ResizeObserver, no scroll listener, one transform for the whole track.  */
/*                                                                            */
/*  Every card stays in the DOM at every page, so all six quotes are readable  */
/*  by screen readers and crawlers whatever page is showing (§16).             */
/* -------------------------------------------------------------------------- */

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/** Past this, a horizontal drag counts as a page change rather than a tap. */
const SWIPE_THRESHOLD = 48;

export function Testimonials() {
  const reduced = usePrefersReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isTablet = useMediaQuery("(min-width: 640px)");

  const perView = isDesktop ? 3 : isTablet ? 2 : 1;
  const pages = Math.ceil(testimonials.length / perView);

  const [page, setPage] = useState(0);

  // Resizing across a breakpoint can leave the visitor past the last page.
  useEffect(() => {
    setPage((current) => Math.min(current, pages - 1));
  }, [pages]);

  const go = (delta: number) =>
    setPage((current) => Math.min(Math.max(current + delta, 0), pages - 1));

  const atStart = page === 0;
  const atEnd = page === pages - 1;

  /* -- Swipe. Horizontal only: `touch-pan-y` leaves vertical scrolling to the
        browser, so the page never feels hijacked. ------------------------- */

  const dragStart = useRef<number | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Mouse drags are left alone so text selection still works on desktop.
    if (e.pointerType === "mouse") return;
    dragStart.current = e.clientX;
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    dragStart.current = null;
    if (start === null) return;
    const dx = e.clientX - start;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    go(dx < 0 ? 1 : -1);
  };

  const arrowBase =
    "grid h-11 w-11 place-items-center rounded-full border border-ink/15 text-ink " +
    `transition-colors duration-300 ${EASE} ` +
    "hover:border-amber-ink/50 hover:bg-honey/12 hover:text-amber-ink " +
    "disabled:pointer-events-none disabled:opacity-30";

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="section-y relative bg-paper-2 text-ink"
    >
      <div className="container-page">
        {/* Heading and controls share a baseline on desktop; they stack on a
            phone so neither has to shrink. */}
        <div className="flex flex-col gap-9 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
          <SectionHeading
            id="testimonials-heading"
            tone="light"
            eyebrow="From the founding batch"
            title={
              <>
                Real words.
                <br />
                Real people.
              </>
            }
            className="sm:max-w-lg"
          />

          <Reveal delay={0.12}>
            <div className="flex items-center gap-5">
              {/* Where you are, stated plainly rather than as a row of dots. */}
              <p
                aria-live="polite"
                className="flex items-center gap-3 text-eyebrow font-semibold tracking-[0.18em] text-ink-muted uppercase tabular-nums"
              >
                <span className="text-amber-ink">
                  {String(page + 1).padStart(2, "0")}
                </span>
                <span aria-hidden className="h-px w-8 bg-ink/15">
                  <span
                    className={`block h-px origin-left bg-honey transition-transform duration-500 ${EASE}`}
                    style={{ transform: `scaleX(${(page + 1) / pages})` }}
                  />
                </span>
                <span>{String(pages).padStart(2, "0")}</span>
              </p>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  disabled={atStart}
                  aria-label="Previous testimonials"
                  className={arrowBase}
                >
                  <svg aria-hidden viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path
                      d="M20 12H5m0 0 5.5-5.5M5 12l5.5 5.5"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => go(1)}
                  disabled={atEnd}
                  aria-label="Next testimonials"
                  className={arrowBase}
                >
                  <svg aria-hidden viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path
                      d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ---- The track ---- */}
        <Reveal delay={0.06}>
          {/* The negative margin lets each card's own gutter sit flush with the
              page container, so the outer cards align with the heading. */}
          <div
            // `py-2` gives the clip box room for the hover lift, which
            // `overflow-hidden` would otherwise shave off. The top margin is
            // reduced by the same 8px and the bottom one cancels it, so the
            // section's rhythm is unchanged.
            className="-mx-2.5 -mb-2 mt-10 touch-pan-y overflow-hidden py-2 lg:mt-12"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
              dragStart.current = null;
            }}
          >
            <ul
              className={`flex [--pages:6] sm:[--pages:3] lg:[--pages:2] ${
                reduced ? "" : `transition-transform duration-[600ms] ${EASE}`
              }`}
              style={
                {
                  "--page": page,
                  width: "calc(var(--pages) * 100%)",
                  transform: "translateX(calc(var(--page) * -100% / var(--pages)))",
                } as CSSProperties
              }
            >
              {testimonials.map((testimonial, i) => {
                const onThisPage = Math.floor(i / perView) === page;

                return (
                  <li
                    key={testimonial.name}
                    // Six cards, always a sixth of the track each — the track's
                    // width is what changes with the breakpoint, not the card's.
                    className={`group/card w-1/6 shrink-0 px-2.5 ${
                      reduced
                        ? ""
                        : `transition-[opacity,transform] duration-500 ${EASE} hover:-translate-y-1 ${
                            onThisPage ? "opacity-100" : "opacity-30"
                          } ${["delay-0", "delay-75", "delay-150"][i % 3]}`
                    }`}
                    // Deliberately not `inert`: a card holds no focusable
                    // element, so inert would buy nothing and would strip all
                    // six quotes out of the accessibility tree.
                  >
                    <TestimonialCard testimonial={testimonial} />
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>

        {/* ---- Video slots ---- */}
        <div className="mt-16 lg:mt-20">
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
