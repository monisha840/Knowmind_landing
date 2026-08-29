/**
 * One-time asset import + optimisation.
 *
 * Pulls the authentic KnowMind brand assets (logo, Kaleeswaran cut-out,
 * training photographs) out of the sibling `kalee_new` project and writes
 * web-ready WebP/PNG into ./public.
 *
 * Run with:  npm run optimize:assets
 * Override the source with:  ASSET_SOURCE_DIR="/path/to/kalee_new" npm run optimize:assets
 *
 * Safe to re-run — it overwrites deterministically.
 */
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE_DIR =
  process.env.ASSET_SOURCE_DIR ??
  "c:/Users/monis/OneDrive - Sirah Digital/Documents/kalee_new";

const OUT = path.resolve(process.cwd(), "public");

/** @type {Array<{from: string, to: string, op: (s: import('sharp').Sharp) => import('sharp').Sharp}>} */
const JOBS = [
  // ---- Brand marks (transparent PNG, already small — just re-compress) ----
  {
    from: "Knowmind-app-frontend/apps/web/public/logo.png",
    to: "brand/logo.png",
    op: (s) => s.png({ compressionLevel: 9, palette: true }),
  },
  {
    from: "Knowmind-app-frontend/apps/web/public/logo-white.png",
    to: "brand/logo-white.png",
    op: (s) => s.png({ compressionLevel: 9, palette: true }),
  },

  // ---- Kaleeswaran cut-out (alpha preserved for the authority section) ----
  {
    from: "Knowmind-app-frontend/apps/web/public/kaleeswaran-cut.png",
    to: "kalee/kaleeswaran.webp",
    op: (s) => s.resize({ width: 900, withoutEnlargement: true }).webp({ quality: 90, alphaQuality: 90 }),
  },

  // ---- Authentic training photography (proof, not stock) ----
  {
    from: "landing_images/IMG20260218173107.jpg",
    to: "photos/experiential-circle.webp",
    op: (s) => s.resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 76 }),
  },
  {
    from: "landing_images/IMG20251212083052.jpg",
    to: "photos/leadership-program.webp",
    op: (s) => s.resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 76 }),
  },
  {
    from: "landing_images/IMG_20250612_150536546.jpg",
    to: "photos/experiential-activity.webp",
    op: (s) => s.resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 76 }),
  },
];

const kb = (n) => `${(n / 1024).toFixed(0)} kB`;

let ok = 0;
let skipped = 0;

for (const job of JOBS) {
  const src = path.join(SOURCE_DIR, job.from);
  const dest = path.join(OUT, job.to);

  try {
    await stat(src);
  } catch {
    console.warn(`  skip  ${job.to}  (source missing: ${job.from})`);
    skipped += 1;
    continue;
  }

  await mkdir(path.dirname(dest), { recursive: true });
  const info = await job.op(sharp(src)).toFile(dest);
  const before = (await stat(src)).size;
  console.log(
    `  ok    ${job.to.padEnd(36)} ${String(info.width) + "x" + info.height}`.padEnd(58) +
      `${kb(before)} -> ${kb(info.size)}`,
  );
  ok += 1;
}

console.log(`\n${ok} written, ${skipped} skipped.`);
