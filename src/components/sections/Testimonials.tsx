import { RefSectionIntro } from "@/components/ui/RefSectionIntro";
import { refTestimonials } from "@/lib/reference-content";

/**
 * Band 12 — what participants say.
 *
 * Three video slots over six quote cards on white, all six five-star, all six
 * from the founding batch. The cards are the left-rail shape again, at the
 * `0 12px 12px 0` radius.
 *
 * ── On the three video slots ──────────────────────────────────────────────
 *
 * They are labelled, not filled. No participant recordings exist in this
 * repository, and specification §05 records that gap rather than closing it —
 * putting anything else in these frames would be fabricated social proof
 * (CLAUDE.md §1.1). The reference's own dashed placeholder is what is
 * reproduced.
 */
export function Testimonials() {
  return (
    <section className="test-section" id="testimonials" aria-labelledby="test-heading">
      <div className="test-inner">
        <div className="test-top">
          <RefSectionIntro
            tag={refTestimonials.tag}
            title={refTestimonials.title}
            headingId="test-heading"
          />
        </div>

        <div className="videos-grid">
          {refTestimonials.videoSlots.map((slot) => (
            <div className="video-ph" key={slot}>
              <span className="vplay" aria-hidden>
                ▶️
              </span>
              <p>
                {slot}
                <br />
                {refTestimonials.videoPlaceholder}
              </p>
            </div>
          ))}
        </div>

        <div className="test-grid">
          {refTestimonials.quotes.map((t) => (
            <figure className="test-card" key={t.name}>
              <div className="test-stars" aria-label="Rated 5 out of 5">
                <span aria-hidden>★★★★★</span>
              </div>
              <blockquote className="test-q">{t.quote}</blockquote>
              <figcaption>
                <p className="test-name">{t.name}</p>
                <p className="test-role">{refTestimonials.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="test-cta">
          <p>
            <span lang="ta">{refTestimonials.closer.tamil}</span>
            <br />
            {refTestimonials.closer.english}
          </p>
        </div>
      </div>
    </section>
  );
}
