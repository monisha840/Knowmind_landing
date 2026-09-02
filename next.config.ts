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
};

export default nextConfig;
