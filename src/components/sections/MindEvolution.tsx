"use client";

import { useEffect, useRef, useState } from "react";

import { Reveal } from "@/components/ui/Reveal";
import { KnowMind3D } from "@/components/three/knowmind";
import { tamil } from "@/lib/content";

/**
 * One mind, three states.
 *
 * Three identical sculptural profile heads stand in a row. Nothing about them
 * differs — same form, same material, same orientation — except the thread
 * inside each skull. They begin as three copies of the same tangle and come
 * apart as the visitor scrolls: the left one holds, the middle reorganises,
 * the right resolves into a spiral. The last thing on screen is the whole
 * story at once.
 *
 * Everything a visitor needs to understand is in the HTML. The canvas is
 * decorative and marked as such; remove it entirely and this section still
 * reads as three states of the method.
 */

type State = {
  key: string;
  index: string;
  label: string;
  heading: string;
  body: string;
  tamil?: string;
};

const states: State[] = [
  {
    key: "tangled",
    index: "01",
    label: "Tangled",
    heading: "The mind you arrive with.",
    body: "Most patterns run quietly, underneath the day — the starting, the stopping, the promise broken again by Thursday. Nothing shifts while they stay unnoticed. Awareness is only this: seeing the knot for what it is.",
  },
  {
    key: "unraveling",
    index: "02",
    label: "Unraveling",
    heading: "It begins to loosen.",
    body: "Noticing is not enough on its own. Reflection asks the harder question — why does this keep repeating, and what is it protecting me from? The knot does not disappear. It starts to make sense.",
  },
  {
    key: "clear",
    index: "03",
    label: "Clear",
    heading: "You know how to return.",
    body: "Not a different mind. The same mind, slightly more aware, choosing one small action — and choosing it again tomorrow. You do not need to be perfect. You need a way back.",
    tamil: tamil.itsOkay,
  },
];

export function MindEvolution() {
  const track = useRef<HTMLElement>(null);
  const copy = useRef<(HTMLDivElement | null)[]>([]);
  const captions = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);

  /**
   * The copy scrolls past a pinned visual, which means each block has to travel
   * up through the heads on its way out. So each one is shown only while it is
   * actually inside the lower band: the observer's root is narrowed to that
   * band with a negative rootMargin, and a block that leaves it fades rather
   * than sliding across the sculpture.
   *
   * The attribute is written straight to the DOM — no React state, no
   * re-render — and until it exists the copy is simply visible, so this stays a
   * progressive enhancement over plain scrolling.
   */
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          (entry.target as HTMLElement).dataset.inband = String(entry.isIntersecting);
        }
      },
      { rootMargin: "-62% 0px -2% 0px" },
    );
    const blocks = copy.current.filter(Boolean) as HTMLDivElement[];
    blocks.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="mind-evolution"
      ref={track}
      aria-labelledby="mind-evolution-heading"
      className="relative isolate"
    >
      <h2 id="mind-evolution-heading" className="sr-only">
        One mind in three states: tangled, unravelling, clear
      </h2>

      {/* ---- The pinned sculpture ---------------------------------------- */}
      <div className="sticky top-0 h-[100svh] w-full">
        {/* Keeps the copy legible where it passes under the heads. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(12,4,16,0) 42%, rgba(12,4,16,0.72) 62%, rgba(12,4,16,0.94) 78%)",
          }}
        />

        <div className="absolute inset-x-0 top-[8svh] h-[40svh] lg:h-[42svh]">
          <KnowMind3D
            trackRef={track}
            onChapterChange={setActive}
            fade={[0.93, 1]}
            fadeRef={captions}
            className="h-full w-full"
          />
        </div>

        {/* State captions, on the same three columns as the heads. Hidden on
            phones, where the camera tracks along the row instead of showing all
            three at once — there, each block of copy carries its own label. */}
        <ol
          ref={captions}
          className="absolute inset-x-0 top-[52svh] hidden grid-cols-3 lg:grid"
        >
          {states.map((state, i) => (
            <li
              key={state.key}
              className="flex flex-col items-center gap-2 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ opacity: active === i ? 1 : 0.34 }}
            >
              <span
                aria-hidden
                className="h-px bg-honey transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ width: active === i ? "2.5rem" : "1rem" }}
              />
              <span className="text-eyebrow font-semibold tracking-[0.18em] text-honey uppercase">
                {state.index}
              </span>
              <span className="text-eyebrow font-semibold tracking-[0.18em] text-cream uppercase">
                {state.label}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* ---- Three screens of copy, pulled up over the pinned visual ------ */}
      <div className="relative -mt-[100svh]">
        {states.map((state, i) => (
          <article
            key={state.key}
            aria-label={`State ${state.index}: ${state.label}`}
            /* pb clears the phone-only sticky registration bar. */
            className="flex h-[100svh] items-end pb-[13svh] lg:pb-[7svh]"
          >
            <div className="container-page w-full">
              <div
                ref={(el) => {
                  copy.current[i] = el;
                }}
                className="mx-auto max-w-xl transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] data-[inband=false]:opacity-0 lg:text-center"
              >
                {/* Phones only: from lg the caption under the head already
                    names the state, and repeating it here puts the same two
                    words twice on screen as the copy scrolls past. */}
                <Reveal>
                  <p className="flex items-baseline gap-3 text-eyebrow font-semibold tracking-[0.18em] uppercase lg:hidden">
                    <span className="text-honey">{state.index}</span>
                    <span className="text-cream-dim">{state.label}</span>
                  </p>
                </Reveal>

                <Reveal delay={0.07}>
                  <p className="mt-5 text-h3 font-semibold text-balance text-cream lg:mt-0">
                    {state.heading}
                  </p>
                </Reveal>

                <Reveal delay={0.13}>
                  <p className="mt-5 text-body text-pretty text-cream-muted">{state.body}</p>
                </Reveal>

                {state.tamil && (
                  <Reveal delay={0.19}>
                    <p lang="ta" className="mt-6 text-lead text-honey/90">
                      {state.tamil}
                    </p>
                  </Reveal>
                )}
              </div>
            </div>
          </article>
        ))}

        {/* A tail after the last state. It gives the third screen room to be
            read while the sculpture holds its final arrangement, and it means
            the visual has faded out by the time the pin releases — so it never
            overlaps whatever the next section puts on screen. */}
        <div aria-hidden className="h-[30svh]" />
      </div>
    </section>
  );
}
