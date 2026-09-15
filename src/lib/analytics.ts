/**
 * Meta Pixel conversion events — the only way this codebase calls `fbq`.
 *
 * ---------------------------------------------------------------------------
 * Why these events exist at all
 * ---------------------------------------------------------------------------
 * A PageView tells Meta somebody arrived. It does not tell Meta who went on to
 * register or pay, and without that an ad campaign can only be optimised for
 * traffic — Meta has nothing to learn "the people who convert look like this"
 * from. These three events are what let Kaleeswaran's ads be optimised for the
 * outcome that actually matters:
 *
 *   - `Lead`             — `/api/register` accepted their details and created a
 *                          real registration. Fired from the server's answer,
 *                          never from the button press.
 *   - `InitiateCheckout` — Razorpay Checkout is about to open against that order.
 *   - `Purchase`         — `/api/razorpay/verify` returned 200. The only honest
 *                          success on this page (CLAUDE.md §8): Razorpay's own
 *                          browser `handler` is a *claim* of payment, and firing
 *                          `Purchase` from it would report money that the server
 *                          might go on to reject.
 *
 * `Lead` matters more than it looks for a programme this size. Meta's delivery
 * system wants on the order of fifty optimisation events a week before it
 * stops "learning", and a 25-seat cohort will never produce fifty purchases a
 * week. A campaign optimised for `Lead` has a realistic chance of exiting that
 * phase; one optimised for `Purchase` alone largely does not.
 *
 * ---------------------------------------------------------------------------
 * Why the parameters are a closed type
 * ---------------------------------------------------------------------------
 * CLAUDE.md §15.1: no personal data in event payloads. The order response this
 * is called next to carries the lead's name, email and phone (Checkout's
 * `prefill`), one careless spread away from an event payload. So
 * `ConversionParams` admits exactly a value and a currency — not a record, not
 * `Partial<...>` of something wider — and there is no field a name, email or
 * phone number could be put in. That is a type-level guarantee, not a
 * convention somebody has to remember.
 *
 * The registration id is used here only as a local once-per-registration key.
 * It is never sent to Meta: it is an identifier for a real person's row in the
 * lead table, and handing it to a third party is exactly the kind of quiet
 * data-sharing §15.1 exists to stop. (Meta's server-side Conversions API would
 * want a shared `eventID` for de-duplication; that is its own decision, see
 * CLAUDE.md §21.)
 *
 * ---------------------------------------------------------------------------
 * Why it can never break checkout
 * ---------------------------------------------------------------------------
 * Every call site is inside the payment flow, so a throw here would be a throw
 * in the middle of somebody paying. The whole body is inside a try/catch, it
 * no-ops when `fbq` is missing (an ad blocker, a proxy, `npm run dev` where the
 * pixel is deliberately absent — see components/MetaPixel.tsx), and it returns
 * nothing a caller could await or branch on. Analytics observes the payment
 * flow; it does not participate in it.
 */

import { analytics, siteConfig } from "@/lib/config";

export type Conversion = "Lead" | "InitiateCheckout" | "Purchase";

/** Deliberately closed. See the header: nothing here can carry personal data. */
export type ConversionParams = {
  /** Rupees, not paise — Meta reads `value` in the currency's major unit. */
  value: number;
  currency: "INR";
};

declare global {
  interface Window {
    /** Defined by Meta's snippet in components/MetaPixel.tsx, when it runs. */
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Once per event per registration, for the life of the page.
 *
 * Checkout can legitimately pass through the same step more than once for the
 * same registration: somebody dismisses Razorpay and tries again, and
 * `useCheckout` reuses the cached order rather than creating a second one. That
 * is still one lead, so it must still be one `Lead`. A module-level set is
 * enough: a registration id is minted fresh by every `/api/register` call, so a
 * reload can never resurrect one this set has forgotten.
 */
const sent = new Set<string>();

export function trackConversion(event: Conversion, params: ConversionParams, onceFor: string): void {
  try {
    if (typeof window === "undefined" || !analytics.metaPixelId) return;

    const key = `${event}:${onceFor}`;
    if (sent.has(key)) return;

    const fbq = window.fbq;
    if (typeof fbq !== "function") return;

    sent.add(key);
    fbq("track", event, {
      value: params.value,
      currency: params.currency,
      content_name: siteConfig.program,
    });
  } catch {
    // Deliberately silent. See "Why it can never break checkout" above.
  }
}
