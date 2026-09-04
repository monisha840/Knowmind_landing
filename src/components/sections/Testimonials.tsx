import { TestimonialFeature } from "@/components/ui/TestimonialFeature";
import { TestimonialQuoteFeature } from "@/components/ui/TestimonialQuoteFeature";
import { refTestimonials } from "@/lib/reference-content";

/**
 * Band 12 — what participants say.
 *
 * One featured recording, then the six written quotes as one featured quote at
 * a time. All six quotes are five-star and from the founding batch.
 *
 * The quotes used to be the reference's three-up grid of cards, which on a
 * phone stacked six of them directly under the recordings. They are
 * "Voices of the Journey" now — see `TestimonialQuoteFeature` for why, and for
 * how it avoids becoming a second copy of the video half above it.
 *
 * The six recordings used to sit here as a grid and then as a running row.
 * They are now one featured player with the other five reachable by name —
 * see `TestimonialFeature` for why, and for what happens to the five that are
 * not on screen.
 *
 * ── On the six recordings ─────────────────────────────────────────────────
 *
 * The reference labels these rather than filling them, and this file used to
 * reproduce that placeholder because no participant recordings existed here.
 * They do now: three of the six in the owner's Drive asset library, encoded by
 * `scripts/optimize-video.mjs`. So the frames carry real footage of real
 * participants, which is the thing the placeholder was holding the space for.
 *
 * A slot with no recording behind it still renders the reference's dashed
 * placeholder — the gap is closed by having the files, not by assuming they
 * are there (CLAUDE.md §9.2).
 *
 * `VideoPlayer` rather than a `<video>` of our own: it is already the
 * poster-first, `preload="none"`, no-`src`-until-play, controls-on-play
 * primitive this needs, and building a second one would be the duplicate
 * §4.3 forbids. It is the only client code in this section — the band stays a
 * server component and three players hydrate inside it.
 *
 * Each recording burns the speaker's name and role into its own first six
 * seconds. The `figcaption` repeats them because that lower third is gone by
 * the seventh second and was never available to a screen reader at all
 * (CLAUDE.md §13.3).
 */
export function Testimonials() {
  return (
    <section className="test-section" id="testimonials" aria-labelledby="test-heading">
      <div className="test-inner">
        <div className="tf-head">
          <span className="s-tag">{refTestimonials.tag}</span>
          <h2 className="tf-headline" id="test-heading">
            {refTestimonials.feature.headline[0]}
            <br />
            <span>{refTestimonials.feature.headline[1]}</span>
          </h2>
          <p className="tf-lead">{refTestimonials.feature.lead}</p>
        </div>

        {/* One participant at a time — see `TestimonialFeature`. One of this
            band's two client components; the heading above and the closer below
            stay on the server. */}
        <TestimonialFeature videos={refTestimonials.videos} />

        {/* The six written quotes, one at a time — see
            `TestimonialQuoteFeature`. The second client component in this band,
            and deliberately nothing like the first: the recordings are a face
            on white, this is a voice set in type on deep purple. */}
        <TestimonialQuoteFeature
          quotes={refTestimonials.quotes}
          eyebrow={refTestimonials.quotesHeading.eyebrow}
          lead={refTestimonials.quotesHeading.lead}
        />

        <div className="test-cta">
          <p>
            <span className="test-tanglish">{refTestimonials.closer.tanglish}</span>
            <br />
            {refTestimonials.closer.english}
          </p>
        </div>
      </div>
    </section>
  );
}
