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
 *   - **A failure here must never break the page.** It cannot: the snippet is
 *     self-contained, `next/script` isolates its execution, and nothing in
 *     this codebase calls `fbq` — so there is no site code to throw when the
 *     script is blocked by an ad blocker, a corporate proxy, or Meta being
 *     down. That is why no `fbq` wrapper or queue helper exists here; adding
 *     one would create the exact coupling §15.1 forbids.
 *   - **PageView only.** §15.1 permits conversion-meaningful events, and the
 *     obvious next one is a purchase event on the PAID transition. It is
 *     deliberately not here: that would have to fire from the payment routes
 *     with an order value attached, and §15.1 bans personal data in event
 *     payloads. It needs its own decision, not a drive-by addition.
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
          Meta's snippet, verbatim apart from the id being interpolated. The id
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
