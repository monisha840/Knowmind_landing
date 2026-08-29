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

  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kaleeswaran.com",

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
  price: 999,
  nextBatchPrice: 1999,
  currency: "INR",
  currencySymbol: "₹",
} as const;

/**
 * Razorpay payment link.
 *
 * Set NEXT_PUBLIC_RAZORPAY_PAYMENT_LINK in `.env.local` (see `.env.example`).
 * While it is empty every CTA degrades gracefully to an in-page scroll to the
 * registration section rather than pointing at a URL that does not exist.
 */
export const RAZORPAY_PAYMENT_LINK =
  process.env.NEXT_PUBLIC_RAZORPAY_PAYMENT_LINK?.trim() || "";

export const isPaymentConfigured = RAZORPAY_PAYMENT_LINK.length > 0;

/** Indian digit grouping — 1999 renders as "1,999", not "1999". */
export const formatINR = (n: number) => n.toLocaleString("en-IN");

/** Price with its symbol, e.g. "₹1,999". */
export const inr = (n: number) => `${programDetails.currencySymbol}${formatINR(n)}`;

/** Anchor the CTAs fall back to when checkout is not yet wired up. */
export const REGISTER_ANCHOR = "#register";
