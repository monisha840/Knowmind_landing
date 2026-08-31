/**
 * Remove the audio track from an MP4, without re-encoding the video.
 *
 * Run with:  npm run video
 *
 * Why this exists rather than a line of ffmpeg: there is no ffmpeg in this
 * project and adding one — as a binary dependency or an npm wrapper around a
 * 70 MB download — to delete one track from one ten-second file is a poor
 * trade (CLAUDE.md §2.2). This is dependency-free Node that rewrites the
 * container and copies the video samples through byte for byte. The H.264
 * stream is never touched, so nothing about how Kaleeswaran looks can change.
 *
 * What it does, in order:
 *
 *   1. Reads the video track's sample table — `stsz` (sample sizes), `stsc`
 *      (which samples live in which chunk) and `stco` (where each chunk starts).
 *   2. Copies only those chunks into a new `mdat`, dropping the interleaved
 *      audio samples entirely. This is what makes the file smaller; simply
 *      deleting the audio `trak` would leave its bytes stranded in `mdat`.
 *   3. Rebuilds `moov` without the audio `trak` and rewrites `stco` to the
 *      chunks' new positions. Chunk offsets are absolute file offsets, so
 *      every one of them moves when `moov` changes size — getting this wrong
 *      produces a file that looks valid and plays as garbage.
 *
 * It also drops the top-level `uuid` box, which holds a C2PA content-
 * credentials manifest. That manifest is a signature over the original bytes.
 * We are changing the bytes and cannot re-sign, so carrying it forward would
 * assert a provenance claim that no longer describes the file — every
 * validator would read that as tampering. Removing it says "no provenance
 * data", which is true. The source file keeps its manifest intact.
 *
 * Safe to re-run: it reads the source and overwrites the output.
 */
import { readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";

const SOURCE = path.resolve(process.cwd(), "video_kalee.mp4");
const DEST = path.resolve(process.cwd(), "public/kalee/kalee-intro.mp4");

/* -------------------------------------------------------------------------- */
/*  Box walking                                                                */
/* -------------------------------------------------------------------------- */

/** Boxes that hold other boxes rather than a payload. */
const CONTAINERS = new Set(["moov", "trak", "mdia", "minf", "stbl", "edts", "udta"]);

/**
 * @param {Buffer} buf
 * @param {number} start
 * @param {number} end
 * @returns {Array<{type: string, start: number, end: number, body: number, children: any[]}>}
 */
function parse(buf, start, end) {
  const boxes = [];
  let off = start;

  while (off + 8 <= end) {
    let size = buf.readUInt32BE(off);
    const type = buf.toString("latin1", off + 4, off + 8);
    let header = 8;

    if (size === 1) {
      size = Number(buf.readBigUInt64BE(off + 8));
      header = 16;
    } else if (size === 0) {
      size = end - off;
    }
    if (size < header || off + size > end) {
      throw new Error(`malformed box "${type}" at ${off}`);
    }

    boxes.push({
      type,
      start: off,
      end: off + size,
      body: off + header,
      children: CONTAINERS.has(type) ? parse(buf, off + header, off + size) : [],
    });
    off += size;
  }

  return boxes;
}

const find = (boxes, type) => boxes.find((b) => b.type === type);

/** Depth-first lookup down a path of box types, e.g. mdia/minf/stbl. */
function dig(box, ...types) {
  let node = box;
  for (const type of types) {
    node = find(node.children, type);
    if (!node) return null;
  }
  return node;
}

/** The four-character handler of a track: `vide`, `soun`, … */
const handlerOf = (trak, buf) => {
  const hdlr = dig(trak, "mdia", "hdlr");
  return hdlr ? buf.toString("latin1", hdlr.body + 8, hdlr.body + 12) : "";
};

/* -------------------------------------------------------------------------- */

const buf = readFileSync(SOURCE);
const top = parse(buf, 0, buf.length);

const ftyp = find(top, "ftyp");
const moov = find(top, "moov");
const mdat = find(top, "mdat");
if (!ftyp || !moov || !mdat) throw new Error("not a plain MP4: missing ftyp/moov/mdat");

const traks = moov.children.filter((b) => b.type === "trak");
const video = traks.find((t) => handlerOf(t, buf) === "vide");
const audio = traks.filter((t) => handlerOf(t, buf) !== "vide");
if (!video) throw new Error("no video track");

if (audio.length === 0) {
  console.log("  no audio track — nothing to strip.");
}

/* -- where the video's bytes actually live --------------------------------- */

const stbl = dig(video, "mdia", "minf", "stbl");
const stsz = find(stbl.children, "stsz");
const stsc = find(stbl.children, "stsc");
const stco = find(stbl.children, "stco");
const co64 = find(stbl.children, "co64");
if (!stsz || !stsc || !(stco || co64)) throw new Error("video track has no sample table");
if (co64) throw new Error("64-bit chunk offsets are not handled — this file does not use them");

// stsz: [version+flags][uniform size][count][size × count]
const uniform = buf.readUInt32BE(stsz.body + 4);
const sampleCount = buf.readUInt32BE(stsz.body + 8);
const sampleSize = (i) => (uniform !== 0 ? uniform : buf.readUInt32BE(stsz.body + 12 + i * 4));

// stsc: [version+flags][count][firstChunk, samplesPerChunk, descId] × count
const stscCount = buf.readUInt32BE(stsc.body + 4);
const runs = Array.from({ length: stscCount }, (_, i) => ({
  firstChunk: buf.readUInt32BE(stsc.body + 8 + i * 12),
  perChunk: buf.readUInt32BE(stsc.body + 12 + i * 12),
}));

// stco: [version+flags][count][offset × count]
const chunkCount = buf.readUInt32BE(stco.body + 4);
const chunkOffset = (i) => buf.readUInt32BE(stco.body + 8 + i * 4);

/** How many samples chunk `i` (1-based) holds, per the stsc run table. */
function samplesInChunk(chunk) {
  let per = runs[0].perChunk;
  for (const run of runs) {
    if (run.firstChunk <= chunk) per = run.perChunk;
    else break;
  }
  return per;
}

// Walk the chunks in order, accumulating each one's byte length from its
// samples. Sizes come from stsz rather than from the gap to the next chunk
// offset — the gap includes whatever audio was interleaved between them.
const chunks = [];
let sample = 0;
for (let c = 1; c <= chunkCount; c++) {
  const n = samplesInChunk(c);
  let bytes = 0;
  for (let s = 0; s < n; s++) {
    if (sample >= sampleCount) break;
    bytes += sampleSize(sample);
    sample += 1;
  }
  chunks.push({ from: chunkOffset(c - 1), bytes });
}
if (sample !== sampleCount) {
  throw new Error(`sample table disagrees: walked ${sample} of ${sampleCount}`);
}

const videoBytes = chunks.reduce((a, c) => a + c.bytes, 0);

/* -- rebuild moov without the audio tracks --------------------------------- */

const keep = moov.children.filter((b) => !audio.includes(b));
const moovBody = Buffer.concat(keep.map((b) => buf.subarray(b.start, b.end)));

const moovOut = Buffer.alloc(8 + moovBody.length);
moovOut.writeUInt32BE(moovOut.length, 0);
moovOut.write("moov", 4, "latin1");
moovBody.copy(moovOut, 8);

// Where stco's offset array now sits inside the rebuilt moov. Found by
// re-parsing rather than by adding up how far everything moved: the arithmetic
// version is a handful of off-by-ones waiting to happen, and a chunk table
// written one field adrift produces a file that plays as noise.
const rebuilt = parse(moovOut, 8, moovOut.length);
const rebuiltVideo = rebuilt
  .filter((b) => b.type === "trak")
  .find((t) => handlerOf(t, moovOut) === "vide");
const stcoArrayInMoov = dig(rebuiltVideo, "mdia", "minf", "stbl", "stco").body + 8;

/* -- lay the file out and fill in the new chunk offsets -------------------- */

// ftyp + moov + mdat. The C2PA `uuid` box and the `free` padding are dropped —
// see the note at the top of this file.
const mdatStart = (ftyp.end - ftyp.start) + moovOut.length;
const mdatPayload = mdatStart + 8;

const mdatOut = Buffer.alloc(8 + videoBytes);
mdatOut.writeUInt32BE(mdatOut.length, 0);
mdatOut.write("mdat", 4, "latin1");

let write = 8;
chunks.forEach((chunk, i) => {
  buf.copy(mdatOut, write, chunk.from, chunk.from + chunk.bytes);
  moovOut.writeUInt32BE(mdatPayload + write - 8, stcoArrayInMoov + i * 4);
  write += chunk.bytes;
});

const out = Buffer.concat([buf.subarray(ftyp.start, ftyp.end), moovOut, mdatOut]);

/* -- verify before writing ------------------------------------------------- */

// Re-parse the result and confirm it says what we think it says. A corrupt MP4
// is perfectly capable of looking fine until someone opens the page.
const check = parse(out, 0, out.length);
const checkMoov = find(check, "moov");
const checkTraks = checkMoov.children.filter((b) => b.type === "trak");
if (checkTraks.length !== 1) throw new Error(`expected 1 track, got ${checkTraks.length}`);
if (handlerOf(checkTraks[0], out) !== "vide") throw new Error("surviving track is not video");

const checkStco = dig(checkTraks[0], "mdia", "minf", "stbl", "stco");
const first = out.readUInt32BE(checkStco.body + 8);
const last = out.readUInt32BE(checkStco.body + 8 + (chunkCount - 1) * 4);
if (first !== mdatPayload) throw new Error("first chunk offset does not point at mdat");
if (last + chunks[chunkCount - 1].bytes !== out.length) {
  throw new Error("last chunk does not end at the end of the file");
}

mkdirSync(path.dirname(DEST), { recursive: true });
writeFileSync(DEST, out);

const kb = (n) => `${(n / 1024).toFixed(0)} kB`;
console.log(
  `  ok    ${path.relative(process.cwd(), DEST)}  ${chunkCount} chunks, ` +
    `${sampleCount} frames, ${audio.length} audio track(s) removed`,
);
console.log(`        ${kb(statSync(SOURCE).size)} -> ${kb(out.length)}`);
