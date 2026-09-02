import { Footer } from "@/components/Footer";
import { CountdownBar } from "@/components/CountdownBar";
import { StickyBar } from "@/components/StickyBar";

import { AudienceSection } from "@/components/sections/AudienceSection";
import { BeginJourneySection } from "@/components/sections/BeginJourneySection";
import { BonusSection } from "@/components/sections/BonusSection";
import { ExploreSection } from "@/components/sections/ExploreSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Hero } from "@/components/sections/Hero";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { JourneyTimeline } from "@/components/sections/JourneyTimeline";
import { MediaSection } from "@/components/sections/MediaSection";
import { MeetKaleeswaranSection } from "@/components/sections/MeetKaleeswaranSection";
import { PatternSection } from "@/components/sections/PatternSection";
import { PhilosophySection } from "@/components/sections/PhilosophySection";
import { PricingSection } from "@/components/sections/PricingSection";
import { Testimonials } from "@/components/sections/Testimonials";
import { VSLSection } from "@/components/sections/VSLSection";

/**
 * The programme page — the reference design, in the reference's own order.
 *
 * Eighteen bands, numbered here as the Master Reproduction Specification
 * numbers them, with one insertion that is not the reference's:
 *
 *    1  sticky bar          10  organisations marquee
 *    2  hero                11  media marquee
 *    3  VSL                 12  testimonials
 *    4  is this your        13  who joins / who it is not for
 *       pattern?            14  bonuses
 *    5  the 1% philosophy   15  price + live-only + promise
 *    6  the fourteen days   16  FAQ
 *    7  how it works        17  the close
 *    8  what you explore     —  the registration questions
 *    9  meet Kaleeswaran    18  footer
 *
 * ── The insertion ─────────────────────────────────────────────────────────
 *
 * `BeginJourneySection` has no counterpart in the reference, which sends its
 * buttons straight to a hosted `rzp.io` link. This application does not: the
 * six answers *are* the registration record, and the order cannot be created
 * without them (CLAUDE.md §8). So the questions sit between the close and the
 * footer — after the last argument, and forward of every button that points at
 * them, so no call to action ever scrolls somebody backwards.
 *
 * ── What is deliberately absent ───────────────────────────────────────────
 *
 * `Navbar` — the reference has no navigation at any width. `StickyBar` is the
 * page's only chrome and it replaces both the navbar and the old bottom-pinned
 * `StickyCTA`, so there is now one pinned element instead of two.
 *
 * `BackgroundMount` — the reference has no 3D. The persistent WebGL background
 * is not mounted here, which also means three.js leaves this route's bundle
 * entirely. Nothing under `components/three/` was deleted; it is simply not
 * composed in (CLAUDE.md §19).
 *
 * `ProblemSection`, `CoreMethod`, `OfferSection`, `LiveOnlySection`,
 * `GuaranteeSection` — the first three have no band in the reference, and the
 * last two are blocks *inside* band 15 rather than sections of their own (see
 * `PricingSection`). All five files remain on disk, uncomposed.
 */
export default function Page() {
  /* `ref-page` is the scope every rule in `reference.css` is written under. It
     belongs on a wrapper rather than on `<body>` because the stylesheet governs
     this route only — the registration questions further down the page, the
     404 and anything built at `/` later all keep the brand design system. */
  return (
    <div className="ref-page">
      {/* ---- 1 ---- */}
      <StickyBar />

      <main id="main">
        {/* ---- 2 · 3 ---- */}
        <Hero />
        <VSLSection />

        {/* ---- 4 · 5 ---- */}
        <PatternSection />
        <PhilosophySection />

        {/* ---- 6 · 7 · 8 ---- */}
        <JourneyTimeline />
        <HowItWorksSection />
        <ExploreSection />

        {/* ---- 9 · 10 · 11 ---- */}
        <MeetKaleeswaranSection />
        <MediaSection />

        {/* ---- 12 · 13 · 14 ---- */}
        <Testimonials />
        <AudienceSection />
        <BonusSection />

        {/* ---- 15 · 16 · 17 ---- */}
        <PricingSection />
        <FAQSection />
        <FinalCTA />

        {/* ---- the questions, and the only route to a Razorpay order ---- */}
        <BeginJourneySection />
      </main>

      {/* ---- 18 ---- */}
      <Footer />

      {/* Pinned to the foot of the screen, and last in the document so its
          sticky positioning reserves its own height instead of hanging over
          the footer. See CountdownBar. */}
      <CountdownBar />
    </div>
  );
}
