import { RefSectionIntro } from "@/components/ui/RefSectionIntro";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
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
        <div className="test-top">
          <RefSectionIntro
            tag={refTestimonials.tag}
            title={refTestimonials.title}
            headingId="test-heading"
          />
        </div>

        <div className="videos-grid">
          {refTestimonials.videoSlots.map((slot, i) => {
            const video = refTestimonials.videos[i];

            if (!video) {
              return (
                <div className="video-ph" key={slot}>
                  {/* Empty on purpose — the play mark is drawn in CSS. See
                      `.video-ph .vplay` in reference.css. */}
                  <span className="vplay" aria-hidden />
                  <p>
                    {slot}
                    <br />
                    {refTestimonials.videoPlaceholder}
                  </p>
                </div>
              );
            }

            return (
              <figure className="test-video" key={slot}>
                {/* The frame declares the footage's own 9:16 and `VideoPlayer`
                    fills it absolutely, so the row reserves its full height
                    before a byte of media arrives — nothing shifts when the
                    poster decodes, and nothing shifts when the video replaces
                    it (CLAUDE.md §9.2, §15). */}
                <div className="test-video-frame">
                  <VideoPlayer
                    src={video.src}
                    poster={video.poster}
                    label={`${video.name}, ${video.role}, on the 1% Better programme.`}
                  />
                </div>
                <figcaption className="test-video-cap">
                  <span className="test-video-name">{video.name}</span>
                  <span className="test-video-role">{video.role}</span>
                </figcaption>
              </figure>
            );
          })}
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
