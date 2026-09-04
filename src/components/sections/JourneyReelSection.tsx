import { PhotoReel } from "@/components/ui/PhotoReel";
import { RefSectionIntro } from "@/components/ui/RefSectionIntro";
import { refJourneyReel } from "@/lib/reference-content";

/**
 * Band 15.5 — a glimpse into the journey.
 *
 * Two rows of photographs drifting in opposite directions, between the price
 * and the questions. Not the reference's: this band was asked for, and it is
 * the second insertion on the page after the registration dialog (see
 * `1percentagebetter/page.tsx`).
 *
 * ── Where it sits, and why it is here rather than after the testimonials ──
 *
 * The request placed it "immediately above the existing FAQ section", and said
 * so twice. Read literally that is here — after `PricingSection`, whose second
 * block is the promise band. The accompanying running order wrote it as
 * "Testimonials → reel → FAQ", which is the same relative order with the three
 * bands that sit between them left out; both readings put the reel directly
 * above the questions, so this is the one place that satisfies each of them.
 *
 * ── The ground ───────────────────────────────────────────────────────────
 *
 * #1a0030, the page's darkest purple, and the only other band wearing it is
 * the VSL. It is deliberate on both counts. The band above this one is the
 * promise at #25133c and the band below is the FAQ at #fff, so the reel
 * deepens the purple once and then hands over to white — photographs read
 * warmer against the darker ground, and the strip gets a frame instead of
 * dissolving into the band above it.
 *
 * A server component. The section is furniture; only the rows are client-side,
 * which is the client boundary pushed as deep as it goes (CLAUDE.md §4.1).
 */
export function JourneyReelSection() {
  return (
    <section
      className="reel-section"
      id="journey-reel"
      aria-labelledby="journey-reel-heading"
    >
      <div className="reel-top">
        <RefSectionIntro
          title={refJourneyReel.title}
          lead={refJourneyReel.lead}
          centred
          headingId="journey-reel-heading"
        />
      </div>

      {/*
        The two speeds are not the same, and not by much: 21 and 18 px/s. Rows
        travelling at one rate in opposite directions read as a single object
        shearing in half, which is the mechanical look the band is trying not
        to have. Three pixels a second is enough to break that up and far too
        little to notice as a difference — the restrained "small movement
        variation" the brief allows for, rather than an effect.
      */}
      <div className="reel-rows">
        {refJourneyReel.rows.map((row) => (
          <PhotoReel
            key={row.direction}
            photos={row.photos}
            label={row.label}
            direction={row.direction}
            speed={row.direction === "left" ? 21 : 18}
          />
        ))}
      </div>
    </section>
  );
}
