import { RefSectionIntro } from "@/components/ui/RefSectionIntro";
import { inr, refBonusTotal, refBonusWorth, refBonuses } from "@/lib/reference-content";

/**
 * Band 14 — what comes free with registration.
 *
 * Three amber cards on white, each with a 4px amber cap and a `0 0 12px 12px`
 * radius so the top edge reads as a tab rather than a border, then the total on
 * #4B0082. It is the page's only band in the amber family — #FFF8E1 ground,
 * #633806 and #854F0B type — which is what marks the bonuses as an aside to the
 * offer rather than part of it.
 *
 * The total is `refBonusTotal`, a reduce over the same three values the cards
 * print, so the sum can never drift from its parts (CLAUDE.md §4.2). The price
 * band quotes the identical figure from the identical source.
 *
 * `.bonus-total` sets three lines, and for a while it rendered two: the
 * transcription recorded the label but neither the "— Included FREE" that
 * finishes the figure nor the `.after` line under it, so the rule for `.after`
 * sat in `reference.css` with nothing to style. Both strings are in
 * specification §02 — they were not missing from the reference, only from the
 * transcription — and restoring them accounts for the band's whole 23px
 * shortfall against the measured reference at 1440.
 */
export function BonusSection() {
  return (
    <section className="bonus-section" id="bonuses" aria-labelledby="bonus-heading">
      <div className="bonus-inner">
        <div className="bonus-top">
          <RefSectionIntro
            tag={refBonuses.tag}
            title={refBonuses.title}
            headingId="bonus-heading"
          />
        </div>

        <div className="bonus-grid">
          {refBonuses.cards.map((card) => (
            <div className="bonus-card" key={card.name}>
              <h3 className="bc-name">{card.name}</h3>
              <p className="bc-desc">{card.body}</p>
              <p className="bc-val">{refBonusWorth(card.value)}</p>
            </div>
          ))}
        </div>

        <div className="bonus-total">
          <p>{refBonuses.totalLabel}</p>
          <p className="big">
            {inr(refBonusTotal)} {refBonuses.totalValueSuffix}
          </p>
          <p className="after">{refBonuses.totalAfter}</p>
        </div>
      </div>
    </section>
  );
}
