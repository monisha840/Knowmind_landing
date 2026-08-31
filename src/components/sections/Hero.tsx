"use client";

import { motion } from "motion/react";

import { LivingPortrait } from "@/components/hero/LivingPortrait";
import { CTAButton } from "@/components/ui/CTAButton";
import { TumblingMark } from "@/components/ui/TumblingMark";
import { inr, programDetails, siteConfig } from "@/lib/config";
import { tamil } from "@/lib/content";

const facts = [
  programDetails.dateLabelShort.toUpperCase(),
  programDetails.timeShort,
  "LIVE ZOOM",
  "TAMIL + ENGLISH",
  `${programDetails.seats} PARTICIPANTS`,
  inr(programDetails.price),
];

const promises = [
  "Understand your patterns.",
  "Rebuild self-trust.",
  "Take small daily actions.",
  "Become 1% Better Every Day.",
];

/** Entrance choreography — one shared rhythm for the whole hero. */
const rise = {
  hidden: { opacity: 0, y: 26 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.09, duration: 0.85, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Hero() {
  return (
    <section
      id="top"
      data-three-window
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden pt-[4.5rem] sm:pt-32"
    >
      {/*
        A veil over the 3D, under everything else.

        It quiets the orbital field and knocks the core glow back to ambient, so
        the reading order becomes headline, then portrait, then background —
        rather than the orb arriving first. It lives here rather than in the 3D
        scene on purpose: that scene is shared with six other sections — problem,
        method, journey, session flow, pricing and the final CTA all opt into the
        same canvas — so turning the core down there would dim all of them. A
        local layer keeps the change inside the hero.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1]"
        style={{
          background: [
            "radial-gradient(48% 58% at 66% 50%, rgba(12,4,16,0.74) 0%, rgba(12,4,16,0) 72%)",
            "linear-gradient(rgba(12,4,16,0.44), rgba(12,4,16,0.44))",
          ].join(", "),
        }}
      />


      {/*
        Depth wash behind the copy, so text stays legible over the 3D and the
        portrait's inner edge feathers away instead of ending on a line.

        This paints *after* the portrait — the veil above paints before it. The
        order is the whole point: the veil is there to quiet the orbital field,
        and if the portrait sat under it he would be dimmed by the same amount
        and go muddy. Between the two layers, he keeps his own contrast while
        everything behind him loses a third of its.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1]"
        style={{
          background:
            "radial-gradient(90% 70% at 8% 42%, rgba(12,4,16,0.92) 0%, rgba(12,4,16,0.66) 40%, rgba(12,4,16,0) 72%)",
        }}
      />

      {/*
        The brand, at the top of the page.

        Absolutely positioned rather than placed in the flow, so it lives inside
        the padding the hero already reserves above its copy and the flex column
        below is untouched at every width — the headline, the portrait and the
        fact strip all sit exactly where they did.

        The mark is the same tumbling logo the footer uses, at the header size
        it was drawn for. It carries no `label`: the wordmark beside it already
        names the brand, and announcing it twice in one lockup is worse than not
        announcing it at all. It is a lockup, not a link — there is no
        navigation on this page for it to lead back to.
      */}
      <header className="absolute inset-x-0 top-0 z-20 pt-4 sm:pt-7">
        <div className="container-page">
          <div className="group flex w-fit items-center gap-2.5 sm:gap-3">
            <TumblingMark className="h-6 w-12 sm:h-8 sm:w-16" />
            <span className="text-[0.62rem] font-semibold tracking-[0.18em] text-cream uppercase sm:text-[0.7rem] sm:tracking-[0.2em]">
              {siteConfig.name}
            </span>
          </div>
        </div>
      </header>

      <div className="container-page grid flex-1 items-center gap-12 pb-10 sm:pb-16 lg:grid-cols-12">
        {/* Copy occupies just over half the field; the growth object holds the rest. */}
        <div className="lg:col-span-6 xl:col-span-5">
          <motion.div custom={0} variants={rise} initial="hidden" animate="visible">
            <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-2 text-eyebrow font-semibold tracking-[0.18em] text-honey uppercase">
              <span className="rounded-full border border-honey/35 px-3 py-1.5">
                {siteConfig.batch}
              </span>
              <span className="text-cream-muted">{siteConfig.programSubtitle}</span>
            </span>
          </motion.div>

          <h1 className="mt-5 text-h1 font-semibold text-cream">
            {["1% Better.", "Every Day."].map((line, i) => (
              <span key={line} className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{
                    delay: 0.22 + i * 0.1,
                    duration: 1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {i === 0 ? (
                    <>
                      <span className="text-honey">1%</span> Better.
                    </>
                  ) : (
                    line
                  )}
                </motion.span>
              </span>
            ))}
          </h1>

          {/* The emotional hook, in the visitor's own language. */}
          <motion.p
            custom={3}
            variants={rise}
            initial="hidden"
            animate="visible"
            lang="ta"
            className="mt-5 max-w-md text-body text-cream/90"
          >
            {tamil.heroQuestion}
          </motion.p>

          <motion.p
            custom={4}
            variants={rise}
            initial="hidden"
            animate="visible"
            className="mt-3 max-w-sm text-sm text-cream-muted"
          >
            You know what you need to do. But why is it so difficult to keep doing it
            consistently?
          </motion.p>

          <motion.ul
            custom={5}
            variants={rise}
            initial="hidden"
            animate="visible"
            className="mt-5 flex max-w-md flex-wrap gap-x-5 gap-y-2 sm:mt-6"
          >
            {promises.map((line) => (
              <li key={line} className="flex items-center gap-2.5 text-sm text-cream/80">
                <span aria-hidden className="h-1 w-1 rounded-full bg-gold" />
                {line}
              </li>
            ))}
          </motion.ul>

          <motion.div
            custom={6}
            variants={rise}
            initial="hidden"
            animate="visible"
            className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4 sm:mt-9"
          >
            <CTAButton size="lg">Begin Your 1% Journey</CTAButton>
            <p className="text-sm text-cream-muted">
              Founding price{" "}
              <span className="font-semibold text-cream">{inr(programDetails.price)}</span>
              <span className="mx-2 text-cream/25">·</span>
              {programDetails.seats} seats only
            </p>
          </motion.div>
        </div>

        {/*
          Kaleeswaran, composed into the right of the field.

          Two compositions, not one scaled twice.

          From lg he is lifted out of the grid and positioned by his *face*,
          not by an edge. His width is held in `--pw` so `left` can be solved
          from it: his face sits 54% across the frame (measured), so
          `calc(72% - 0.54 * --pw)` puts that face on 72% of the viewport
          whatever the window does.

          This matters because his width is governed by height on short
          windows and by vw on wide ones. Anchoring either edge to a fixed
          percentage let the face drift between 65% and 79% across ordinary
          desktop shapes, and left the right-hand gap swinging by 200px.
          Solving for the face pins the thing the composition is actually
          about, and the right-hand margin then falls out at 7–13% on its own.

          He has to leave the content container to reach this scale: the
          right-hand columns are only ~490px wide at 1440.

          The width clamp does two jobs. `42vw` gives him the presence the
          composition needs; the `calc` caps it so his height — which the
          aspect ratio derives from the width — can never exceed the band he
          sits in. `9rem` is the two 4.5rem insets and `0.8` is 1122/1402, so
          the cap is literally 'as wide as he can be and still fit'. Without
          it a short, wide window (1280x800) pushes his hair off the top.

          Below lg the copy runs the full width, so rather than sitting behind
          the headline he takes his own row underneath it, after the CTA.

          The box carries the picture's own aspect ratio, so `contain` fits it
          exactly — no crop, no stretch, no dead space — and his face and the
          GROWTH lettering both survive at every width.
        */}
        <LivingPortrait className="mx-auto w-[82%] max-w-[18rem] sm:w-[58%] sm:max-w-[21rem] lg:absolute lg:top-[3rem] lg:mx-0 lg:max-w-none lg:[--pw:min(40vw,calc((100svh-3rem)*0.7737))] lg:w-[var(--pw)] lg:left-[calc(74%-0.54*var(--pw))] xl:[--pw:min(46vw,calc((100svh-3rem)*0.7737))] xl:left-[calc(72%-0.54*var(--pw))]" />
      </div>

      {/* Full-bleed fact strip — the architectural base of the hero. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.9 }}
        className="relative border-t border-cream/10 bg-night/40 backdrop-blur-sm"
      >
        <ul className="container-page flex flex-wrap items-center gap-x-6 gap-y-3 py-5 text-eyebrow font-semibold tracking-[0.16em] text-cream/70 uppercase sm:gap-x-9">
          {facts.map((fact, i) => (
            <li key={fact} className="flex items-center gap-6 sm:gap-9">
              {i > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-honey/70" />}
              <span className={i === facts.length - 1 ? "text-honey" : undefined}>{fact}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}
