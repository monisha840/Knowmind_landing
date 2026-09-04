import { OpenRegistration } from "@/components/ui/OpenRegistration";
import { refMissADay } from "@/lib/reference-content";

/**
 * Band 6.5 — "Miss a day?".
 *
 * The corrections deck removes band 7 outright (slide 5) and then keeps this
 * one block out of it, with a button on it (slide 6: "We can keep this / Keep
 * this point and have CTA buttom"). The first half was done and the second was
 * not — the point went out with the section — so this is the block standing on
 * its own.
 *
 * ── Where it sits ─────────────────────────────────────────────────────────
 *
 * Straight after `JourneyTimeline`, which is where it always was: it used to be
 * the last thing in band 7, and band 7 followed band 6. Fourteen days of
 * commitment, then permission to miss one. Moving it anywhere else would break
 * that sequence, which is the only reason the block works.
 *
 * ── Why it earns a CTA ────────────────────────────────────────────────────
 *
 * This is the page's lowest-pressure moment — it exists to say that falling off
 * is survivable — and that is exactly when somebody who has been hesitating
 * decides. The button is the same amber pill and the same words as the journey
 * band's (`.cta-btn`, `refMissADay.cta`), so it joins the existing CTA
 * vocabulary rather than starting a new one (CLAUDE.md §7.2), and like every
 * other call to action on the page it opens the registration dialog rather than
 * navigating (CLAUDE.md §7.1).
 *
 * A server component. `OpenRegistration` is the only thing here that hydrates.
 *
 * The heading is `sr-only`: the band's visible opening line is the question
 * itself, set as body copy inside the panel, and promoting it to a visible
 * heading would give a one-sentence reassurance the same weight as the fourteen
 * days above it. The section still needs a real heading to be labelled by
 * (CLAUDE.md §13.1), so it has one that only a screen reader hears — the same
 * pattern `AudienceSection` already uses.
 */
export function MissADaySection() {
  return (
    <section className="miss-section" id="miss-a-day" aria-labelledby="miss-heading">
      <div className="miss-inner">
        <h2 className="sr-only" id="miss-heading">
          {refMissADay.question}
        </h2>

        <div className="how-miss">
          <p>{refMissADay.question}</p>
          <div className="how-miss-reassurance">{refMissADay.reassurance}</div>
          <p className="after">{refMissADay.after}</p>

          <div className="miss-cta">
            <OpenRegistration className="cta-btn">{refMissADay.cta}</OpenRegistration>
          </div>
        </div>
      </div>
    </section>
  );
}
