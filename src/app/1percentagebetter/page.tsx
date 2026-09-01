import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { StickyCTA } from "@/components/StickyCTA";
import { BackgroundMount } from "@/components/three/BackgroundMount";

import { AudienceSection } from "@/components/sections/AudienceSection";
import { BeginJourneySection } from "@/components/sections/BeginJourneySection";
import { BonusSection } from "@/components/sections/BonusSection";
import { CoreMethod } from "@/components/sections/CoreMethod";
import { ExploreSection } from "@/components/sections/ExploreSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { GuaranteeSection } from "@/components/sections/GuaranteeSection";
import { Hero } from "@/components/sections/Hero";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { JourneyTimeline } from "@/components/sections/JourneyTimeline";
import { LiveOnlySection } from "@/components/sections/LiveOnlySection";
import { MediaSection } from "@/components/sections/MediaSection";
import { MeetKaleeswaranSection } from "@/components/sections/MeetKaleeswaranSection";
import { OfferSection } from "@/components/sections/OfferSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { Testimonials } from "@/components/sections/Testimonials";
import { VSLSection } from "@/components/sections/VSLSection";

/**
 * One page, one decision, told in the order the approved deck tells it.
 *
 *   RECOGNISE   hero → the video → their own loop → "you are not lazy"
 *   UNDERSTAND  what 1% better means → the fourteen days → what they explore
 *               → how it actually works
 *   QUALIFY     who this is for, and who it is not for
 *   TRUST       Kaleeswaran, then the evidence
 *   VALUE       what you get → the bonuses
 *   REASSURE    why it is live → the promise → the questions
 *   DECIDE      the closing statement → the price → the form
 *
 * Four sections were removed rather than reordered, because their content had
 * been superseded by the phased ones and keeping them would have said the same
 * thing twice in a page that is already long:
 *
 *   MindEvolution        three screens of scroll-driven 3D on "tangled →
 *                        unravelling → clear" — the abstraction the redesign
 *                        exists to remove, and it carried the retired
 *                        five-stage method copy
 *   TransformationSection  a before/after wipe already covered by the problem
 *                        section's loop and the audience section's outcomes
 *   EarlyMorningSection  a standalone "Why 5:30 AM?" — the time is stated in
 *                        the hero, the offer, how-it-works and the FAQ
 *   SessionFlow          Arrive/Learn/Reflect/Participate/Act, a second
 *                        five-step diagram beside "How does the journey work?"
 *
 * Registration now sits last. It used to run before why-live, the promise and
 * the FAQ, which meant the closing call to action scrolled the visitor
 * backwards to reach the form.
 */
export default function Page() {
  return (
    <>
      <BackgroundMount />
      <Navbar />

      {/* The padding reserves the pinned registration bar's room at every size,
          so it can never cover the end of the last section. */}
      <main id="main" className="relative z-10 pb-[5rem] sm:pb-[5.5rem]">
        {/* ---- Recognise ---- */}
        <Hero />
        <VSLSection />
        <ProblemSection />

        {/* ---- Understand ---- */}
        <CoreMethod />
        <JourneyTimeline />
        <ExploreSection />
        <HowItWorksSection />

        {/* ---- Qualify ---- */}
        <AudienceSection />

        {/* ---- Trust ---- */}
        <MeetKaleeswaranSection />
        <MediaSection />
        <Testimonials />

        {/* ---- Value ---- */}
        <OfferSection />
        <BonusSection />

        {/* ---- Reassure ---- */}
        <LiveOnlySection />
        <GuaranteeSection />
        <FAQSection />

        {/* ---- Decide ---- */}
        <FinalCTA />
        <PricingSection />
        <BeginJourneySection />
      </main>

      <Footer />
      <StickyCTA />
    </>
  );
}
