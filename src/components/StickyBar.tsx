import { Countdown } from "@/components/Countdown";
import { PRICING_ANCHOR } from "@/lib/config";
import { refSticky } from "@/lib/reference-content";

/**
 * Band 1 — the pinned bar.
 *
 * The reference's only chrome: a wordmark, a countdown and one call to action,
 * pinned at `top: 0` with no scroll threshold and no shrink. There is no
 * navigation on the page at any width — no links, no hamburger, no drawer — so
 * this replaces `Navbar` rather than sitting beside it (specification §07).
 *
 * A server component. Only the countdown needs the browser, and it is its own
 * client component (CLAUDE.md §4.1).
 */
export function StickyBar() {
  return (
    <header className="sticky">
      <div className="s-logo">
        {refSticky.brand}
        <span>{refSticky.tagline}</span>
      </div>

      <Countdown />

      {/* The reference points this at the price band, and so does this. The
          band's own button is what starts registration — see PricingSection. */}
      <a href={PRICING_ANCHOR} className="s-cta">
        {refSticky.cta}
      </a>
    </header>
  );
}
