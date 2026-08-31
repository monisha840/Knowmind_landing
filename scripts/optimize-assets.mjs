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

  // ---- Hero portrait: the GROWTH composition ----
  // A finished piece of art direction, not a photograph: it arrives already
  // graded, already carrying its own gold rim, and with the GROWTH lettering
  // part of the image. Resize + re-encode only.
  {
    localFrom: "hero_image.png",
    to: "kalee/hero-growth.webp",
    // Trimmed twice, both times into empty background, never into him.
    // Width 1122 -> 940: ~22% of the frame was blank to the right of the
    // GROWTH lettering. Height 1402 -> 1215: the letters end at y=1174 and
    // everything below was unlit jacket, which was costing him scale on screen
    // for nothing. Measured, not guessed — see the bbox probe in the history.
    // Trimmed to 940 of 1122: the frame carried ~22% of empty background to
    // the right of the GROWTH lettering, which was costing the subject size on
    // screen for nothing. The letters end at x=877, so 940 leaves them ~63px of
    // clear margin. A crop of dead space — no pixel of him is touched.
    op: (s) =>
      s
        .extract({ left: 0, top: 0, width: 940, height: 1215 })
        .webp({ quality: 84 }),
  },

  // ---- The hero portrait's own gold rim, extracted as an alpha matte ----
  // Derived from the portrait above, so it MUST stay after it in this array
  // and it can never drift out of register with the picture it lights.
  //
  // Why this is extractable at all: the composition is graded purple, so blue
  // is at or above red across 95% of the frame. The warm rim is the only thing
  // in the picture where red leads blue — measured, `R - B` peaks at 217 on the
  // hair silhouette and sits at or below 0 for 95% of the pixels. Thresholding
  // that difference isolates the rim and nothing else: the resulting matte
  // carries zero energy right of x=50%, which is to say it never touches the
  // GROWTH lettering.
  //
  // The point of having it is that the hero's travelling gold light is then
  // masked by the artwork's *own* contour rather than by a shape someone drew.
  // It cannot read as a border or an SVG outline laid over the picture, because
  // every pixel it can light is a pixel that was already gold.
  //
  // Alpha, not greyscale: CSS `mask-image` reads the alpha channel by default,
  // and a greyscale PNG is opaque everywhere, which would mask nothing. PNG,
  // not WebP, for 4 kB more: a WebP matte a browser cannot decode as a mask
  // fails open into a gold rectangle over his face, which is the one failure
  // this whole approach exists to avoid.
  {
    localFrom: "public/kalee/hero-growth.webp",
    to: "kalee/hero-growth-rim.png",
    build: async (src, dest) => {
      const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
      const { width: W, height: H, channels: C } = info;

      // 8 clears the noise floor (93% of pixels sit below it); 3.2 lifts the
      // surviving rim to full strength without clipping its falloff away.
      const matte = Buffer.alloc(W * H);
      for (let p = 0; p < W * H; p++) {
        const warm = data[p * C] - data[p * C + 2] - 8;
        matte[p] = warm <= 0 ? 0 : Math.min(255, Math.round(warm * 3.2));
      }

      // Blurred before the downsample so the falloff survives it. The softness
      // is wanted: it is what turns a traced line into light with a bloom.
      const soft = await sharp(matte, { raw: { width: W, height: H, channels: 1 } })
        .blur(2.4)
        .resize({ width: 470 })
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Read the stride back rather than assuming it. sharp promotes a
      // single-channel raw buffer to three through blur and resize, so
      // indexing this by pixel silently samples interleaved RGB instead —
      // which does not fail, it just squeezes the rim to a third of its width
      // and repeats it three times across the frame. The third copy lands on
      // the GROWTH lettering, and the travelling light then paints a rectangle
      // over the type. Measured before and after: with the stride honoured,
      // peak alpha right of the seam is 0.
      const w = soft.info.width;
      const h = soft.info.height;
      const stride = soft.info.channels;
      const rgba = Buffer.alloc(w * h * 4);
      for (let p = 0; p < w * h; p++) {
        rgba[p * 4] = 255;
        rgba[p * 4 + 1] = 255;
        rgba[p * 4 + 2] = 255;
        rgba[p * 4 + 3] = soft.data[p * stride];
      }
      return sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
        .png({ compressionLevel: 9 })
        .toFile(dest);
    },
  },
  // ---- Kaleeswaran cut-out, trimmed to the figure ----
  // The exported cut-out carries ~250px of transparent padding on every side,
  // which makes it impossible to position precisely in a layered composition.
  // This is a crop to the opaque bounding box, and then a resample — no pixel
  // of the photograph itself is retouched.
  //
  // About the resample. The only cut-out that exists anywhere — in this repo or
  // the sibling project — is 840x1120, and the figure inside it occupies just
  // 328x863. The audience section draws him at `h-[152%]` of a 46rem block,
  // which is ~1120px tall: a 1.3x enlargement. Worse, `next/image` will not
  // build a srcset entry larger than the intrinsic width, so the browser was
  // handed the 336px file and left to stretch it itself.
  //
  // Doubling it here does not invent detail that was never captured, and it is
  // not pretending to. What it does is move the enlargement from the browser's
  // bilinear filter to Lanczos plus a light unsharp mask, and give `next/image`
  // a source big enough to serve the size actually requested. Measured against
  // the old file at the same display size, edges — his glasses, his lapel, the
  // cut line around his hair — stop smearing.
  //
  // If a higher-resolution cut-out is ever supplied, drop it in as the source
  // and delete the `.resize()` — it is a workaround for a small original, not
  // something the composition wants.
  {
    localFrom: "public/kalee/kaleeswaran.webp",
    to: "kalee/kaleeswaran-cutout.webp",
    op: (s) =>
      s
        .extract({ left: 268, top: 252, width: 336, height: 868 })
        .resize({ width: 672, kernel: "lanczos3" })
        .sharpen({ sigma: 0.8, m1: 0.5, m2: 2 })
        .webp({ quality: 88, alphaQuality: 92 }),
  },

  // ---- Kaleeswaran portrait for the audience section ----
  // Source lives in this repo, not the sibling project. Resize + re-encode
  // only: the photograph is authoritative and nothing about it is retouched.
  {
    localFrom: "public/kaleeswaran_image.png",
    to: "kalee/kaleeswaran-portrait.webp",
    op: (s) => s.resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 82 }),
  },

  // ---- Kaleeswaran half-face portrait for the hero ----
  // Supplied already cut out, with the figure flush to the right edge of the
  // frame — which is what lets the hero crop it against the viewport edge. The
  // alpha channel is load-bearing rather than cosmetic: the hero's gold rim
  // light is a blurred copy of this mask, so `alphaQuality` stays at 100 and
  // the cut-out must never be flattened onto a background. Re-encode only; the
  // photograph itself is authoritative and nothing about it is retouched.
  {
    localFrom: "kaleeswaran_halfface.png",
    to: "kalee/kaleeswaran-hero.webp",
    op: (s) =>
      s.resize({ width: 1024, withoutEnlargement: true }).webp({ quality: 82, alphaQuality: 100 }),
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
  // `localFrom` sources live in this repo; `from` sources live in kalee_new.
  const src = job.localFrom
    ? path.resolve(process.cwd(), job.localFrom)
    : path.join(SOURCE_DIR, job.from);
  const dest = path.join(OUT, job.to);

  try {
    await stat(src);
  } catch {
    console.warn(`  skip  ${job.to}  (source missing: ${job.localFrom ?? job.from})`);
    skipped += 1;
    continue;
  }

  await mkdir(path.dirname(dest), { recursive: true });
  // `build` is the escape hatch for jobs that need raw pixel access rather
  // than a fluent sharp chain — currently just the rim matte.
  const info = job.build ? await job.build(src, dest) : await job.op(sharp(src)).toFile(dest);
  const before = (await stat(src)).size;
  console.log(
    `  ok    ${job.to.padEnd(36)} ${String(info.width) + "x" + info.height}`.padEnd(58) +
      `${kb(before)} -> ${kb(info.size)}`,
  );
  ok += 1;
}

console.log(`\n${ok} written, ${skipped} skipped.`);
