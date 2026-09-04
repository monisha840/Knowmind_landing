/**
 * Transcode the supplied participant testimonial recordings for the web, and
 * cut a poster frame for each.
 *
 * Run with:  VIDEO_SOURCE_DIR="/path/to/downloaded/drive/folder" npm run optimize:video
 *
 * Safe to re-run — it overwrites deterministically.
 *
 * ── Why this needs ffmpeg when `strip-audio.mjs` deliberately avoided it ────
 *
 * `strip-audio.mjs` rewrites an MP4 container by hand precisely so that this
 * project would not take on a 70 MB binary to delete one audio track from one
 * ten-second file. That reasoning still holds for that job, and that script is
 * untouched.
 *
 * This job is a different shape. The six recordings arrive as raw phone
 * capture: 1080x1920 at roughly 12 Mbps, 93–110 MB each for barely a minute of
 * a person talking. Nothing that can be done at the container level touches
 * that — the bytes are in the H.264 stream itself, and getting them down means
 * decoding and re-encoding. There is no dependency-free way to do that, and
 * shipping even one of these files as-is would blow the page's entire
 * performance budget several times over (CLAUDE.md §15). `ffmpeg-static` is a
 * devDependency that ships a build-time binary: it costs the client bundle
 * exactly zero bytes, which is the axis §2.2 actually cares about, and it is
 * the same role `sharp` already plays for images.
 *
 * The poster frames are the second reason. `VideoPlayer` is poster-first by
 * contract and CLAUDE.md §14.2 requires a real one; extracting a frame from an
 * H.264 stream also needs a decoder.
 *
 * ── Where the sources come from ────────────────────────────────────────────
 *
 * The owner's Drive folder, which is the approved asset library:
 *   https://drive.google.com/drive/folders/1NPoNY-i6MwR_OkoVUYuWPF3ehlutrunN
 *
 * They are NOT committed — half a gigabyte of source capture does not belong
 * in this repository, and `media-source/` is gitignored so a copy dropped there
 * cannot be committed by accident. Point `VIDEO_SOURCE_DIR` at wherever they
 * have been downloaded instead. Each job below records the Drive file id it
 * came from, so any one of them can be fetched again without guessing:
 *
 *   curl -L "https://drive.usercontent.google.com/download?id=<id>&export=download&confirm=t" -o <name>
 *
 * ── The encode ─────────────────────────────────────────────────────────────
 *
 * 720x1280, which is the source's own 9:16 at half its linear size. The slots
 * render about 360 CSS px wide on a desktop and at most a phone's full width,
 * so 720 still covers a 2x display with something in hand; 1080 would be paying
 * for pixels no visitor can resolve.
 *
 * CRF 26 / preset slow, rather than a target bitrate: these are six different
 * rooms at six different exposures, and a fixed bitrate would starve the
 * detailed ones while wasting bytes on the flat ones. `-movflags +faststart`
 * moves `moov` to the front of the file — without it a browser must download
 * the whole thing before it can show a single frame, which defeats the point
 * of streaming it at all.
 *
 * Audio is downmixed to mono at 80 kbps. Every one of these is one person
 * speaking into a phone held at arm's length; there is no stereo image to
 * preserve, and speech at 80 kbps mono AAC is transparent.
 *
 * ── On the poster timestamps ───────────────────────────────────────────────
 *
 * Each recording burns in the speaker's name and role as a lower third for
 * roughly the first six seconds. The timestamps below are chosen inside that
 * window, at a frame where the speaker is looking at the camera — so the still
 * a visitor sees before pressing play identifies who is about to talk. They
 * were picked by eye from contact sheets, not computed; change one and look at
 * the result before trusting it.
 */
import { execFileSync } from "node:child_process";
import { mkdir, readFile, stat, unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import ffmpeg from "ffmpeg-static";
import sharp from "sharp";

const SOURCE_DIR = path.resolve(
  process.cwd(),
  process.env.VIDEO_SOURCE_DIR ?? "media-source",
);

const OUT = path.resolve(process.cwd(), "public/testimonials");

/**
 * The three recordings that fill the reference's three video slots.
 *
 * `name` and `role` are transcribed from each recording's own burned-in lower
 * third — read off the supplied asset, not authored here (CLAUDE.md §1.1). The
 * spelling is theirs, including "Coprate"; correcting somebody's own caption is
 * not this script's call.
 *
 * All six recordings in the Drive folder are built. Three of them were held
 * back until the owner asked for a six-slot band; the note at the foot of this
 * file records what each one is, and one of them still needs reading before it
 * is trusted as a talking head.
 *
 * @type {Array<{from: string, driveId: string, to: string, poster: number,
 *               name: string, role: string}>}
 */
const JOBS = [
  {
    from: "1% better Testimonial video.mp4",
    driveId: "1Cvy9BQUFsgQA9RbF_4wbkyyMb06TqHFA",
    to: "gowri-shankar",
    poster: 5.4,
    name: "Gowri shankar",
    role: "Coprate trainer , Agency owner",
  },
  {
    from: "1% better Testimonial video -3_1.mp4",
    driveId: "1UfVnCz6XrRQUmo5p_pA3vQk10jXXRR4t",
    to: "sriraynu",
    poster: 4.2,
    name: "Sriraynu",
    role: "Psychologist and School counsellor",
  },
  /* The three that used to be held back. The owner asked for all six on the
     page, so they are built now. Each `name`/`role` is transcribed from the
     recording's own burned-in lower third, the same as the first three — except
     Vinoth's, whose card carries only his name (see the note at the foot). */
  {
    from: "1% better Testimonial video -6 (2) (1).mp4",
    driveId: "1jmAhldlJ8Xy8RCt85SxFn5hzXy_kAxpV",
    to: "shahul-hameed",
    poster: 3.2,
    name: "Shahul Hameed",
    role: "Behavioural and performance development trainer",
  },
  {
    from: "1% better Testimonial video -2-_2.mp4",
    driveId: "1DpYp6tKQsoyRPeSBxFghecD1njl-bn7w",
    to: "anandh",
    /* 3s is where his lower third is up and his eyes are most open — the clip
       is shot into hard sun and he squints through most of it. */
    poster: 3.0,
    name: "Anandh",
    role: "Customer success  Tamilpreneur",
  },
  {
    from: "1% better Testimonial video -4_4.mp4",
    driveId: "1MvG_RK4JiAGGbIXDa2Py6QsdaHKiLyE8",
    to: "vinoth",
    /* Any second gives the same frame — the whole clip is one static card. */
    poster: 10,
    name: "Vinoth",
    /* His card gives a name and nothing else, so the role says what the asset
       actually is rather than asserting a job title the recording never
       claims (CLAUDE.md §1.1). */
    role: "Audio testimonial",
  },
  {
    from: "1% better Testimonial video -5.mp4",
    driveId: "1YSxs08yjjFscTmwckVhHW7Xa2GVZEmO-",
    to: "bhoopeshdhayalan",
    poster: 4.8,
    name: "Dr A Bhoopeshdhayalan",
    role: "BNYS",
  },
];

/* -------------------------------------------------------------------------- */

if (!ffmpeg) throw new Error("ffmpeg-static did not resolve a binary path");

const run = (args) => execFileSync(ffmpeg, args, { stdio: ["ignore", "ignore", "pipe"] });

const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;
const kb = (n) => `${(n / 1024).toFixed(0)} kB`;

await mkdir(OUT, { recursive: true });

let built = 0;

for (const job of JOBS) {
  const src = path.join(SOURCE_DIR, job.from);

  /** @type {import('node:fs').Stats} */
  let before;
  try {
    before = await stat(src);
  } catch {
    console.log(`  skip  ${job.from}`);
    console.log(`        not in ${SOURCE_DIR} — re-download it with the curl line above.`);
    continue;
  }

  const video = path.join(OUT, `${job.to}.mp4`);
  const poster = path.join(OUT, `${job.to}.webp`);

  run([
    "-y", "-loglevel", "error",
    "-i", src,
    // -2 keeps the height even, which H.264 requires, and keeps the source's
    // own aspect rather than asserting one.
    "-vf", "scale=720:-2",
    "-c:v", "libx264", "-profile:v", "high", "-level", "4.0",
    "-preset", "slow", "-crf", "26",
    // Chroma subsampling every decoder can handle. Phone capture is already
    // 4:2:0; naming it explicitly stops ffmpeg picking something exotic if a
    // future source is not.
    "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-ac", "1", "-b:a", "80k",
    "-movflags", "+faststart",
    // The recordings carry a rotation matrix rather than rotated pixels. This
    // bakes the display orientation into the output so nothing depends on a
    // player honouring the flag.
    "-metadata:s:v", "rotate=0",
    video,
  ]);

  // The poster goes out through sharp rather than ffmpeg's own WebP encoder so
  // that every still on this site is encoded by one library at one quality —
  // `optimize-assets.mjs` writes the rest of them.
  const tmp = path.join(os.tmpdir(), `poster-${job.to}-${process.pid}.png`);
  run([
    "-y", "-loglevel", "error",
    "-ss", String(job.poster),
    "-i", src,
    "-frames:v", "1",
    "-vf", "scale=720:-2",
    tmp,
  ]);
  await sharp(await readFile(tmp)).webp({ quality: 80 }).toFile(poster);
  await unlink(tmp);

  const after = await stat(video);
  const posterStat = await stat(poster);

  console.log(`  ok    testimonials/${job.to}.mp4   ${mb(before.size)} -> ${mb(after.size)}`);
  console.log(`        testimonials/${job.to}.webp  poster at ${job.poster}s, ${kb(posterStat.size)}`);
  built += 1;
}

console.log(`\n  ${built} of ${JOBS.length} built into ${path.relative(process.cwd(), OUT)}`);

/* -------------------------------------------------------------------------- */
/*  Band 3 — the VSL                                                          */
/*                                                                            */
/*  Kaleeswaran to camera, 1:08. It arrived as `updated_video.MP4` in the      */
/*  project root rather than through the Drive folder, so it is read from      */
/*  there — replacing an earlier, shorter recording under the same name        */
/*  `VSL_video.mp4` used to have.                                              */
/*                                                                            */
/*  Re-encoded, unlike that earlier file: this one is raw phone capture,       */
/*  2688x1512 at ~16.5 Mbps, 142 MB for 68 seconds — the same shape as the      */
/*  testimonial sources above, and it gets the same treatment. Scaled to       */
/*  960x540 (its own 16:9, halved), which still covers the ~800px frame        */
/*  `VSLSection` renders at on a phone-class display, and audio downmixed to   */
/*  mono — one person talking, no stereo image to preserve.                    */
/*                                                                            */
/*  `-movflags +faststart` still applies: a browser must not need the whole     */
/*  file before it can show a frame, on the one band the page labels "Watch    */
/*  this first".                                                              */
/* -------------------------------------------------------------------------- */

const VSL_SRC = path.resolve(process.cwd(), "updated_video.MP4");
const VSL_DIR = path.resolve(process.cwd(), "public/kalee");
/** Standing at rest, looking at camera, before the first gesture — the caption
    burned in at this point ("What is 1% better every day?") also works as a
    teaser under a still poster. */
const VSL_POSTER_AT = 0.5;

try {
  const before = await stat(VSL_SRC);
  await mkdir(VSL_DIR, { recursive: true });

  const video = path.join(VSL_DIR, "vsl.mp4");
  const poster = path.join(VSL_DIR, "vsl-poster.webp");

  run([
    "-y", "-loglevel", "error",
    "-i", VSL_SRC,
    "-vf", "scale=960:-2",
    "-c:v", "libx264", "-profile:v", "high", "-level", "4.0",
    "-preset", "slow", "-crf", "26",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-ac", "1", "-b:a", "80k",
    "-movflags", "+faststart",
    "-metadata:s:v", "rotate=0",
    video,
  ]);

  const tmp = path.join(os.tmpdir(), `poster-vsl-${process.pid}.png`);
  run([
    "-y", "-loglevel", "error",
    "-ss", String(VSL_POSTER_AT),
    "-i", VSL_SRC,
    "-frames:v", "1",
    "-vf", "scale=960:-2",
    tmp,
  ]);
  await sharp(await readFile(tmp)).webp({ quality: 82 }).toFile(poster);
  await unlink(tmp);

  const after = await stat(video);
  const posterStat = await stat(poster);
  console.log(`\n  ok    kalee/vsl.mp4          ${mb(before.size)} -> ${mb(after.size)}`);
  console.log(`        kalee/vsl-poster.webp  frame at ${VSL_POSTER_AT}s, ${kb(posterStat.size)}`);
} catch (err) {
  if (err && err.code === "ENOENT") {
    console.log("\n  skip  updated_video.MP4 is not in the project root — band 3 keeps its placeholder.");
  } else {
    throw err;
  }
}

/*
 * ── The three recordings in the Drive folder that are NOT built ─────────────
 *
 * Not a quality judgement dressed up as a technical one — the reference design
 * frames exactly three video slots (band 12), so three is what there is room
 * for without changing the band. Adding a fourth means a second row, which is a
 * design decision and the owner's to make. If it is made, these are the files:
 *
 *   "1% better Testimonial video -4_4.mp4"      1MvG_RK4JiAGGbIXDa2Py6QsdaHKiLyE8
 *       Vinoth, IT professional. 1:24, and the only one of the six that is
 *       already compressed (4.7 MB). It is audio over a static black name card
 *       — there is no footage of him — so it would read as a broken video in a
 *       grid of three talking heads. It belongs in an audio treatment, not this
 *       one.
 *
 *   "1% better Testimonial video -2-_2.mp4"     1DpYp6tKQsoyRPeSBxFghecD1njl-bn7w
 *       Anandh, Customer success / Tamilpreneur. 1:03. Shot into hard midday
 *       sun; he is squinting for most of it and there is no frame in the
 *       name-card window that makes a good poster.
 *
 *   "1% better Testimonial video -6 (2) (1).mp4"  1jmAhldlJ8Xy8RCt85SxFn5hzXy_kAxpV
 *       Shahul Hameed, Behavioural and performance development trainer. 1:14.
 *       Well lit and well framed — the strongest of the three held back, and
 *       the one to use first if a fourth slot is ever wanted.
 */
