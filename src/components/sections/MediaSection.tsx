import { Marquee } from "@/components/ui/Marquee";
import { Reveal } from "@/components/ui/Reveal";
import { clientLogos, mediaOutlets } from "@/lib/content";

/**
 * Media and client credibility.
 *
 * Rendered as typographic wordmarks rather than logo files: no real logo
 * assets were supplied, and fabricating them would misrepresent the brands.
 * Drop real SVGs into /public/logos and swap the `renderItem` when they exist.
 */
export function MediaSection() {
  return (
    <section
      id="media"
      aria-labelledby="media-heading"
      className="relative overflow-hidden bg-paper py-20 text-ink sm:py-24"
    >
      <div className="container-page">
        <Reveal>
          <h2
            id="media-heading"
            className="text-center text-eyebrow font-semibold tracking-[0.18em] text-ink-muted uppercase"
          >
            Featured in Tamil Nadu&rsquo;s leading media
          </h2>
        </Reveal>
      </div>

      <div className="mt-10">
        <Marquee items={mediaOutlets} tone="light" duration={55} />
      </div>

      <div className="container-page mt-20">
        <Reveal>
          <h2 className="text-center text-eyebrow font-semibold tracking-[0.18em] text-ink-muted uppercase">
            Organisations Kalee has trained
          </h2>
        </Reveal>
      </div>

      <div className="mt-10">
        <Marquee items={clientLogos} tone="light" duration={90} reverse />
      </div>
    </section>
  );
}
