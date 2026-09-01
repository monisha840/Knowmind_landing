import { LogoMarquee } from "@/components/ui/LogoMarquee";
import { refCorpMarquee, refMediaMarquee } from "@/lib/reference-content";

/**
 * Bands 10 and 11 — the two logo strips.
 *
 * The same component twice, inverted: eighteen organisations on white, then
 * nine media names on #2D0060. They are the only two bands on the page that do
 * not reflow at any width — 146px and 145px at 1440 and at 390 alike — because
 * a marquee has no layout to lose.
 *
 * Both are full-bleed with a 40px inner pad and a 60px gradient mask at each
 * edge, painted in the band's own ground so the pills dissolve rather than
 * getting cut.
 */
export function MediaSection() {
  return (
    <>
      <section className="corp-section" aria-label={refCorpMarquee.label}>
        <LogoMarquee items={refCorpMarquee.items} label={refCorpMarquee.label} />
      </section>

      <section className="media-feat-section" aria-label={refMediaMarquee.label}>
        <LogoMarquee items={refMediaMarquee.items} label={refMediaMarquee.label} />
      </section>
    </>
  );
}
