# KnowMind Universe — 1% Better. Every Day.

Landing page for the 14-day live psychological growth journey with Kaleeswaran K.
**Batch 2 · September 14–27, 2026 · 5:30 AM – 6:15 AM · Live on Zoom · 25 participants · ₹999**

---

## Running it

```bash
npm install
cp .env.example .env.local     # then fill in the Razorpay link
npm run dev                    # http://localhost:3000
npm run build && npm start     # production
```

Stack: **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Motion · React Three Fiber**.

---

## Before you go live

### 1. Razorpay (required)

Every call-to-action reads one environment variable:

```bash
NEXT_PUBLIC_RAZORPAY_PAYMENT_LINK=https://rzp.io/l/xxxxxxxx
```

Create a Payment Link in the Razorpay dashboard for ₹999 and paste the full URL.

While it is empty the buttons **do not break** — they scroll the visitor to the
registration section instead, and a setup reminder appears there in development
only. No imaginary checkout URL is ever shipped.

### 2. Canonical URL

```bash
NEXT_PUBLIC_SITE_URL=https://www.kaleeswaran.com
```

Used for the canonical tag, `sitemap.xml`, Open Graph URLs and JSON-LD ids.

---

## Editing content

Almost all copy lives in two files — you should rarely need to touch a component:

| File | What's in it |
| --- | --- |
| `src/lib/config.ts` | Dates, time, price, seat count, contact details, Razorpay link |
| `src/lib/content.ts` | Every list on the page: the 14 days, testimonials, FAQ, bonuses, credentials, media names, client names, Tamil lines |

Change the date or price in `config.ts` and it updates the hero strip, the
pricing card, the sticky mobile bar, the share image and the structured data at
once.

### Things deliberately left as placeholders

- **Video testimonials** — `videoTestimonials` in `content.ts` has three entries
  with `src: null`. They render as clearly-labelled "coming soon" frames. Set
  `src` (and optionally `poster`) when the real recordings exist.
- **Client and media logos** — rendered as typographic wordmarks, because no
  logo files were supplied and fabricating brand marks would misrepresent them.
  Drop real SVGs into `public/logos/` and swap `renderItem` in `MediaSection`.

---

## Assets

`npm run optimize:assets` re-imports the brand assets (logo, Kaleeswaran
cut-out, training photographs) from the sibling `kalee_new` project and writes
web-ready WebP into `public/`. Point it elsewhere with `ASSET_SOURCE_DIR=…`.
It has already been run — you only need it if the source images change.

10 MB of originals compress to roughly 576 kB.

---

## How the page is built

### The narrative

One continuous story in three tonal movements, which is also the visual arc:

```
NIGHT      hero → meet Kalee → mind evolution → problem → method → 14-day journey
DAYBREAK   before/after wipe → who it's for → 5:30 AM → proof → offer
DECISION   session flow → registration → guarantee → FAQ → begin
```

The page moves from night through first light into day, because 5:30 AM is the
concrete promise the programme is built on. The registration card is the only
light-coloured card in the dark closing act, so the eye lands on it.

**There is one authority section, `MeetKaleeswaranSection` (`#meet-kaleeswaran`).**
It was consolidated from two blocks that repeated the same quote and the same
three numbers. It runs person → question → proof → credentials: portrait and his
question first, then the five numbers, his other roles, the client work, the
training photographs and the twelve credentials. Every claim appears exactly
once — if you add a number or a credential, check it is not already there.

### The 3D

`src/components/three/` — a "growth object": points travelling on nested,
slowly precessing orbits around a warm centre.

- One draw call, all motion computed in the vertex shader, no per-frame CPU work
- No lights in the scene at all (everything is additively blended and
  view-shaded), which keeps it cheap and stops it blowing out over the copy
- Warms from wine violet toward honey as you scroll — night into dawn
- Leans toward the cursor; drifts from the right of the composition to centre
  as the page advances
- Renders **only** while a section marked `data-three-window` is on screen; the
  loop is parked everywhere else
- Fewer orbits and lower DPR on phones; a CSS/SVG fallback when WebGL is absent;
  held still under `prefers-reduced-motion`

Lazy-loaded via `BackgroundMount`, so three.js never enters the initial bundle.

### Accessibility

Semantic landmarks, a skip link, real `<button>` disclosures with
`aria-expanded`/`aria-controls`, visible focus rings on all 26 tab stops,
`prefers-reduced-motion` honoured throughout, and a `<noscript>` fallback so the
scroll-reveal animations cannot leave the page blank if the bundle fails.

### SEO

Title, description, Open Graph and Twitter metadata, canonical, `robots.txt`,
`sitemap.xml`, a generated share image (`opengraph-image.tsx` — built from
`config.ts`, so it can never drift), and JSON-LD for Organization, Person,
Course and EducationEvent.

> The 4.9 / 258 Google reviews are shown on the page but are **not** marked up
> as `aggregateRating`. They belong to Kaleeswaran's practice, not to this
> course, and marking them up as course reviews would misrepresent them.

---

## Claims policy

Nothing on this page was invented. Testimonials, credentials, metrics, media
names, client names, the guarantee and the bonus values are reproduced as
supplied. Outcomes are worded "you may begin to…" rather than as promises, and
there are no countdown timers, fake scarcity or fabricated social proof. The
only scarcity stated is the real one: 25 seats.
