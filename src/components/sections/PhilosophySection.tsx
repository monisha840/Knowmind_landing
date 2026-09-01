import { RefSectionIntro } from "@/components/ui/RefSectionIntro";
import { refPhilosophy } from "@/lib/reference-content";

/**
 * Band 5 — the 1% philosophy.
 *
 * Four cards on white, chained rather than merely arranged: each one carries a
 * ↓ below it via `.phil-card::after`, suppressed on the last, so the row reads
 * as a sequence — awareness opens choice, choice repeated becomes pattern,
 * pattern becomes growth. Losing that arrow turns an argument back into a grid.
 *
 * The band closes on #EDE7F6 rather than on the page's usual #4B0082 note: this
 * is the one closing box that stays light, because the band it closes is white
 * and the next one is lavender.
 */
export function PhilosophySection() {
  const { bottom } = refPhilosophy;

  return (
    <section className="phil-section" aria-labelledby="phil-heading">
      <div className="phil-inner">
        <div className="phil-top">
          <RefSectionIntro
            tag={refPhilosophy.tag}
            title={refPhilosophy.title}
            lead={refPhilosophy.lead}
            centred
            headingId="phil-heading"
          />
        </div>

        <div className="phil-grid">
          {refPhilosophy.cards.map((card) => (
            <div className="phil-card" key={card.title}>
              <div className="phil-icon" aria-hidden>
                {card.icon}
              </div>
              <h3 className="phil-title">{card.title}</h3>
              <p className="phil-desc">{card.body}</p>
            </div>
          ))}
        </div>

        <div className="phil-bottom">
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
