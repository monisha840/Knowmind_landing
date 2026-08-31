"use client";

import { useEffect, useRef, useState } from "react";

import { Reveal } from "@/components/ui/Reveal";
import { KnowMind3D } from "@/components/three/knowmind";
import { tamil } from "@/lib/content";

/**
 * One mind, three states.
 *
 * A single character stands beside the copy, and a single continuous thread
 * runs around it. As the visitor scrolls, that thread reorganises: a dense
 * tangle loosens into flowing loops, and the loops settle into one clean ring.
 * The character itself never changes — same body, same limbs, same quiet face.
 * The transformation is carried entirely by the thread.
 *
 * Scrolling back up runs the whole thing in reverse, because the state is a
 * pure function of scroll progress with nothing latched anywhere.
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
  const rail = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);

  /**
   * The copy scrolls past a pinned visual, which means each block has to travel
   * up through the character on its way out. So each one is shown only while it
   * is actually inside the lower band: the observer's root is narrowed to that
   * band with a negative rootMargin, and a block that leaves it fades rather
   * than sliding across the visual.
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
      { rootMargin: "-54% 0px -2% 0px" },
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

      {/* ---- The pinned visual ---------------------------------------- */}
      <div className="sticky top-0 h-[100svh] w-full">
        {/* Legibility washes: sideways on desktop where the copy sits beside
            the character, upward on mobile where it sits beneath it.

            The mobile ramp starts higher and closes harder than the desktop
            one because it has more to do. Beside the character there is empty
            frame to put text on; underneath him there is the character, and a
            phone's copy block is tall enough to reach up into his body. So the
            wash is dense by the time the eyebrow arrives and fully opaque
            under the paragraph — he reads as a background layer rather than as
            something the text is sitting on top of. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 lg:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(12,4,16,0) 24%, rgba(12,4,16,0.55) 38%, rgba(12,4,16,0.90) 50%, rgba(12,4,16,0.98) 62%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{
            background:
              "radial-gradient(75% 90% at 4% 50%, rgba(12,4,16,0.94) 0%, rgba(12,4,16,0.72) 44%, rgba(12,4,16,0) 76%)",
          }}
        />

        {/* Phones get the character in the upper half with the copy beneath it;
            from lg it takes the whole frame and stands beside the copy.

            The band sits a little higher and a little shorter than the copy
            would strictly need, because the copy is bottom-aligned and its
            tallest block runs to about 55svh — anything larger and the
            paragraph climbs into his legs. */}
        <div className="absolute inset-x-0 top-[3svh] h-[45svh] lg:inset-0 lg:h-full">
          <KnowMind3D
            trackRef={track}
            align="right"
            onChapterChange={setActive}
            fade={[0.93, 1]}
            fadeRef={rail}
            className="h-full w-full"
          />
        </div>

        {/* The three states, named. */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          <div className="container-page flex h-full items-center">
            <ol ref={rail} className="flex flex-col gap-11">
              {states.map((state, i) => (
                <li key={state.key} className="flex items-center gap-4">
                  <span
                    aria-hidden
                    className="h-px bg-honey transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                      width: active === i ? "2.25rem" : "0.75rem",
                      opacity: active === i ? 1 : 0.4,
                    }}
                  />
                  <span
                    className="text-eyebrow font-semibold tracking-[0.18em] text-cream uppercase transition-opacity duration-700"
                    style={{ opacity: active === i ? 1 : 0.38 }}
                  >
                    {state.label}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* ---- Three screens of copy, pulled up over the pinned visual --- */}
      <div className="relative -mt-[100svh]">
        {states.map((state, i) => (
          <article
            key={state.key}
            aria-label={`State ${state.index}: ${state.label}`}
            /* pb clears the sticky registration bar.

               88svh rather than a full screen on a phone. Each block is
               bottom-anchored in its own window and fades once it rises out of
               the lower band, so at 100svh the last one had finished fading
               with a whole screen of section still to scroll — the blank
               stretch between this section and the problem section. Three
               windows a screen and a bit shorter close that without changing
               the choreography: the character's two transitions are fractions
               of the track, so shortening every window by the same amount
               leaves them where they were. */
            className="flex h-[88svh] items-end pb-[12svh] lg:h-[100svh] lg:items-center lg:pb-0"
          >
            <div className="container-page w-full">
              <div
                ref={(el) => {
                  copy.current[i] = el;
                }}
                className="max-w-xl transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] data-[inband=false]:opacity-0 lg:max-w-[30rem] lg:pl-[8.5rem]"
              >
                <Reveal>
                  <p className="flex items-baseline gap-3 text-eyebrow font-semibold tracking-[0.18em] uppercase">
                    <span className="text-honey">{state.index}</span>
                    <span className="text-cream-dim">{state.label}</span>
                  </p>
                </Reveal>

                <Reveal delay={0.07}>
                  <p className="mt-5 text-h3 font-semibold text-balance text-cream">
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
            read while the character holds its final arrangement, and it means
            the visual has faded out by the time the pin releases — so it never
            overlaps whatever the next section puts on screen.

            Nearly nothing on a phone. The fade is a fraction of the track,
            so it still finishes before the pin releases — the tail is slack,
            not structure, and a third of a screen of it is a much bigger share
            of a phone's patience than of a desktop's. */}
        <div aria-hidden className="h-[6svh] lg:h-[30svh]" />
      </div>
    </section>
  );
}
