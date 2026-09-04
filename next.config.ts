import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep the dev overlay out of design screenshots.
  devIndicators: false,
  /**
   * `.next` unless something asks for somewhere else.
   *
   * A production build empties and rewrites the directory a running `next dev`
   * is still serving chunks out of. The dev server survives the swap but its
   * client keeps asking for hashes that no longer exist, and the first casualty
   * is the stylesheet: `/_next/static/chunks/<hash>.css` starts answering 500,
   * the page renders with no CSS at all, and it looks like a layout bug rather
   * than a stale server. It also produces `EPERM: unlink` failures on Windows,
   * where the running process still holds the files.
   *
   * So anyone verifying a build while someone else has the dev server up sets
   * `NEXT_DIST_DIR=.next-verify` and the two stop sharing a directory. Default
   * unchanged, so `npm run build` and the deployment behave exactly as before.
   *
   * One side effect worth knowing: `next build` appends a types glob for
   * whatever directory it used to `tsconfig.json`'s `include`. After a run with
   * this set, discard that hunk — it points at a scratch directory that is
   * gitignored and usually absent.
   */
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // three.js ships untranspiled ESM examples; keep the transpile hint explicit.
  transpilePackages: ["three"],
  /**
   * The programme is the only page, and it lives at `/1percentagebetter` so the
   * path reads correctly wherever it is hosted. On its own subdomain that
   * leaves the bare origin with nothing to serve, so the root would answer with
   * the not-found page — the first thing anyone typing the domain would see.
   *
   * This forwards it. `permanent: false` (307) on purpose: a 308 is cached by
   * the browser indefinitely, and if the programme ever moves back to a path on
   * a larger site, a permanent redirect already in visitors' caches is very
   * hard to take back. The canonical URL is unaffected — it is still
   * PROGRAM_URL, built from `siteConfig.url` in `src/lib/config.ts`.
   */
  /**
   * Headers for the admin surface.
   *
   * `/admin` lists people's names, email addresses and phone numbers, so it is
   * kept out of indexes three independent ways: this header, the `robots`
   * metadata exported by `src/app/admin/layout.tsx`, and the `Disallow` in
   * `src/app/robots.ts`. A crawler that ignores one usually honours another,
   * and none of them costs anything.
   *
   * `/admin` and `/admin/:path*` are both listed on purpose — the parameterised
   * pattern alone does not reliably match the bare path.
   *
   * These headers are defence in depth, never the access control. That is
   * `requireAdmin` inside each route (see `src/lib/admin/auth.ts`): a header
   * cannot refuse a request, and middleware-style gates in front of a handler
   * have been bypassable before now.
   */
  async headers() {
    const adminHeaders = [
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      { key: "Cache-Control", value: "no-store, max-age=0" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      // A registration id in a Referer header would leak to any outbound link.
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Frame-Options", value: "DENY" },
    ];

    return [
      { source: "/admin", headers: adminHeaders },
      { source: "/admin/:path*", headers: adminHeaders },
      { source: "/api/admin/:path*", headers: adminHeaders },
    ];
  },

  async redirects() {
    return [
      {
        source: "/",
        destination: "/1percentagebetter",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
