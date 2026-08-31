import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Instrument_Serif, Noto_Sans_Tamil } from "next/font/google";

import { PROGRAM_PATH, PROGRAM_URL, programDetails, siteConfig } from "@/lib/config";
import { jsonLd } from "@/lib/schema";
import "./globals.css";

/* -------------------------------------------------------------------------- */
/*  Typography                                                                 */
/* -------------------------------------------------------------------------- */

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

/** Reserved for emotional lines and pull-quotes, never for UI. */
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
});

const notoTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  variable: "--font-noto-tamil",
  display: "swap",
  weight: ["400", "500", "600"],
});

/* -------------------------------------------------------------------------- */
/*  Metadata                                                                   */
/* -------------------------------------------------------------------------- */

const title = "1% Better Every Day | 14-Day Psychological Growth Journey | KnowMind Universe";
const description =
  "Join KnowMind Universe's 14-Day Live Psychological Growth Journey. Build awareness, self-trust and consistent action through 45-minute live sessions at 5:30 AM.";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: title,
    template: `%s | ${siteConfig.name}`,
  },
  description,
  applicationName: siteConfig.name,
  authors: [{ name: "Kaleeswaran K", url: siteConfig.contact.websiteHref }],
  creator: "Kaleeswaran K",
  publisher: siteConfig.name,
  keywords: [
    "psychological growth",
    "self development",
    "personal growth",
    "self trust",
    "consistency",
    "Tamil personal development",
    "psychology workshop",
    "live psychology program",
    "14 day growth journey",
    "1% better every day",
    "Kaleeswaran K",
    "KnowMind Universe",
    "morning growth journey",
    "Tamil self improvement program",
  ],
  alternates: {
    canonical: PROGRAM_PATH,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    alternateLocale: ["ta_IN"],
    url: PROGRAM_URL,
    siteName: siteConfig.name,
    title,
    description: `${programDetails.dateLabel} · ${programDetails.timeLabel} · Live on Zoom · Tamil + English · ${programDetails.seats} participants · Founding price ₹${programDetails.price}.`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "education",
  formatDetection: { telephone: true, address: false, email: true },
};

export const viewport: Viewport = {
  themeColor: "#0c0410",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/* -------------------------------------------------------------------------- */

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      className={`${instrumentSans.variable} ${instrumentSerif.variable} ${notoTamil.variable}`}
    >
      <body className="bg-night text-cream antialiased">
        {/*
          Scroll-reveal animations ship their starting state as inline
          `opacity:0`, which would leave the page blank if the bundle never
          runs. These two selectors match exactly those elements — and not
          genuinely translucent ones like `opacity:0.4` — so the content still
          reads with scripting off.
        */}
        <noscript>
          <style>{`
            [style="opacity:0"],
            [style^="opacity:0;transform:translateY("] {
              opacity: 1 !important;
              transform: none !important;
            }
          `}</style>
        </noscript>

        <a
          href="#main"
          className="sr-only rounded-full focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-honey focus:px-5 focus:py-3 focus:font-semibold focus:text-wine-950"
        >
          Skip to content
        </a>

        {children}

        <script
          type="application/ld+json"
          // Static, build-time JSON from our own module — no user input involved.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
