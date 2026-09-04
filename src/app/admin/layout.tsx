import type { Metadata } from "next";

/**
 * The admin section.
 *
 * A layout of its own, for one reason: metadata. `noindex` is declared here so
 * it covers every route that ever appears under `/admin`, rather than being
 * remembered per page. It is one of three independent measures — the others are
 * the `X-Robots-Tag` header in `next.config.ts` and the `Disallow` in
 * `robots.ts` — because a crawler that ignores one usually honours another, and
 * this page lists people's names and phone numbers.
 *
 * No visual chrome here. The dashboard and the login form each own their full
 * viewport, so this layout does nothing but pass children through and set the
 * head. The root layout's dark body colour is covered by their own
 * `min-h-svh` light surfaces.
 */

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
