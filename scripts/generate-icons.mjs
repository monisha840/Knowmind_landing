/**
 * Favicon / app-icon generation.
 *
 * Single source of truth:  public/knowmind_logo.png  (the official KnowMind
 * infinity mark — never redrawn, recoloured or re-lettered here).
 *
 * The mark is 2:1, so every output is produced the same way: trim the
 * transparent margin the export carries, scale the mark to the full width of a
 * square canvas, and centre it vertically. Aspect ratio is preserved exactly —
 * nothing is stretched, cropped or re-coloured.
 *
 * Run with:  npm run icons
 * Safe to re-run — it overwrites deterministically.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, "public/knowmind_logo.png");

/** Home-screen icons sit on brand paper: both loops stay legible, and iOS
 *  flattens transparency onto black otherwise. */
const PAPER = { r: 251, g: 247, b: 242, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/**
 * The mark, centred on a square canvas of `size`.
 *
 * @param {number} size
 * @param {{ background?: {r:number,g:number,b:number,alpha:number}, inset?: number }} [opts]
 *   `inset` is the fraction of the canvas left clear on each side. Browser tabs
 *   render at 16–32 px, where any padding costs real silhouette, so it stays 0
 *   there and is only used where the icon gets a background plate.
 */
async function square(size, { background = TRANSPARENT, inset = 0 } = {}) {
  const markWidth = Math.round(size * (1 - inset * 2));

  const mark = await sharp(SOURCE)
    .trim() // drop the transparent export margin
    .resize({ width: markWidth, fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: mark, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Pack PNG buffers into a multi-resolution .ico.
 *
 * ICO allows a raw PNG payload per entry (supported by every browser that
 * still reads .ico), so no BMP re-encoding is needed.
 *
 * @param {Array<{ size: number, data: Buffer }>} images
 */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  const directory = Buffer.alloc(16 * images.length);
  let offset = header.length + directory.length;

  images.forEach((image, i) => {
    const at = i * 16;
    directory.writeUInt8(image.size >= 256 ? 0 : image.size, at + 0); // width
    directory.writeUInt8(image.size >= 256 ? 0 : image.size, at + 1); // height
    directory.writeUInt8(0, at + 2); // palette size
    directory.writeUInt8(0, at + 3); // reserved
    directory.writeUInt16LE(1, at + 4); // colour planes
    directory.writeUInt16LE(32, at + 6); // bits per pixel
    directory.writeUInt32LE(image.data.length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += image.data.length;
  });

  return Buffer.concat([header, directory, ...images.map((i) => i.data)]);
}

/* -------------------------------------------------------------------------- */

await mkdir(path.join(ROOT, "public/icons"), { recursive: true });

/** @type {Array<{ to: string, buffer: Buffer }>} */
const outputs = [];

// ---- Browser tab / bookmark: transparent, no padding ----
const ico = buildIco(
  await Promise.all(
    [16, 32, 48].map(async (size) => ({ size, data: await square(size) })),
  ),
);
outputs.push({ to: "src/app/favicon.ico", buffer: ico });

// ---- App Router file conventions ----
// 192 is ample for tabs, bookmarks and search results; the manifest carries
// the 512 that home screens ask for.
outputs.push({ to: "src/app/icon.png", buffer: await square(192) });
outputs.push({
  to: "src/app/apple-icon.png",
  buffer: await square(180, { background: PAPER, inset: 0.1 }),
});

// ---- Web manifest ----
for (const size of [192, 512]) {
  outputs.push({
    to: `public/icons/icon-${size}.png`,
    buffer: await square(size, { background: PAPER, inset: 0.08 }),
  });
}

for (const { to, buffer } of outputs) {
  const dest = path.join(ROOT, to);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, buffer);
  console.log(`  ok    ${to.padEnd(30)} ${(buffer.length / 1024).toFixed(1)} kB`);
}

console.log(`\n${outputs.length} icons written from public/knowmind_logo.png.`);
