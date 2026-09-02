import { REGISTER_ANCHOR, programDetails } from "@/lib/config";
import { inr, refPrice } from "@/lib/reference-content";

/**
 * Band 15 — the price, the live-only note and the promise.
 *
 * One band, not three. `reference.css` groups `.no-rec` and `.guar-box` with
 * the price under a single "PRICE + PROMISE" heading, and the deviation note on
 * `.g-fine` fixes the promise's ground at #4B0082 — which is `.price-box`, not
 * the #2D0060 band around it. So both sit inside the box: the objection
 * ("there is no recording") and the answer to it ("attend all fourteen and I
 * will return every rupee") are read without leaving the thing being bought.
 *
 * This replaced the old two-column offer card. `LiveOnlySection` and
 * `GuaranteeSection` are the sections that used to carry those two blocks; they
 * are left on disk untouched and simply no longer composed into the page
 * (CLAUDE.md §19).
 *
 * ── The one thing in this file that spends money ──────────────────────────
 *
 * The reference points its button at a hardcoded `rzp.io` payment link. This
 * one points at `#begin-journey`, because the six registration questions have
 * to be answered before an order exists — the answers are the registration
 * record (CLAUDE.md §8). The reference's button *appearance* is reproduced
 * exactly; its destination is the application's own verified flow:
 *
 *   this button → #begin-journey → JourneyForm → POST /api/register
 *   → Razorpay Checkout → POST /api/razorpay/verify → PAID
 *
 * Every figure on this card comes from `config.ts` through
 * `reference-content.ts`, so the price printed here and the price the server
 * charges are the same constant (CLAUDE.md §7.5).
 */
export function PricingSection() {
  const { guarantee, noRecording } = refPrice;

  return (
    <section className="price-section" id="register" aria-labelledby="pricing-heading">
      <div className="price-center">
        <h2 id="pricing-heading">{refPrice.heading}</h2>
        <p>{refPrice.sub}</p>

        <div className="price-box">
          <p className="p-lbl">{refPrice.label}</p>
          <p className="p-main">{inr(programDetails.price)}</p>
          <p className="p-was">{refPrice.was}</p>
          <p className="p-incl">{refPrice.includes}</p>

          <div className="p-bonus-list">
            {refPrice.bonusLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p>{refPrice.bonusTotalLine}</p>
          </div>

          <div className="p-badges">
            {refPrice.badges.map((badge) => (
              <span className="pb" key={badge}>
                {badge}
              </span>
            ))}
          </div>

          <a href={REGISTER_ANCHOR} className="p-cta">
            {refPrice.cta}
          </a>
          <p className="p-note">{refPrice.note}</p>

          <div className="no-rec">
            <span className="dot" aria-hidden>
              ●
            </span>
            <p className="no-rec-text">
              <strong>{noRecording.strong}</strong>
              {noRecording.rest}
            </p>
          </div>

          {/* The 🛡️ that used to open this box is gone. It was inferred rather
              than transcribed — the reference records a 36px slot here with no
              glyph in it — so it was never reference copy, and a colour emoji
              shield above a refund promise read as clip-art on a page whose
              whole argument is restraint. The heading carries it instead. */}
          <div className="guar-box">
            <div>
              <p className="g-title">{guarantee.title}</p>
              <p className="g-text">
                {guarantee.body}
                <span className="g-fine">{guarantee.fine}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
