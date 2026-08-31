import { StickyCTA } from "@/components/StickyCTA";
import { BackgroundMount } from "@/components/three/BackgroundMount";

import { AudienceSection } from "@/components/sections/AudienceSection";
import { BeginJourneySection } from "@/components/sections/BeginJourneySection";
import { BonusSection } from "@/components/sections/BonusSection";
import { CoreMethod } from "@/components/sections/CoreMethod";
import { EarlyMorningSection } from "@/components/sections/EarlyMorningSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { GuaranteeSection } from "@/components/sections/GuaranteeSection";
import { Hero } from "@/components/sections/Hero";
import { JourneyTimeline } from "@/components/sections/JourneyTimeline";
import { LiveOnlySection } from "@/components/sections/LiveOnlySection";
import { MediaSection } from "@/components/sections/MediaSection";
import { MeetKaleeswaranSection } from "@/components/sections/MeetKaleeswaranSection";
import { MindEvolution } from "@/components/sections/MindEvolution";
import { OfferSection } from "@/components/sections/OfferSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { SessionFlow } from "@/components/sections/SessionFlow";
import { Testimonials } from "@/components/sections/Testimonials";
import { TransformationSection } from "@/components/sections/TransformationSection";

/**
 * One continuous story, told in three tonal movements:
 *
 *   NIGHT     hero → problem → method → journey        (the growth object is visible)
 *   DAYBREAK  before/after wipe → the light half of the page
 *   DECISION  session flow → offer → guarantee → begin (the object returns, centred)
 *
 * The page literally moves from night to first light, because 5:30 AM is the
 * promise the programme is built on.
 */
export default function Page() {
  return (
    <>
      <BackgroundMount />

      {/* No navbar and no footer: this is a single-page landing page with one
          action, and the bar pinned to the bottom is the only chrome it needs.
          The padding reserves that bar's room at every size — it is no longer
          phone-only — so it can never cover the end of the last section. */}
      <main id="main" className="relative z-10 pb-[5rem] sm:pb-[5.5rem]">
        {/* ---- Night ---- */}
        <Hero />
        <MeetKaleeswaranSection />
        <MindEvolution />
        <ProblemSection />
        <CoreMethod />
        <JourneyTimeline />

        {/* ---- Daybreak ---- */}
        <TransformationSection />
        <AudienceSection />
        <EarlyMorningSection />
        <MediaSection />
        <Testimonials />
        <OfferSection />
        <BonusSection />

        {/* ---- Decision ---- */}
        <SessionFlow />
        <PricingSection />
        <BeginJourneySection />
        <LiveOnlySection />
        <GuaranteeSection />
        <FAQSection />
        <FinalCTA />
      </main>

      <StickyCTA />
    </>
  );
}
