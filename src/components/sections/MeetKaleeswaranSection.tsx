"use client";

import { motion, type Variants } from "motion/react";
import Image from "next/image";

import { Reveal, RevealGroup, revealChild } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/SectionHeading";
import {
  authorityHighlights,
  credentials,
  kalee,
  meetKalee,
  meetKaleeMetrics,
  secondaryRoles,
  trainingPhotos,
  type MeetMetricKey,
} from "@/lib/content";
import { usePrefersReducedMotion } from "@/lib/hooks";

/* -------------------------------------------------------------------------- */
/*  Metric marks                                                              */
/*  Same construction as `MethodIcons`: stroke-only, one 24-unit grid, drawn   */
/*  for these five claims rather than pulled from an icon library.             */
/* -------------------------------------------------------------------------- */

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Years — time held, not counted down. */
function YearsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" opacity="0.35" />
      <path d="M12 6.8V12l3.6 2.1" />
    </svg>
  );
}

/** Sessions — two people, one conversation. */
function SessionsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 5.6h11.2a1.6 1.6 0 0 1 1.6 1.6v5.2a1.6 1.6 0 0 1-1.6 1.6H8.6L4.8 17V7.2A1.6 1.6 0 0 1 6.4 5.6Z" />
      <path d="M19.2 9.4a1.6 1.6 0 0 1 .8 1.4v7.4l-2.6-2.2" opacity="0.45" />
    </svg>
  );
}

/** Professionals — one person, and the room that grew around them. */
function PeopleIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="9.2" cy="9" r="2.9" />
      <path d="M3.8 19.4a5.4 5.4 0 0 1 10.8 0" />
      <circle cx="17" cy="10.4" r="2.1" opacity="0.45" />
      <path d="M15.4 19.4a4.4 4.4 0 0 1 4.8-4.3" opacity="0.45" />
    </svg>
  );
}

/** Organisations — the rooms he was invited into. */
function OrganisationsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M3.5 20h17" opacity="0.45" />
      <path d="M6.6 20V10.2L12 7l5.4 3.2V20" />
      <path d="M10.1 20v-4.3h3.8V20" />
    </svg>
  );
}

/** Rating — what the people in those rooms said afterwards. */
function RatingIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="m12 4.6 2.32 4.7 5.18.76-3.75 3.65.886 5.16L12 16.44l-4.64 2.43.886-5.16L4.5 10.06l5.18-.76L12 4.6Z" />
    </svg>
  );
}

const metricIcons: Record<MeetMetricKey, (props: IconProps) => React.ReactElement> = {
  experience: YearsIcon,
  sessions: SessionsIcon,
  professionals: PeopleIcon,
  organisations: OrganisationsIcon,
  rating: RatingIcon,
};

/* -------------------------------------------------------------------------- */

/**
 * Belt and braces for reduced motion.
 *
 * usePrefersReducedMotion is SSR-safe, so it reports false for the first client
 * render and only settles afterwards — by which time these elements have already
 * mounted holding their offset. This class overrides the inline transform
 * outright, so nothing ever travels for a visitor who asked it not to.
 */
const STILL = "motion-reduce:transform-none!";

/** Motion is opacity-only when the visitor has asked for less of it. */
const stillChild: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

/** One quiet label for each block below the opening spread. */
function BlockLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-eyebrow font-semibold tracking-[0.18em] text-cream-dim uppercase">
      {children}
    </h3>
  );
}

/**
 * The one authority section: person → question → proof → credentials.
 *
 * It opens as an editorial spread — photograph left, his question right — and
 * only then widens into the evidence. The order is deliberate: the visitor
 * should meet a person before they are handed a CV, so the numbers, the client
 * work, the photographs and the twelve credentials each arrive after the
 * question that explains why any of it matters.
 *
 * Consolidated from the former `MeetKaleeswaranSection` + `AuthoritySection`.
 * Every claim appears exactly once; see `content.ts` for the data.
 */
export function MeetKaleeswaranSection() {
  // The shared `Reveal` primitive does not read the media query itself, so the
  // travel distance and the stagger are dropped here instead.
  const reduced = usePrefersReducedMotion();
  const enter = (delay = 0) => ({ y: reduced ? 0 : 24, delay: reduced ? 0 : delay });
  const stagger = reduced ? 0 : 0.07;

  return (
    <section
      id="meet-kaleeswaran"
      aria-labelledby="meet-kaleeswaran-heading"
      className="grain section-y relative overflow-hidden"
    >
      {/* Deep purple into wine — the night half of the page continues here. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1]"
        style={{
          background:
            "linear-gradient(178deg, #0c0410 0%, #1d0a18 20%, #2a0f22 58%, #150a20 100%)",
        }}
      />
      {/* A single honey warmth, high and off-centre. Accent only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1]"
        style={{
          background:
            "radial-gradient(58% 42% at 76% 6%, rgba(254,183,55,0.12) 0%, transparent 72%)",
        }}
      />
      <div aria-hidden className="rule-gold absolute inset-x-0 top-0" />

      <div className="container-page">
        {/* ================= Opening spread ================= */}
        {/* 45 / 55 — the photograph holds its own without crowding the question. */}
        <div className="grid gap-14 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] lg:items-center lg:gap-16 xl:gap-20">
          {/* ---------------- Portrait ---------------- */}
          <Reveal amount={0.15} className={STILL} {...enter()}>
            <figure className="relative mx-auto w-full max-w-md lg:max-w-none">
              {/* Offset hairline. Framing, not decoration — no glow, no 3D. */}
              <span
                aria-hidden
                className="absolute -bottom-3 -left-3 hidden h-full w-full rounded-card border border-gold/30 sm:-bottom-4 sm:-left-4 sm:block"
              />

              {/* 4:5 box: the source is wider than tall, so the crop only ever
                  takes width. Nothing above his head or below his chin is lost
                  at any breakpoint. */}
              <div className="group relative aspect-[4/5] overflow-hidden rounded-card shadow-[0_40px_90px_-55px_rgba(0,0,0,0.95)] ring-1 ring-cream/12">
                <Image
                  src="/kaleeswaran_image.png"
                  alt="Kaleeswaran, Counselling Psychologist and the person behind KnowMind Universe"
                  fill
                  // Off-centre because he stands right of the frame's middle.
                  className="object-cover object-[44%_30%] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                  sizes="(min-width: 1024px) 40vw, (min-width: 640px) 28rem, 92vw"
                />
                {/* Wine at the foot of the frame settles the photograph into
                    the palette without touching his face. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-wine-950/70 via-wine-950/10 to-transparent"
                />
              </div>
            </figure>
          </Reveal>

          {/* ---------------- The question ---------------- */}
          <div>
            <Reveal className={STILL} {...enter()}>
              <Eyebrow>{meetKalee.eyebrow}</Eyebrow>
            </Reveal>

            <Reveal className={STILL} {...enter(0.06)}>
              <h2
                id="meet-kaleeswaran-heading"
                className="mt-5 max-w-2xl text-h3 font-semibold text-cream"
              >
                {meetKalee.heading}
              </h2>
            </Reveal>

            <Reveal className={STILL} {...enter(0.12)}>
              <blockquote className="mt-9">
                <span
                  aria-hidden
                  className="block font-serif text-[4rem] leading-[0.55] text-honey/30 select-none sm:text-[5rem]"
                >
                  &ldquo;
                </span>

                <p className="mt-5 font-serif text-h2 leading-[1.14] text-cream italic">
                  {kalee.quote}
                </p>

                <p className="mt-6 text-lead text-cream-muted not-italic">
                  {kalee.quoteFollowUp}
                </p>

                <footer className="mt-9 flex items-center gap-4">
                  <span aria-hidden className="h-px w-10 shrink-0 bg-honey/70" />
                  <div>
                    <p className="text-h3 font-semibold text-cream not-italic">
                      {meetKalee.name}
                    </p>
                    <p className="mt-1.5 text-eyebrow font-semibold tracking-[0.18em] text-gold uppercase not-italic">
                      {meetKalee.role}
                    </p>
                  </div>
                </footer>
              </blockquote>
            </Reveal>

            <Reveal className={STILL} {...enter(0.16)}>
              <p className="mt-9 max-w-xl text-body text-cream-muted">{meetKalee.intro}</p>
            </Reveal>
          </div>
        </div>

        {/* ================= The numbers ================= */}
        {/* Full width, so five sit comfortably instead of crowding a column. */}
        <RevealGroup
          as="ul"
          className="mt-20 grid gap-x-8 gap-y-10 border-t border-cream/10 pt-12 sm:grid-cols-3 lg:mt-24 lg:grid-cols-5"
          stagger={stagger}
        >
          {meetKaleeMetrics.map((metric) => {
            const Icon = metricIcons[metric.key];
            return (
              <motion.li
                key={metric.key}
                variants={reduced ? stillChild : revealChild}
                className={`flex flex-col gap-3 ${STILL}`}
              >
                <Icon className="h-6 w-6 text-gold" />
                <div>
                  <p className="text-h3 font-semibold tabular-nums text-honey">
                    {metric.value}
                    {metric.suffix && <span className="opacity-80">{metric.suffix}</span>}
                  </p>
                  <p className="mt-1 max-w-[20ch] text-sm leading-snug text-cream-muted">
                    {metric.label}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </RevealGroup>

        {/* ================= Roles + client work ================= */}
        <div className="mt-20 grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* The five roles other than the headline one above. */}
          <div className="lg:col-span-4">
            <Reveal className={STILL} {...enter()}>
              <BlockLabel>{meetKalee.rolesHeading}</BlockLabel>
            </Reveal>

            <RevealGroup as="ul" className="mt-6 flex flex-wrap gap-2.5" stagger={stagger / 2}>
              {secondaryRoles.map((role) => (
                <motion.li
                  key={role}
                  variants={reduced ? stillChild : revealChild}
                  className={`rounded-full border border-cream/15 px-3.5 py-1.5 text-sm text-cream-muted ${STILL}`}
                >
                  {role}
                </motion.li>
              ))}
            </RevealGroup>
          </div>

          {/* Where the fifteen years were actually spent. */}
          <div className="lg:col-span-8">
            <Reveal className={STILL} {...enter()}>
              <BlockLabel>{meetKalee.experienceHeading}</BlockLabel>
            </Reveal>

            <RevealGroup as="ul" className="mt-6 border-t border-cream/10" stagger={stagger}>
              {authorityHighlights.map((item) => (
                <motion.li
                  key={item.title}
                  variants={reduced ? stillChild : revealChild}
                  className={`grid gap-1 border-b border-cream/10 py-5 sm:grid-cols-12 sm:gap-6 ${STILL}`}
                >
                  <h4 className="text-h3 font-medium text-cream sm:col-span-5">{item.title}</h4>
                  <p className="text-body text-cream-muted sm:col-span-7">{item.description}</p>
                </motion.li>
              ))}
            </RevealGroup>
          </div>
        </div>

        {/* ================= Photographs ================= */}
        <div className="mt-20">
          <Reveal className={STILL} {...enter()}>
            <BlockLabel>{meetKalee.photosHeading}</BlockLabel>
          </Reveal>

          <RevealGroup className="mt-6 grid gap-4 sm:grid-cols-3" stagger={stagger}>
            {trainingPhotos.map((photo) => (
              <motion.figure
                key={photo.src}
                variants={reduced ? stillChild : revealChild}
                className={`group relative overflow-hidden rounded-card ring-1 ring-cream/10 ${STILL}`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={1600}
                  height={1200}
                  loading="lazy"
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-wine-950/90 to-transparent p-5 text-sm font-medium text-cream">
                  {photo.caption}
                </figcaption>
              </motion.figure>
            ))}
          </RevealGroup>
        </div>

        {/* ================= Credentials ================= */}
        {/* Chips, not twelve cards — and a plain list underneath the styling,
            so a screen reader gets the same twelve items in the same order. */}
        <div className="mt-16">
          <Reveal className={STILL} {...enter()}>
            <BlockLabel>{meetKalee.credentialsHeading}</BlockLabel>
          </Reveal>

          <RevealGroup as="ul" className="mt-6 flex flex-wrap gap-2.5" stagger={stagger / 2}>
            {credentials.map((credential) => (
              <motion.li
                key={credential}
                variants={reduced ? stillChild : revealChild}
                className={`rounded-full border border-cream/12 bg-cream/[0.03] px-4 py-2 text-sm text-cream-muted transition-colors duration-300 hover:border-gold/40 hover:text-cream ${STILL}`}
              >
                {credential}
              </motion.li>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
