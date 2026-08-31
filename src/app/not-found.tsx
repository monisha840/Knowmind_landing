import type { Metadata } from "next";

import { PROGRAM_PATH, siteConfig } from "@/lib/config";

/**
 * 404.
 *
 * The programme moved off the site root onto its own path, so the bare domain
 * now lands here until a KnowMind Universe site is built at `/`. That makes
 * this page a real destination rather than an edge case: somebody who types the
 * domain from memory, or follows an old link, arrives at it.
 *
 * So it does the one useful thing a 404 can — names where they probably meant
 * to go, and offers a way to reach a person. No 3D, no motion, no client
 * JavaScript: a server component that renders instantly whatever else is wrong.
 *
 * Both metadata lines are load-bearing, and neither is as redundant as it looks.
 *
 * `canonical: null` stops this page inheriting the layout's canonical, which
 * would otherwise tell search engines the 404 *is* the programme page — a
 * soft-404 pointing at the wrong URL.
 *
 * `robots` overrides the layout's `index, follow`. Next emits its own `noindex`
 * on not-found regardless, so the page always carries two robots tags; the
 * question is only whether they agree. Drop this line and the pair reads
 * `noindex` next to `index, follow`, which is a contradiction handed to a
 * crawler. With it they both say noindex.
 */
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
  alternates: { canonical: null },
};

export default function NotFound() {
  return (
    <main
      id="main"
      className="relative grid min-h-svh place-items-center bg-night px-(--spacing-gutter) py-20 text-cream"
    >
      {/* The same dawn wash the page opens with, so this still feels like the
          same site rather than a server error page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,var(--color-wine-950),transparent)]"
      />

      <div className="relative w-full max-w-xl text-center">
        <p className="text-eyebrow font-semibold tracking-[0.18em] text-honey uppercase">
          404
        </p>

        <h1 className="mt-6 font-serif text-[clamp(2.25rem,1.4rem+3.4vw,3.75rem)] leading-[1.05] text-cream italic">
          There&rsquo;s nothing here.
        </h1>

        <p className="mt-5 text-lead text-cream-muted">
          The page you were looking for doesn&rsquo;t exist — but the journey does.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
          {/* A plain anchor, not `CTAButton`: that is a client component with a
              magnetic pointer effect, and a 404 has no business shipping
              JavaScript to do it. Same honey pill, none of the weight. */}
          <a
            href={PROGRAM_PATH}
            className="group inline-flex min-h-[3.25rem] items-center justify-center gap-2.5 rounded-full bg-honey px-8 py-4 text-base font-semibold tracking-tight whitespace-nowrap text-wine-950 transition-colors duration-300 hover:bg-honey-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-honey sm:px-10 sm:text-lg"
          >
            <span>{siteConfig.program}</span>
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              className="h-[1.1em] w-[1.1em] shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1"
            >
              <path
                d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>

        <p className="mt-10 text-sm text-cream-dim">
          Or reach us on{" "}
          <a
            href={siteConfig.contact.phoneHref}
            className="link-underline font-medium text-honey"
          >
            {siteConfig.contact.phone}
          </a>
        </p>
      </div>
    </main>
  );
}
