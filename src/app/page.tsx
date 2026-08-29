import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { StickyMobileCTA } from "@/components/StickyMobileCTA";
import { BackgroundMount } from "@/components/three/BackgroundMount";

import { AudienceSection } from "@/components/sections/AudienceSection";
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
      <Navbar />

      {/* pb reserves room for the phone-only sticky registration bar. */}
      <main id="main" className="relative z-10 pb-[4.5rem] sm:pb-0">
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
        <LiveOnlySection />
        <GuaranteeSection />
        <FAQSection />
        <FinalCTA />
      </main>

      <Footer />
      <StickyMobileCTA />
    </>
  );
}
