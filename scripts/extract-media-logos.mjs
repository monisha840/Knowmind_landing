/**
 * Pull the media outlets' logos out of the approved deck and write web-ready
 * WebP into public/media.
 *
 * Run with:  npm run media:logos
 *
 * Safe to re-run — it overwrites deterministically.
 *
 * ── Why it reads the .pptx directly ────────────────────────────────────────
 *
 * `LP contents.pptx` is committed, so it is the one source in this repository
 * that can be re-derived from at any time. Extracting by hand into a scratch
 * folder would make these nine files unreproducible the moment somebody asks
 * where they came from. A .pptx is a zip, and its images sit in `ppt/media/`
 * untouched — so this reads the zip itself.
 *
 * No zip dependency: Node ships `zlib`, and the central directory is a handful
 * of fixed-width fields. Same trade `strip-audio.mjs` takes with MP4 — a format
 * read is not worth a package (CLAUDE.md §2.2).
 *
 * ── On shipping third-party marks ──────────────────────────────────────────
 *
 * CLAUDE.md §21 recorded the typographic wordmarks as a deliberate hold:
 * "the deck carries real logo images, several scraped; shipping third-party
 * marks is a licensing decision". That decision has now been made by the owner,
 * who asked for these logos on the page. It is recorded here rather than left
 * implicit, because it is the kind of call an agent must never make alone.
 *
 * These are the marks of outlets that featured Kaleeswaran. They are used
 * nominatively — to name who covered him — at a size and treatment that cannot
 * be mistaken for endorsement or partnership, and no mark is recoloured or
 * redrawn: `trim` removes only surrounding background, and the resize is
 * proportional.
 *
 * ── The mapping ────────────────────────────────────────────────────────────
 *
 * The deck names its images `image1`…`image17` with no ordering that means
 * anything, and three of them carry a URL query string instead of an
 * extension — they were saved straight off the web. Each job below is keyed by
 * the name `refMediaMarquee` already uses, so the strip's copy and its pictures
 * cannot drift apart; `slug` is what the file is called on disk.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

import sharp from "sharp";

const DECK = path.resolve(process.cwd(), "LP contents.pptx");
const OUT = path.resolve(process.cwd(), "public/media");

/**
 * Nine outlets, in the order `refMediaMarquee.items` lists them.
 *
 * `entry` is the path inside the .pptx. The `.org&utm_campaign=…` names are
 * verbatim — the deck stored a download URL's tail as the extension, and the
 * bytes are a normal PNG or JPEG regardless.
 *
 * A tenth logo, `image11.png`, is Live FM 107.3. It is not built: the
 * reference's strip names nine outlets and Live FM is not among them, and
 * adding an outlet to a "featured in" claim is a content decision, not an
 * asset one (CLAUDE.md §1.1). It is one line away if the owner wants it.
 *
 * @type {Array<{name: string, slug: string, entry: string}>}
 */
const JOBS = [
  { name: "Sun News", slug: "sun-news", entry: "ppt/media/image4.jpeg" },
  { name: "Thanthi TV", slug: "thanthi-tv", entry: "ppt/media/image13.org&utm_campaign=parser&utm_content=thumbnail" },
  { name: "Vijay TV", slug: "vijay-tv", entry: "ppt/media/image6.org&utm_campaign=index&utm_content=original" },
  { name: "Vikatan", slug: "vikatan", entry: "ppt/media/image5.jpg" },
  { name: "Hello FM 106.4", slug: "hello-fm", entry: "ppt/media/image12.png" },
  { name: "Puthiya Thalaimurai", slug: "puthiya-thalaimurai", entry: "ppt/media/image7.org&utm_campaign=index&utm_content=original" },
  { name: "Puthu Yugam", slug: "puthu-yugam", entry: "ppt/media/image8.png" },
  { name: "Maalai Malar", slug: "maalai-malar", entry: "ppt/media/image9.jpeg" },
  { name: "The Federal", slug: "the-federal", entry: "ppt/media/image10.jpeg" },
];

/**
 * Rendered at 28px tall in a 48px pill; 96 is that at 3x, which is the last
 * density worth carrying for a mark this small. Width follows the mark.
 */
const TARGET_H = 96;

/* -------------------------------------------------------------------------- */
/*  A .pptx is a zip                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Read a zip's central directory and return its entries' bytes.
 *
 * Only the two storage methods a .pptx actually uses are handled — 0 (stored)
 * and 8 (deflate). Anything else throws rather than returning bytes that would
 * silently be wrong.
 *
 * @param {Buffer} buf
 * @returns {Map<string, Buffer>}
 */
function unzip(buf) {
  // The End of Central Directory record is the last thing in the file, after a
  // comment of unknown length — so it is found by scanning backwards for its
  // signature rather than by seeking to a fixed offset.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 66_000; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd === -1) throw new Error("not a zip: no end-of-central-directory record");

  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = new Map();

  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error(`bad central header at ${p}`);
    const method = buf.readUInt16LE(p + 10);
    const compressedSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);

    // The local header repeats the name and extra fields, and its extra length
    // frequently differs from the central one — so the payload offset has to be
    // read from the local header, never computed from the central record.
    if (buf.readUInt32LE(localOff) !== 0x04034b50) throw new Error(`bad local header for ${name}`);
    const lNameLen = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const start = localOff + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(start, start + compressedSize);

    if (method === 0) files.set(name, Buffer.from(raw));
    else if (method === 8) files.set(name, inflateRawSync(raw));
    else throw new Error(`${name}: unsupported compression method ${method}`);

    p += 46 + nameLen + extraLen + commentLen;
  }

  return files;
}

/* -------------------------------------------------------------------------- */

const deck = await readFile(DECK);
const entries = unzip(deck);
await mkdir(OUT, { recursive: true });

const manifest = [];

for (const job of JOBS) {
  const bytes = entries.get(job.entry);
  if (!bytes) {
    console.log(`  MISS  ${job.name}`);
    console.log(`        "${job.entry}" is not in the deck — the deck changed, or the name did.`);
    continue;
  }

  const dest = path.join(OUT, `${job.slug}.webp`);

  // `trim` removes the flat border the deck's own crop left around each mark —
  // it works on the frame's own edge colour, so it takes white off a JPEG and
  // transparency off a PNG without being told which it is. Nothing inside the
  // mark is touched: the threshold is low enough that a pale-but-real pixel
  // stops it.
  //
  // `withoutEnlargement` matters: three of these arrive smaller than 96px tall,
  // and scaling a logo up would only ship blur at a larger file size. They stay
  // at their own height and the strip renders them at whatever they have.
  const img = sharp(bytes).trim({ threshold: 12 });
  const meta = await sharp(await img.toBuffer()).metadata();

  // Flattened onto white, including the three marks that arrive transparent.
  //
  // Six of the nine were drawn for white and carry it in the pixels, so the
  // strip's pills are white either way and there is nothing for transparency to
  // reveal. Keeping it would only add a way to go wrong: `next/image`
  // re-encodes on demand and serves JPEG to a client that does not advertise
  // WebP or AVIF, and JPEG has no alpha — those three marks would arrive
  // flattened onto whatever that pipeline defaults to rather than onto the
  // white they are meant to sit on. Deciding it here means every mark looks the
  // same in every browser.
  const info = await sharp(await img.toBuffer())
    .flatten({ background: "#ffffff" })
    .resize({ height: TARGET_H, withoutEnlargement: true, fit: "inside" })
    .webp({ quality: 92 })
    .toFile(dest);

  manifest.push({ name: job.name, slug: job.slug, width: info.width, height: info.height });

  const hash = createHash("sha1").update(bytes).digest("hex").slice(0, 8);
  console.log(
    `  ok    media/${job.slug}.webp  ${meta.width}x${meta.height} -> ${info.width}x${info.height}` +
      `  ${(info.size / 1024).toFixed(1)} kB  (src ${hash})`
  );
}

// Written next to the images so the component can render exact intrinsic sizes
// and reserve the right box before anything loads (CLAUDE.md §14.1, §15).
await writeFile(path.join(OUT, "logos.json"), JSON.stringify(manifest, null, 2) + "\n");

console.log(`\n  ${manifest.length} of ${JOBS.length} written to ${path.relative(process.cwd(), OUT)}`);
