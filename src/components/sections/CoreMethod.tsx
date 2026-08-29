"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { methodIcons } from "@/components/ui/MethodIcons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { methodStages } from "@/lib/content";
import { usePrefersReducedMotion } from "@/lib/hooks";

const RADIUS = 41; // % of the square container
const STEP_MS = 3600;

/** Node coordinates, starting at the top and moving clockwise. */
const nodePosition = (i: number, total: number) => {
  const angle = (-90 + (360 / total) * i) * (Math.PI / 180);
  return {
    left: `${50 + RADIUS * Math.cos(angle)}%`,
    top: `${50 + RADIUS * Math.sin(angle)}%`,
  };
};

export function CoreMethod() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduced = usePrefersReducedMotion();

  const total = methodStages.length;
  const stage = methodStages[active];

  // Advances on its own while visible, and yields the moment anyone touches it.
  useEffect(() => {
    if (!inView || paused || reduced) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % total), STEP_MS);
    return () => window.clearInterval(id);
  }, [inView, paused, reduced, total]);

  // Arc length for the progress ring, in SVG user units.
  const circumference = 2 * Math.PI * 41;
  const progress = total > 1 ? active / (total - 1) : 1;

  return (
    <section
      id="method"
      data-three-window
      aria-labelledby="method-heading"
      className="section-y relative"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(12,4,16,0) 0%, rgba(29,10,24,0.9) 30%, rgba(29,10,24,0.9) 70%, rgba(12,4,16,0) 100%)",
        }}
      />

      <div className="container-page">
        <SectionHeading
          eyebrow="The method"
          title={
            <>
              Not motivation. <span className="text-honey">A cycle.</span>
            </>
          }
          lead="Five movements that repeat every single day of the journey. Small enough to actually complete. Repeated often enough to compound."
          className="mx-auto max-w-3xl text-center [&>*]:items-center"
          align="center"
        />

        <div
          ref={ref}
          className="mt-20 grid items-center gap-16 lg:mt-24 lg:grid-cols-2 lg:gap-20"
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
        >
          {/* ---------------- The wheel ---------------- */}
          <Reveal className="order-2 lg:order-1">
            <div className="relative mx-auto aspect-square w-full max-w-[30rem]">
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="41"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.35"
                  className="text-cream/15"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="41"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.7"
                  strokeLinecap="round"
                  className="text-honey"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset: circumference * (1 - progress) }}
                  initial={false}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
              </svg>

              {/* Centre: the active stage */}
              <div className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full border border-cream/10 bg-wine-950/60 p-6 text-center backdrop-blur-sm">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={stage.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-eyebrow font-semibold tracking-[0.18em] text-cream-dim">
                      {stage.index}
                    </span>
                    <span className="mt-2 text-h3 font-semibold text-cream">{stage.title}</span>
                    <span className="mt-1 font-serif text-lg text-honey italic">
                      {stage.headline}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Nodes */}
              {methodStages.map((s, i) => {
                const Icon = methodIcons[s.key];
                const isActive = i === active;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      setActive(i);
                      setPaused(true);
                    }}
                    aria-label={`${s.title} — ${s.headline}`}
                    aria-current={isActive}
                    style={nodePosition(i, total)}
                    className="absolute grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:h-16 sm:w-16"
                  >
                    <span
                      className={`absolute inset-0 rounded-full border transition-all duration-500 ${
                        isActive
                          ? "scale-110 border-honey bg-honey text-wine-950"
                          : "border-cream/20 bg-wine-950/80 text-cream-muted hover:border-honey/60 hover:text-honey"
                      }`}
                    />
                    <Icon
                      className={`relative h-6 w-6 transition-colors duration-500 ${
                        isActive ? "text-wine-950" : "text-cream-muted"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </Reveal>

          {/* ---------------- The written stage ---------------- */}
          <div className="order-1 lg:order-2">
            <ol className="flex flex-col">
              {methodStages.map((s, i) => {
                const isActive = i === active;
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      onClick={() => {
                        setActive(i);
                        setPaused(true);
                      }}
                      aria-current={isActive}
                      className="group w-full border-b border-cream/10 py-5 text-left"
                    >
                      <div className="flex items-baseline gap-4">
                        <span
                          className={`text-sm tabular-nums transition-colors duration-300 ${
                            isActive ? "text-honey" : "text-cream-dim"
                          }`}
                        >
                          {s.index}
                        </span>
                        <span
                          className={`text-h3 font-medium transition-colors duration-300 ${
                            isActive ? "text-cream" : "text-cream-dim group-hover:text-cream"
                          }`}
                        >
                          {s.title}
                        </span>
                        <span
                          className={`ml-auto font-serif text-base italic transition-colors duration-300 ${
                            isActive ? "text-honey" : "text-cream-dim/70"
                          }`}
                        >
                          {s.headline}
                        </span>
                      </div>

                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.p
                            initial={reduced ? false : { height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden text-body text-cream-muted"
                          >
                            <span className="mt-3 block max-w-md pl-9">{s.body}</span>
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
