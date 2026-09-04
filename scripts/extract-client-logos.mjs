/**
 * Cut the twenty client marks out of `LP_corrections.pptx` → public/clients.
 *
 * WHY THIS SCRIPT EXISTS
 * ----------------------
 * CLAUDE.md §21 held the client logos open for one specific reason: the only
 * copy anybody had was `image14.png` in `LP contents.pptx`, a single flattened
 * grid that could not be cut into marks anyone would be entitled to ship. The
 * corrections deck supplies a different picture — slide 9's `image7.png`, a
 * clean 5 × 4 grid of twenty marks, each centred on its own white card with an
 * even gutter between them. That one *is* cuttable, and the owner has asked for
 * the logos, which is the decision §21 was waiting on. This is the same
 * arrangement `extract-media-logos.mjs` already ships for the nine media
 * outlets.
 *
 * The marks are the organisations' own. Nothing here redraws, recolours or
 * re-letters one — it cuts, trims the card's white, and scales to 96px tall,
 * which is exactly what the media script does and the reason both are safe.
 *
 * WHAT IT WRITES
 * --------------
 *   public/clients/<slug>.webp   one mark per organisation, 96px tall
 *   public/clients/logos.json    the same list with each file's real pixels
 *
 * It prints the width/height pairs to paste into `refCorpMarquee` in
 * `src/lib/reference-content.ts`, so the strip can reserve each pill's exact
 * box before anything loads. Re-run it if the deck changes.
 *
 *   node scripts/extract-client-logos.mjs
 *
 * A build-time script. `sharp` is a devDependency and none of this reaches the
 * client bundle.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";

import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DECK = path.join(root, "LP_corrections.pptx");
const OUT = path.join(root, "public", "clients");

/** The grid picture on slide 9. Five across, four down, reading order. */
const GRID_ENTRY = "ppt/media/image7.png";
const COLS = 5;
const ROWS = 4;

/**
 * Reading order, left to right and top to bottom, read off the picture itself.
 * `name` is what a screen reader gets and what the pill falls back to if a file
 * is ever missing — so it is the organisation's name, not the file's.
 */
const NAMES = [
  "McKinsey & Company",
  "Siemens Gamesa",
  "Daimler India",
  "TVS",
  "TVS Electronics",
  "Bosch",
  "Ashok Leyland",
  "Titan",
  "ITC Limited",
  "Amara Raja",
  "Renault Nissan",
  "FLSmidth",
  "Tamil Nadu Police",
  "HP India",
  "Tata Tea",
  "Samsung",
  "Saint-Gobain",
  "Aditya Birla Group",
  "The Federal",
  "Rane",
];

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/* ---- the deck is a zip; read one entry out of it -------------------------- */

function zipEntries(b) {
  const out = new Map();
  for (let i = b.length - 22; i >= 0; i -= 1) {
    if (b.readUInt32LE(i) !== 0x06054b50) continue;
    const count = b.readUInt16LE(i + 10);
    let p = b.readUInt32LE(i + 16);
    for (let n = 0; n < count; n += 1) {
      const nlen = b.readUInt16LE(p + 28);
      const elen = b.readUInt16LE(p + 30);
      const clen = b.readUInt16LE(p + 32);
      out.set(b.toString("utf8", p + 46, p + 46 + nlen), {
        off: b.readUInt32LE(p + 42),
        method: b.readUInt16LE(p + 10),
        csize: b.readUInt32LE(p + 20),
      });
      p += 46 + nlen + elen + clen;
    }
    break;
  }
  return out;
}

function readEntry(b, e) {
  const nlen = b.readUInt16LE(e.off + 26);
  const elen = b.readUInt16LE(e.off + 28);
  const start = e.off + 30 + nlen + elen;
  const raw = b.subarray(start, start + e.csize);
  return e.method === 0 ? raw : inflateRawSync(raw);
}

/* ---- where the cells actually are ----------------------------------------- */

/**
 * The grid is NOT on an even pitch — the four rows of marks sit at 52–175,
 * 232–378, 418–574 and 626–785 of an 887px picture, so slicing it into four
 * equal bands puts a slice of the row below into the bottom of every cell.
 * Cutting a logo with somebody else's logo still in it would misrepresent both,
 * so the gutters are measured instead of assumed.
 *
 * Ink projected onto one axis: count the pixels darker than `INK` in each row
 * (or column), and the runs of non-zero counts are the bands of marks. Runs
 * closer together than `mergeGap` are one band — a wordmark under a symbol
 * leaves a blank line between them that is not a gutter.
 */
function bands(profile, { mergeGap, minRun }) {
  const out = [];
  let start = -1;
  for (let i = 0; i <= profile.length; i += 1) {
    const on = i < profile.length && profile[i] > 2;
    if (on && start < 0) start = i;
    if (!on && start >= 0) {
      const last = out[out.length - 1];
      if (last && start - last[1] <= mergeGap) last[1] = i - 1;
      else out.push([start, i - 1]);
      start = -1;
    }
  }
  return out.filter(([a, b]) => b - a >= minRun);
}

/** Anything darker than this is a mark rather than card. */
const INK = 235;

/* ---- cut ------------------------------------------------------------------ */

const deck = readFileSync(DECK);
const entries = zipEntries(deck);
const gridEntry = entries.get(GRID_ENTRY);
if (!gridEntry) {
  throw new Error(`${GRID_ENTRY} is not in ${path.basename(DECK)} — has the deck changed?`);
}

const grid = readEntry(deck, gridEntry);
const { data, info } = await sharp(grid).removeAlpha().greyscale().raw().toBuffer({
  resolveWithObject: true,
});
const { width: W, height: H } = info;

const rowInk = new Array(H).fill(0);
const colInk = new Array(W).fill(0);
for (let y = 0; y < H; y += 1) {
  for (let x = 0; x < W; x += 1) {
    if (data[y * W + x] < INK) {
      rowInk[y] += 1;
      colInk[x] += 1;
    }
  }
}

/* The gutters are ~40px vertically and ~70px horizontally; the blank lines
   inside a single mark are much smaller than either. */
const rowBands = bands(rowInk, { mergeGap: 30, minRun: 20 });
const colBands = bands(colInk, { mergeGap: 55, minRun: 20 });

if (rowBands.length !== ROWS || colBands.length !== COLS) {
  throw new Error(
    `Expected a ${COLS} × ${ROWS} grid, measured ${colBands.length} × ${rowBands.length}. ` +
      "The deck's picture has changed — check slide 9 before trusting this script.",
  );
}

mkdirSync(OUT, { recursive: true });
const manifest = [];

/** A little air around each mark, so nothing is shaved by a pixel of rounding. */
const PAD = 3;

for (let i = 0; i < NAMES.length; i += 1) {
  const [x0, x1] = colBands[i % COLS];
  const [y0, y1] = rowBands[Math.floor(i / COLS)];
  const name = NAMES[i];
  const file = `${slug(name)}.webp`;

  const left = Math.max(0, x0 - PAD);
  const top = Math.max(0, y0 - PAD);

  /* Two pipelines, not one, and this is the whole reason: sharp applies `trim`
     BEFORE a pre-resize `extract`, so chaining them would trim the outer white
     off the *grid* first and then cut at coordinates measured against the
     untrimmed picture — which lands out of bounds on the right-hand column and
     silently off-register on the rest. Cut first, hand the result to a fresh
     pipeline, then trim. */
  const cell = await sharp(grid)
    .extract({
      left,
      top,
      width: Math.min(W - left, x1 - x0 + PAD * 2),
      height: Math.min(H - top, y1 - y0 + PAD * 2),
    })
    .toBuffer();

  /* Trimmed as well as measured: the band is the union across its whole row or
     column, so a narrow mark sitting in a wide column still carries the other
     four marks' margins until `trim` takes them off. That is what makes every
     mark the same optical size in the strip rather than the same box size — a
     wide wordmark and a square badge only look right together once the padding
     is gone. `threshold` is generous because the cards are #f7f7f8-ish rather
     than pure white. */
  const cut = await sharp(cell)
    .trim({ threshold: 18 })
    .resize({ height: 96, fit: "inside", withoutEnlargement: false })
    .webp({ quality: 92 })
    .toBuffer();

  const out = await sharp(cut).metadata();
  writeFileSync(path.join(OUT, file), cut);
  manifest.push({ name, src: `/clients/${file}`, width: out.width, height: out.height });
  console.log(`${file.padEnd(24)} ${String(out.width).padStart(4)} × ${out.height}`);
}

writeFileSync(path.join(OUT, "logos.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`\nWrote ${manifest.length} marks to public/clients.`);
console.log("Paste into refCorpMarquee.items in src/lib/reference-content.ts:\n");
for (const m of manifest) {
  console.log(
    `    { name: ${JSON.stringify(m.name)}, src: ${JSON.stringify(m.src)}, width: ${m.width}, height: ${m.height} },`,
  );
}
