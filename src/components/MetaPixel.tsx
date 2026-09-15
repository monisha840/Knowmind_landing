/**
 * The Meta Pixel — this page's only third-party script.
 *
 * ---------------------------------------------------------------------------
 * Why it is loaded this way
 * ---------------------------------------------------------------------------
 * CLAUDE.md §15 held this page to "no third-party scripts at all", and §15.1
 * set the terms for the day one was added. Those terms are what this file
 * implements, and each one is load-bearing:
 *
 *   - **`next/script` at `afterInteractive`**, never a raw `<script>` in the
 *     document head. Meta's own snippet is written to be pasted into `<head>`,
 *     where it would fetch `fbevents.js` before the page has painted. This
 *     page's entire premise is a fast first paint on a mid-range Android over
 *     4G (§15: LCP < 2.5s), and an analytics beacon is never worth a share of
 *     that. `afterInteractive` runs it once hydration is done, so a PageView
 *     lands a fraction of a second later and LCP is untouched.
 *   - **A failure here must never break the page.** The snippet is
 *     self-contained and `next/script` isolates its execution. The site calls
 *     `fbq` from exactly one place — `trackConversion` in lib/analytics.ts —
 *     and that function no-ops when `fbq` is missing and swallows anything it
 *     throws. So an ad blocker, a corporate proxy or Meta being down removes
 *     the tracking and leaves checkout exactly as it was. Never call `fbq`
 *     directly from a component; go through that function.
 *   - **This file sends PageView; conversions live elsewhere.** `Lead`,
 *     `InitiateCheckout` and `Purchase` are fired from the checkout state
 *     machine (lib/payments/useCheckout.ts) via lib/analytics.ts, because only
 *     that code knows when the server has actually accepted a registration or
 *     verified a payment. Their payloads carry a value and a currency and
 *     nothing else — §15.1's no-personal-data rule, enforced by type.
 *
 * ---------------------------------------------------------------------------
 * Why autoConfig is off
 * ---------------------------------------------------------------------------
 * Meta's pixel ships with "automatic configuration" on, and one of the things
 * it switches on is Automatic Advanced Matching: it reads the registration
 * form's email and phone inputs, SHA-256 hashes them, and attaches them to
 * every later event as `udff[em]`, `udff[ph]` and `audff[em]`. Measured in a
 * real browser against this page with beacons captured and blocked: 5 beacons
 * carried the hashed email or phone as deployed, 0 with the line above.
 *
 * A hash of an email address is still the email address for this purpose —
 * matching it back to a person is the entire point of sending it — so this is
 * exactly what CLAUDE.md §15.1 forbids, and it would silently make
 * lib/analytics.ts's "no personal data reaches Meta" guarantee false. It also
 * removes the automatic `SubscribedButtonClick` events, which only duplicated
 * the explicit conversions with scraped button text.
 *
 * What it does not remove, verified in the same run: PageView, Lead,
 * InitiateCheckout and Purchase all still fire with value and currency. Ad
 * attribution for somebody who clicked an ad still works through Meta's click
 * id (`fbclid`, stored as the `_fbc` cookie), which needs no email at all.
 *
 * **The toggle in Events Manager no longer does anything for this page** —
 * this line overrides it. If advanced matching is ever wanted, it is a
 * deliberate change with a consent step (§15.1's consent bullet), not a
 * dashboard switch.
 *
 * ---------------------------------------------------------------------------
 * Why it does not run in development
 * ---------------------------------------------------------------------------
 * Every `npm run dev` page load would otherwise fire a real PageView into the
 * production dataset, and a developer refreshing a page fifty times is
 * indistinguishable in Meta's reporting from fifty visitors. The guard below
 * keeps the dataset honest.
 *
 * The practical consequence, so nobody wastes an afternoon on it: **the pixel
 * is genuinely absent from `npm run dev`.** Verify it on a deployed build, not
 * locally. Preview deployments *do* carry it (they build with
 * `NODE_ENV=production`), which is what makes a deploy testable with Meta's
 * Test Events tool before it reaches the live domain.
 */

import Script from "next/script";

import { analytics } from "@/lib/config";

export function MetaPixel() {
  // An empty id means "no pixel configured" — the same honest boundary the
  // Razorpay and WhatsApp credentials use (§0.4): absent integration, absent
  // feature, rather than a script that half-runs.
  if (!analytics.metaPixelId) return null;
  if (process.env.NODE_ENV !== "production") return null;

  const id = analytics.metaPixelId;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {/*
          Meta's snippet, verbatim apart from the id being interpolated and the
          one `autoConfig` line before `init` (see "Why autoConfig is off" in
          the header — it must stay ahead of `init` to take effect). The id
          is a build-time constant from our own module and is digits only
          (`analytics.metaPixelId` in lib/config.ts), so there is no user input
          anywhere near this string and nothing to escape — the same reasoning
          that lets layout.tsx emit its JSON-LD blob. Do not make this value
          dynamic, and never derive it from a request, a query string or a
          cookie.
        */}
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('set', 'autoConfig', false, '${id}');
fbq('init', '${id}');
fbq('track', 'PageView');`}
      </Script>

      {/*
        The no-JS fallback from Meta's snippet. A plain <img> rather than
        next/image, deliberately: this is a 1×1 tracking beacon, not content —
        it must not be optimised, resized, lazy-loaded or proxied through the
        image pipeline, and next/image inside <noscript> would defeat the one
        thing it is for. §14.1's "always next/image" governs images a visitor
        actually sees; this is never rendered visibly.
      */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
