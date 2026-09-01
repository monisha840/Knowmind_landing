/**
 * Site-wide configuration.
 *
 * Everything here is either a hard fact from the programme brief or an
 * environment-driven value. Nothing is invented.
 */

export const siteConfig = {
  name: "KnowMind Universe",
  tagline: "Know Within. Grow Beyond.",
  program: "1% Better. Every Day.",
  programSubtitle: "14-Day Live Psychological Growth Journey",
  batch: "Batch 2",

  /**
   * The canonical origin of this landing page.
   *
   * Distinct from `contact.website` below: that is Kaleeswaran's practice site,
   * shown in the footer and marked up as his `Person.url`. This is where the
   * programme itself lives, and it is what every canonical tag, Open Graph URL,
   * sitemap entry and JSON-LD `@id` is built from.
   *
   * Keep the default and NEXT_PUBLIC_SITE_URL in agreement, and both in
   * agreement with the primary domain configured at the host — a canonical tag
   * pointing at a URL that redirects is worse than none.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.knowminduniverse.com",

  contact: {
    website: "www.kaleeswaran.com",
    websiteHref: "https://www.kaleeswaran.com",
    phone: "+91 9688440032",
    phoneHref: "tel:+919688440032",
    email: "kaleesemail@gmail.com",
    emailHref: "mailto:kaleesemail@gmail.com",
  },
} as const;

export const programDetails = {
  startDate: "2026-09-14",
  endDate: "2026-09-27",
  dateLabel: "September 14–27, 2026",
  dateLabelShort: "Sep 14–27, 2026",
  timeLabel: "5:30 AM – 6:15 AM",
  timeShort: "5:30 AM",
  durationMinutes: 45,
  days: 14,
  platform: "Live on Zoom",
  language: "Tamil + English",
  languageNote: "Natural Tanglish",
  seats: 25,
  /**
   * The programme price, and the only one.
   *
   * This single number is both what the page renders (via `inr()`) and what
   * Razorpay charges: `REGISTRATION_AMOUNT_PAISE` in
   * `lib/payments/registrations.ts` is `price * 100`, and the verify route and
   * the webhook both re-check the order and the payment against it. There is
   * deliberately no second constant — a page that displays one figure while
   * checkout collects another is the failure this arrangement exists to make
   * impossible (CLAUDE.md §7.5, §8).
   */
  price: 699,
  currency: "INR",
  currencySymbol: "₹",
} as const;

/**
 * Payment.
 *
 * There is no build-time payment URL any more, and deliberately so. Registration
 * now runs through this application's own server:
 *
 *   POST /api/register          → validates the answers, creates the ₹699 order
 *   Razorpay Standard Checkout  → opened in the browser against that order
 *   POST /api/razorpay/verify   → checks the signature, then marks it PAID
 *   POST /api/razorpay/webhook  → Razorpay's independent confirmation
 *
 * The credentials behind that live in `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`,
 * which are **not** NEXT_PUBLIC_ and are read only by `src/lib/payments/*` on
 * the server. Nothing about payment is readable from this file, because
 * anything in it can be imported by a client component.
 *
 * The old `RAZORPAY_PAYMENT_LINK` / `isPaymentConfigured` pair is gone with it.
 * Whether payment is available is now a server-side fact, and a client-side
 * guess at it would be both wrong and — differing between the server render and
 * the browser — a hydration mismatch (CLAUDE.md §20.4).
 */

/**
 * Where the programme lives.
 *
 * The page used to be the site root. It now sits on its own path so the root
 * is free for a KnowMind Universe site later. Declared once here because six
 * things derive from it — the route folder's name, the canonical tag, the Open
 * Graph URL, the sitemap entry, the manifest's start_url and the registration
 * URL in the JSON-LD. Change it here and in the folder name under `src/app/`,
 * and nothing else needs touching.
 *
 * No trailing slash: everything below concatenates onto it.
 */
export const PROGRAM_PATH = "/1percentagebetter";

/** The programme's absolute URL. */
export const PROGRAM_URL = `${siteConfig.url}${PROGRAM_PATH}`;

/** Indian digit grouping — 1999 renders as "1,999", not "1999". */
export const formatINR = (n: number) => n.toLocaleString("en-IN");

/** Price with its symbol, e.g. "₹1,999". */
export const inr = (n: number) => `${programDetails.currencySymbol}${formatINR(n)}`;

/**
 * Where every call to action on the page sends someone.
 *
 * The sign-up questions, not checkout. Registration now runs
 * CTA → questions → payment, so the details are collected once, in one place,
 * before anybody is asked for money — and the payment link is reached from the
 * end of that form rather than from a button anywhere on the page.
 */
export const REGISTER_ANCHOR = "#begin-journey";

/**
 * The pricing card.
 *
 * Where the questions hand off to when there is no payment link yet — sending
 * someone from the end of the form back to the top of the same form would be a
 * button that goes nowhere.
 */
export const PRICING_ANCHOR = "#register";
