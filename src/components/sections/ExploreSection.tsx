import { RefSectionIntro } from "@/components/ui/RefSectionIntro";
import { refExplore } from "@/lib/reference-content";

/**
 * Band 8 — what you explore.
 *
 * Four left-rail cards in a 2×2 on white, then the band's closing note on
 * #4B0082. Same 4px #4B0082 border as the pattern steps and the testimonials,
 * at the 12px radius this size of card takes.
 */
export function ExploreSection() {
  const { bottom } = refExplore;

  return (
    <section className="explore-section" aria-labelledby="explore-heading">
      <div className="explore-inner">
        <div className="explore-top">
          <RefSectionIntro
            tag={refExplore.tag}
            title={refExplore.title}
            headingId="explore-heading"
          />
        </div>

        <div className="explore-grid">
          {refExplore.cards.map((card) => (
            <div className="explore-card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>

        <div className="explore-bottom">
          <p>
            {bottom.first}
            <br />
            {bottom.secondBefore}
            <strong>{bottom.secondStrong}</strong>
            {bottom.secondAfter}
            <br />
            {bottom.third}
            <br />
            <strong>{bottom.last}</strong>
          </p>
        </div>
      </div>
    </section>
  );
}
