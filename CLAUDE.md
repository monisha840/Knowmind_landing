@AGENTS.md

# CLAUDE.md — KnowMind Universe Landing Page

**This file is the project constitution.** Every AI agent and every human
working on this repository follows it. It is simultaneously the engineering
rulebook, the design-system guide, the performance / accessibility / SEO
standard, the conversion standard, the QA checklist and the AI-agent operating
manual.

If a later instruction conflicts with this file, follow this file — unless that
instruction *explicitly* overrides the specific rule. When you take an
intentional exception, say so in your final report, with the reason.

Everything below was verified against the actual repository. Anything not
verified is marked **TODO / NEEDS CONFIRMATION**. Never resolve a TODO by
inventing an answer.

---

## 0 · The operating protocol

### 0.1 Read before modifying

Before touching a single line:

1. Read this file.
2. Read the code you are about to change **and every file that imports it**.
3. Identify the user flow(s) affected.
4. Identify every component affected. A change to `CTAButton` touches six files
   and seven call sites; a change to `Reveal` touches nearly every section.
5. Identify responsive, performance and accessibility implications.
6. Implement the **smallest safe change**.
7. Validate (§20).
8. Report what changed and what you actually tested (§23).

Never edit blindly. Never guess at a file's contents — open it.

### 0.2 Order of work

```
ANALYSE → PLAN → IMPLEMENT → TEST → FIX → RE-TEST → REPORT
```

### 0.3 Do not break what works

For any existing feature, understand the whole chain before altering it:

```
INPUT → PROCESSING → OUTPUT → USER FEEDBACK
```

Preserve, unless the task explicitly requires changing them: routes, anchor
IDs, the CTA destination contract, `src/lib/content.ts` copy, `src/lib/config.ts`
facts, JSON-LD claims, responsive behaviour, the 3D fallback chain, and
reduced-motion handling.

**Never replace working code because another implementation looks cleaner.**

### 0.4 No fake implementation

Never ship anything that pretends to work. Specifically banned:

- Fake payment success or fake checkout confirmation
- Fake form submission, or a form that posts nowhere
- Fake API responses, or mock data presented as real
- Fake testimonials, reviews, ratings, customer counts, logos, credentials
- Fake scarcity, countdown timers, "N people viewing right now"
- Fake loading progress, fake analytics

When an integration does not exist, build an **honest integration boundary**.
This repository already does that correctly in three places — copy the pattern:

| Missing thing | Honest boundary already in place |
| --- | --- |
| Razorpay checkout URL | `RAZORPAY_PAYMENT_LINK` empty → every CTA falls back to `#register` (`src/lib/config.ts`) |
| Video testimonials | `src: null` → a dashed "Coming soon" placeholder, not a stock clip (`content.ts`, `Testimonials.tsx`) |
| Client / media logo files | Typographic wordmarks, because fabricating brand logos would misrepresent them (`MediaSection.tsx`) |

### 0.5 Scope discipline

"Fix the testimonial section" does **not** license redesigning the navbar, hero,
pricing or footer. Keep the diff proportional to the request. No drive-by
refactors, no reformatting untouched files, no renaming for taste.

### 0.6 When requirements are ambiguous

Do not invent business requirements. If a decision materially affects payment,
pricing, dates, legal or psychological claims, user data, security, branding or
backend behaviour — ask, or state the assumption explicitly and loudly in the
report. Everything else: make the sensible call and mention it.

### 0.7 Concurrency warning

Multiple agents may be working in this repository at the same time, and there is
**no version-control safety net** (§19). Re-read a file immediately before
editing it — it may have changed since you last saw it. Never revert or
overwrite work you did not author.

The **rules** in this file are stable. The **inventories** — the repository map
(§3), the anchor table (§3.1), the CTA inventory (§7.2), the SEO surface (§16)
and the known-gaps table (§21) — are snapshots. Verify one against the actual
files before relying on it, and if you find it stale because of your own or
another agent's work, update it as part of your change. A constitution that
describes a repository that no longer exists is worse than none.

---

## 1 · Product truth

A **single-page marketing landing page** for one live program.

| Fact | Value | Single source of truth |
| --- | --- | --- |
| Brand | KnowMind Universe | `siteConfig.name` |
| Tagline | Know Within. Grow Beyond. | `siteConfig.tagline` |
| Program | 1% Better. Every Day. | `siteConfig.program` |
| Subtitle | 14-Day Live Psychological Growth Journey | `siteConfig.programSubtitle` |
| Batch | Batch 2 | `siteConfig.batch` |
| Dates | September 14–27, 2026 | `programDetails.dateLabel` |
| Time | 5:30 AM – 6:15 AM (45 min) | `programDetails.timeLabel` |
| Platform | Live on Zoom | `programDetails.platform` |
| Language | Tamil + English (natural Tanglish) | `programDetails.language` |
| Cohort | 25 participants | `programDetails.seats` |
| Founding price | ₹999 | `programDetails.price` |
| Next batch price | ₹1,999 | `programDetails.nextBatchPrice` |
| Instructor | Kaleeswaran K, Counselling Psychologist | `kalee` in `content.ts` |
| Website | www.kaleeswaran.com | `siteConfig.contact` |
| Phone | +91 9688440032 | `siteConfig.contact` |
| Email | kaleesemail@gmail.com | `siteConfig.contact` |

**Core concept:** Awareness → Reflection → Action → Repetition → 1% Better.

### 1.1 Content is data, and data is law

`src/lib/config.ts` and `src/lib/content.ts` are the **only** places program
facts, copy blocks, testimonials, credentials, metrics, FAQ items and navigation
live.

- Never hardcode a price, date, time, seat count or contact detail into JSX.
  Import it.
- Never invent, embellish or "improve" a testimonial, credential, statistic,
  media appearance, client name, guarantee condition or program claim. The
  header comment in `content.ts` states these are reproduced exactly as supplied.
- New marketing claims require explicit human approval. Adding one silently is
  the single most damaging thing an agent can do to this project.
- Use `inr()` / `formatINR()` for money. Never write `₹999` as a literal — the
  helper carries both Indian digit grouping and the single source of truth.
- Tamil lives under `tamil` in `content.ts`. Any element rendering Tamil must
  carry `lang="ta"`, which switches it to Noto Sans Tamil with the correct
  leading (see `globals.css`). Never machine-translate or alter Tamil copy.
- Contact details are fixed. Do not change them without instruction.

### 1.2 Honest persuasion only

The page must answer: What is this? Who is it for? What problem does it solve?
What will I get? Why should I trust you? Why now? What does it cost? What
happens after I click? What if I have questions? What if something goes wrong?

It must answer them **without dark patterns**. Real scarcity (25 seats, a real
founding price for a real batch) is stated plainly. This is a psychology brand —
manipulation is off-brand as well as unethical.

---

## 2 · Stack — verified, do not assume

| Concern | Actual |
| --- | --- |
| Framework | **Next.js 16.3.3**, App Router (`src/app`) |
| React | **19.2.8** — Server Components by default |
| Language | **TypeScript 7.0.2**, `strict: true`, `noEmit: true` |
| Styling | **Tailwind CSS v4.3.3**, CSS-first config via `@theme` in `src/app/globals.css` |
| PostCSS | `@tailwindcss/postcss` (`postcss.config.mjs`) |
| Animation | **motion 13.1.1** — import from `"motion/react"`, **not** `framer-motion` |
| 3D | **three 0.185.1** + `@react-three/fiber 9.7.0` + `@react-three/drei 10.7.8` |
| Images | `next/image`; AVIF + WebP enabled in `next.config.ts` |
| Fonts | `next/font/google` — Instrument Sans, Instrument Serif, Noto Sans Tamil |
| Asset pipeline | `sharp` (devDependency) via `scripts/optimize-assets.mjs` |
| Package manager | **npm** (`package-lock.json`) |
| Version control | **None — not a git repository** |
| ESLint | **Not configured** (no config file anywhere) |
| Prettier | **Not configured** |
| Tests | **None** — no runner, no test files |
| Analytics | **None** |
| Backend / API routes / DB / auth | **None** |

There is **no `tailwind.config.js`**. Tailwind v4 is configured entirely in CSS.
Do not create one — extend `@theme` in `globals.css` instead.

`next.config.ts` sets `reactStrictMode: true`, `devIndicators: false`,
`images.formats: ["image/avif","image/webp"]` and `transpilePackages: ["three"]`.
Do not remove `transpilePackages` — three.js ships untranspiled ESM examples.

Path alias: `@/*` → `./src/*`. Always use it; no `../../..` imports.

### 2.1 Commands — the real ones

```bash
npm run dev                # next dev
npm run build              # next build  — production build
npm start                  # next start  — serve the production build
npm run optimize:assets    # regenerate /public brand + photo assets with sharp
npm run icons              # regenerate favicon / app icons from public/knowmind_logo.png
npx tsc --noEmit           # TYPE CHECK — this is the type-check command
```

**`npm run lint` is broken.** The script runs `next lint`, which Next 16
removed. The CLI now parses `lint` as a directory argument and fails with
`Invalid project directory provided, no such directory: …\lint`.

Therefore:

- Never report "Lint: PASS". Report **`Lint: NOT AVAILABLE`** until it is fixed.
- Do not hide the problem by deleting the script or faking a pass.
- **TODO / NEEDS CONFIRMATION:** repairing this means adding ESLint 9 flat
  config (`eslint.config.mjs` + `eslint-config-next`) and repointing the script
  at `eslint .`. That installs dependencies and changes the validation gate, so
  it needs explicit human approval before an agent does it.

`npx tsc --noEmit` currently passes clean. **It is the only automated gate this
project has — keep it green.**

### 2.2 Dependency rule

Before adding any package, answer all six:

1. Does an existing dependency already do this?
2. Can a native browser or React API do this?
3. Is it genuinely necessary, or merely convenient?
4. What does it cost in bundle bytes, on a landing page whose entire purpose is
   fast first paint?
5. Is it maintained?
6. Does it introduce a security or licensing concern?

This page already ships motion + three + fiber + drei. That is a large budget
for a marketing page. **The default answer to a new dependency is no.** Adding
one without approval is a scope violation.

---

## 3 · Repository map

```
├── AGENTS.md                  # Next.js agent rules — auto-written by `next dev`. Do not hand-edit.
├── CLAUDE.md                  # this file
├── README.md                  # human-facing project overview
├── next.config.ts             # strict mode, image formats, three transpile
├── postcss.config.mjs         # tailwind v4 plugin
├── tsconfig.json              # strict, @/* alias
├── .env.example               # documents the two public env vars
├── scripts/
│   ├── optimize-assets.mjs    # sharp → public/brand, public/kalee, public/photos
│   └── generate-icons.mjs     # sharp → src/app icons + public/icons
├── public/
│   ├── brand/logo.png · logo-white.png
│   ├── icons/icon-192.png · icon-512.png      # referenced by manifest.ts
│   ├── kalee/kaleeswaran.webp
│   ├── photos/experiential-circle.webp · leadership-program.webp · experiential-activity.webp
│   ├── knowmind_logo.png      # SOURCE for generate-icons.mjs — not for page use
│   └── kaleeswaran_image.png  # SOURCE original — not for page use
└── src/
    ├── app/
    │   ├── layout.tsx          # fonts, metadata, viewport, skip-link, JSON-LD
    │   ├── page.tsx            # the ONLY route — composes every section in order
    │   ├── globals.css         # design tokens (@theme), base layer, component utilities
    │   ├── opengraph-image.tsx # build-time 1200×630 share card via next/og
    │   ├── manifest.ts · robots.ts · sitemap.ts
    │   └── favicon.ico · icon.png · apple-icon.png   # generated — see `npm run icons`
    ├── components/
    │   ├── Navbar.tsx · Footer.tsx · StickyMobileCTA.tsx
    │   ├── sections/          # one file per page section (19 files)
    │   ├── three/             # persistent background scene
    │   │   ├── BackgroundMount.tsx · Background3D.tsx · Fallback2D.tsx
    │   │   ├── GrowthObject.tsx · OrbitalField.tsx · CoreGlow.tsx
    │   │   └── knowmind/      # the scroll-driven head triptych (self-contained module)
    │   └── ui/                # Accordion · CTAButton · Marquee · MethodIcons
    │                          # Metric · Reveal · SectionHeading · TestimonialCard
    └── lib/
        ├── config.ts          # program facts, payment link, money helpers
        ├── content.ts         # ALL repeatable copy as structured data
        ├── hooks.ts           # media queries, WebGL probe, count-up, pointer, scroll
        └── schema.ts          # JSON-LD graph
```

**Source assets vs. served assets.** `kaleeswaran_image.png` (1.7 MB) and
`knowmind_logo.png` (711 kB) exist both at the repository root and in `public/`.
They are **generator inputs, not page assets** — `generate-icons.mjs` reads
`public/knowmind_logo.png`. Never point `next/image` at either of them; use the
optimized files in `public/brand/`, `public/kalee/` and `public/photos/`.
Shipping a 1.7 MB PNG to a phone is exactly the failure this page cannot afford.

The KnowMind mark is never redrawn, recoloured or re-lettered by a script or by
hand — `generate-icons.mjs` only trims, scales and centres it.

### 3.1 Routes and anchors

One route: `/`. No API routes, no middleware, no dynamic segments, no
`error.tsx`, no `not-found.tsx`, no `loading.tsx`.

Metadata routes present: `manifest.ts`, `robots.ts` (allow all + sitemap
pointer), `sitemap.ts` (the single URL), `opengraph-image.tsx`. All of them read
from `siteConfig` / `programDetails`, so they cannot drift out of sync with the
page — keep it that way rather than hardcoding values into them.

Anchor IDs are a public contract — external links, the navbar, the footer and
every CTA fallback depend on them. **Never rename or remove one without
updating every reference.**

| ID | Section | Linked from |
| --- | --- | --- |
| `#main` | `<main>` | skip link |
| `#top` | Hero | navbar wordmark |
| `#meet-kaleeswaran` | MeetKaleeswaranSection | **navLinks** |
| `#mind-evolution` | MindEvolution | — |
| `#the-problem` | ProblemSection | — |
| `#method` | CoreMethod | — |
| `#journey` | JourneyTimeline | **navLinks** |
| `#transformation` | TransformationSection | — |
| `#who-its-for` | AudienceSection | **navLinks** |
| `#why-early` | EarlyMorningSection | — |
| `#media` | MediaSection | — |
| `#testimonials` | Testimonials | **navLinks** |
| `#whats-included` | OfferSection | — |
| `#bonuses` | BonusSection | — |
| `#session-flow` | SessionFlow | — |
| `#register` | PricingSection | **footer, every CTA fallback** |
| `#why-live` | LiveOnlySection | — |
| `#guarantee` | GuaranteeSection | — |
| `#faq` | FAQSection | **navLinks** |
| `#begin` | FinalCTA | — |

`navLinks` lives in `content.ts`. If you add a nav link, the target ID must
already exist.

`html { scroll-padding-top: 6rem }` in `globals.css` keeps anchor targets clear
of the fixed navbar. Do not remove it. Sections that need extra clearance add
`scroll-mt-*` (PricingSection uses `scroll-mt-24`).

---

## 4 · Architecture rules

### 4.1 Server by default, client only where earned

These files carry **no** `"use client"` directive, and must not gain one:
`app/layout.tsx`, `app/page.tsx`, `app/opengraph-image.tsx`, `Footer.tsx`,
`sections/FAQSection.tsx`, `sections/MediaSection.tsx`, `ui/SectionHeading.tsx`,
`ui/TestimonialCard.tsx`, `ui/MethodIcons.tsx`, `three/Fallback2D.tsx`,
`three/knowmind/KnowMindFallback.tsx`.

The first eight render on the server. The last two are pure-presentational and
directive-free so they stay cheap wherever they are used — `KnowMindFallback` is
rendered inside `KnowMind3D` (a client component, so it is still server-rendered
into the initial HTML, which is what stops the section ever showing a hole);
`Fallback2D` sits behind `Background3D`, which is `ssr: false`, so it appears
only after hydration. Know which of the two you are dealing with before you
reason about first paint.

Add `"use client"` only when the file genuinely needs state, an effect, a
browser API, or a motion/R3F component. **Never** convert `page.tsx` or
`layout.tsx` into client components — that would push the whole page into the
client bundle and destroy the LCP story.

Push the client boundary as deep as possible: if only a button inside a section
is interactive, the button is the client component, not the section.

### 4.2 Data separation

Repeatable content is structured data in `content.ts`, mapped over in JSX. This
already covers `navLinks`, `struggles`, `methodStages`, `journeyDays`,
`journeyWeeks`, `beforeAfter`, `personas`, `outcomes`, `notForYou`, `kalee`,
`meetKalee`, `meetKaleeMetrics`, `secondaryRoles`, `authorityHighlights`,
`credentials`, `trainingPhotos`,
`mediaOutlets`, `clientLogos`, `testimonials`, `videoTestimonials`,
`inclusions`, `bonuses`, `sessionSteps`, `liveReasons`, `faqItems`,
`guarantee`, `tamil`.

Never duplicate a list as inline JSX. If you find yourself copy-pasting a card,
the data belongs in `content.ts` with an exported type.

Derived values are computed, never restated: `totalBonusValue` is a `reduce`
over `bonuses`. Follow that pattern — one fact, one place.

### 4.3 Component architecture

Before creating a component, **search `src/components/` first.** If it exists,
reuse or extend it. Duplicate primitives are how a design system dies.

- `src/components/ui/` — reusable primitives, no section-specific knowledge
- `src/components/sections/` — one section per file, composed in `page.tsx`
- `src/components/three/` — everything WebGL
- Section components are self-contained: their own `<section>`, own ID, own
  `aria-labelledby`, own background.

Keep components readable. Split by responsibility when a file becomes hard to
follow — but do not over-componentize trivial markup. The current largest
section files sit around 200–300 lines, which is the practical ceiling.

Named exports only (`export function Hero()`), matching the existing convention.
No default exports outside `src/app/`.

---

## 5 · Design system

All tokens live in the `@theme` block of `src/app/globals.css`. **Use tokens.
Do not invent one-off values.**

### 5.1 Brand palette

| Role | Token | Hex |
| --- | --- | --- |
| **Primary brand** | `wine` | `#5A2348` |
| **Depth** | `purple` | `#3B1C5A` |
| **Primary accent / CTA** | `honey` | `#FEB737` |
| **Secondary accent** | `gold` | `#E6B44C` |

Full ramps exist and must be used instead of arbitrary opacities where possible:
`night`, `night-2`, `wine-950…wine-300`, `purple-950…purple-400`, `honey-400`,
`honey-600`, `amber-ink`, `paper`, `paper-2`, `sand`, `sand-2`, `ink`,
`ink-muted`, `cream`, `cream-muted`, `cream-dim`.

- `honey` is not legible as text on light backgrounds. On light sections use
  **`amber-ink` (`#8A5A0A`)** — that is exactly why it exists.
- **Never introduce a new brand colour without approval.** No neon, no
  unrelated hues, no gradients outside the wine/purple/honey/gold families.

### 5.2 Typography

Three families, wired as CSS variables by `next/font`:

| Family | Token | Use |
| --- | --- | --- |
| Instrument Sans (400/500/600/700) | `--font-sans` | everything UI |
| Instrument Serif (400 + italic) | `--font-serif` | pull-quotes and emotional lines **only**, never UI |
| Noto Sans Tamil (400/500/600) | `--font-tamil` | applied automatically via `:lang(ta)` |

Fluid scale — every size already interpolates with `clamp()`:
`text-display`, `text-h1`, `text-h2`, `text-h3`, `text-lead`, `text-body`,
`text-eyebrow`.

- Use these tokens. Do not write `text-[2.75rem]` or a bespoke `clamp()`.
- Do not add font weights or families. Three families is already the ceiling for
  a page with this LCP target.
- `h1–h4` are `font-weight: 600` with `text-wrap: balance` in the base layer.

### 5.3 Spacing, radius, easing

| Token | Value | Use |
| --- | --- | --- |
| `--spacing-section` | `clamp(5rem, 2.5rem + 9vw, 9.5rem)` | vertical section rhythm — via `.section-y` |
| `--spacing-gutter` | `clamp(1.25rem, 0.5rem + 2.4vw, 2.5rem)` | horizontal page padding |
| `--radius-card` | `1.25rem` | cards — `rounded-card` |
| `--radius-pill` | `999px` | buttons, chips |
| `--ease-out-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | **the** page easing |

Layout containers (component layer):

- `.container-page` — `max-width: 78rem`, centred, gutter padding
- `.container-narrow` — `max-width: 46rem`, for long-form copy
- `.section-y` — standard vertical rhythm
- `.grain` — film-grain overlay (needs a positioned parent)
- `.rule-gold` — hairline golden divider
- `.link-underline` — animated underline for text links

**No magic values.** `margin-top: 137px` is never acceptable. If a bespoke value
is genuinely required, add a comment explaining why.

### 5.4 Tonal map

The page is art-directed as one continuous movement from night, through dawn,
into daylight — mirroring the 5:30 AM premise. `page.tsx` documents the three
movements: **Night** (hero → meet Kaleeswaran → evolution → problem → method → journey),
**Daybreak** (transformation → audience → early morning → media →
testimonials → offer → bonuses), **Decision** (session flow → pricing → live-only
→ guarantee → FAQ → final CTA).

Dark sections use `cream` / `cream-muted` / `cream-dim` text and `honey`
accents. Light sections (`paper`, `paper-2`) use `ink` / `ink-muted` text and
`amber-ink` accents. `SectionHeading`, `Eyebrow`, `Accordion`, `Marquee`,
`Metric` and `TestimonialCard` all take a `tone` prop for exactly this. **Pass
the right tone** — a mismatched tone is a contrast failure, not a style choice.

Do not reorder the sections or invert a section's tone without approval: the
night→day gradient is the page's central art direction, and the 3D background
warms in sync with scroll position.

---

## 6 · Component inventory — reuse these

| Component | Contract |
| --- | --- |
| `CTAButton` | **The only CTA.** `variant`: `primary` \| `outline` \| `ghost`. `size`: `md` \| `lg`. Optional `href`, `id`, `onClick`. Renders an `<a>`. |
| `SectionHeading` | `eyebrow`, `title`, `lead`, `tone`, `align`, `as` (`h2` \| `h3`). Already wrapped in `Reveal`. |
| `Eyebrow` | Standalone uppercase label with a rule. |
| `Accordion` | Accessible disclosure list. Real `<button>` + `aria-expanded` + `aria-controls` + labelled `region`. |
| `Reveal` / `RevealGroup` / `revealChild` | **The only scroll-reveal primitive.** One motion language for the whole page. |
| `Metric` | Count-up number, fires once in view, static under reduced motion. |
| `Marquee` | CSS marquee; degrades to a static wrapped list under reduced motion. |
| `TestimonialCard` | `<figure>` / `<blockquote>` / `<figcaption>`. Server component. |
| `MethodIcons` | Icon set for the five method stages. |
| `KnowMind3D` | Scroll-driven 3D character (§10). |
| `KnowMindFallback` | Flat stand-in, always rendered underneath the canvas. |

**Do not build a second button, a second reveal animation, a second accordion or
a second heading style.** If a variant is needed, add it to the existing
component as a prop.

---

## 7 · CTA rules

### 7.1 The destination contract

`CTAButton` resolves its destination in `src/lib/config.ts`:

```
href prop  →  else if NEXT_PUBLIC_RAZORPAY_PAYMENT_LINK is set  →  that URL (new tab)
           →  else                                              →  #register
```

External destinations automatically get `target="_blank"` +
`rel="noopener noreferrer"`. The button also emits
`data-payment-configured` for testing and analytics hooks.

**Never hardcode a payment URL anywhere.** Never invent a Razorpay link. The
link comes from the environment, and until it is set the graceful in-page
fallback is the correct, intentional behaviour — not a bug to "fix".

### 7.2 Current CTA inventory

| Location | Copy | Size |
| --- | --- | --- |
| Navbar (desktop) | Begin Your Journey | `md` |
| Navbar (mobile drawer) | Begin Your 1% Journey | `lg` |
| Hero | Begin Your 1% Journey | `lg` |
| OfferSection | I want to begin | `md` |
| PricingSection | Yes, I want to begin | `lg` |
| FinalCTA | Register now — ₹999 (from `inr()`) | `lg` |
| StickyMobileCTA | Begin | `md` |

The primary CTA concept is **"BEGIN YOUR 1% JOURNEY"**, with **"I WANT TO
BEGIN"** as the sanctioned alternative. Keep CTA language inside this family.
Do not introduce a new verb ("Enroll now", "Buy", "Get instant access") without
approval — the vocabulary is part of the brand.

### 7.3 CTA hierarchy

- **Primary** (`variant="primary"`, honey) — the conversion action. One per
  viewport, never two competing primaries side by side.
- **Secondary** (`outline`) — supporting action.
- **Tertiary** (`ghost` or a text link) — low-priority navigation.

### 7.4 No dead CTAs

Every button and link must have a real destination and a real effect. Before
completing any task that touches a CTA, **click every affected CTA** and verify
the destination, both with `NEXT_PUBLIC_RAZORPAY_PAYMENT_LINK` set and unset.
A decorative element that looks like a button is a defect.

### 7.5 Conversion-flow integrity

The chain must never have a broken link:

```
CTA → clear action → checkout or form → loading → success or failure
    → confirmation → stated next step
```

- Every stage must be reachable and must communicate its state.
- **Pricing has one source of truth.** ₹999 and ₹1,999 come from
  `programDetails`. Two sections must never disagree, and a price must never
  appear as a hardcoded string.
- The post-click promise on the page ("Zoom link and WhatsApp group access
  within 24 hours") is a commitment. Do not weaken, strengthen or restate it
  differently elsewhere.
- Social proof must be real (§1.1). Scarcity must be real (§1.2).

---

## 8 · Payment flow

Current state — document it, do not extend it silently:

```
CTA click
  → NEXT_PUBLIC_RAZORPAY_PAYMENT_LINK set?
      YES → Razorpay hosted Payment Link, new tab   (Razorpay owns the flow)
      NO  → smooth-scroll to #register              (honest fallback)
```

There is **no** server-side order creation, **no** webhook, **no** signature
verification, **no** success/failure/cancel route, and **no** post-payment
onboarding in this codebase. Fulfilment (Zoom link + WhatsApp group within
24 hours, as stated in `PricingSection`) happens outside this repository.

Rules:

- Never treat a click as a purchase. Success must come from Razorpay or a
  trusted backend, never from front-end state.
- Never build a fake success page or a fake confirmation.
- Never put a Razorpay **secret** key anywhere in this repository. A hosted
  Payment Link URL is public and safe; API keys and webhook secrets are not, and
  they never belong in a `NEXT_PUBLIC_*` variable (§18).
- Adding real checkout (order API, webhook verification, success/failure routes)
  is a **backend change requiring explicit approval**, not an agent's judgment
  call. **TODO / NEEDS CONFIRMATION.**

---

## 9 · Forms, states and error handling

### 9.1 Forms

**There is currently no form in this repository.** Registration happens on
Razorpay's hosted page.

If a form is ever added, it must have all of the following before it is
considered done:

- A real `<label>` for every field. Placeholder text is never a label.
- Required-field handling, and client-side validation for email, phone
  (Indian formats: `+91` and 10-digit local both valid), and length limits.
- Server-side validation for anything that reaches a server. Client validation
  is UX, not security.
- Explicit **loading** state, with the submit button disabled to prevent
  duplicate submission ("Submitting…").
- Explicit **success** state with a clear confirmation.
- Explicit **failure** state that explains what went wrong and offers a retry
  path. Never fail silently.
- Accessible feedback: `aria-live` for status, `aria-invalid` +
  `aria-describedby` for field errors, focus moved to the first error.
- Spam protection appropriate to the endpoint.
- Input treated as untrusted (§18).

Validation messages must say **what is wrong and how to fix it** — not just
"Invalid". Do not over-restrict legitimate input (names with spaces, accents or
Tamil characters; phone numbers with `+`, spaces or hyphens).

### 9.2 The state matrix

**Never build only the happy path.** Every asynchronous or conditional surface —
an API call, a form, a payment, a video, the 3D canvas, any dynamic content —
must have a defined answer for all five:

| State | Requirement |
| --- | --- |
| **Loading** | Something visible and space-reserving. Never a silent gap, never a layout shift when the real thing arrives. |
| **Success** | Unambiguous confirmation of what happened. |
| **Error** | Plain-language explanation plus a retry path. Never a silent failure. |
| **Empty** | An honest, designed empty state — like the "Coming soon" video placeholder — never a blank box and never invented filler. |
| **Unavailable** | The graceful degradation path: no WebGL, no payment link, no recordings. |

The existing patterns to copy: `BackgroundMount`'s space-reserving `loading`
placeholder; `KnowMindFallback` rendered underneath the canvas at all times;
`usePerformanceTier` / `useWebGLSupport` returning `null` while probing so
nothing flashes; the dashed video placeholder; the CTA's `#register` fallback.

A user must never be left wondering whether the page is working.

### 9.3 Error handling

- Catch errors at a boundary that can still render something useful.
  `CanvasBoundary` is the model: a decorative visual is never worth taking the
  page down for.
- Show the visitor a human message. Never a stack trace, an internal path, a
  raw error object or a provider error code.
- Log enough to diagnose, without logging secrets or personal data.
- Offer recovery wherever one exists: retry, reload, an alternative route, or a
  contact detail from `siteConfig.contact`.
- A failure in a non-essential subsystem (3D, analytics, a marquee) must never
  break navigation, content or the path to registration.

---

## 10 · 3D rules

3D is an **enhancement**. It must never block the page, the content, the CTAs or
the scroll. Two independent systems exist — know which one you are touching.

### 10.1 System A — persistent background

`BackgroundMount` → `Background3D` → `GrowthObject` (+ `OrbitalField`,
`CoreGlow`), with `Fallback2D` as the no-WebGL path.

- `BackgroundMount` does `dynamic(..., { ssr: false })` so three.js never enters
  the server bundle or the initial client chunk.
- Renders only while a section opted in with **`data-three-window`** is on
  screen (`IntersectionObserver`, `rootMargin: "10% 0px"`); elsewhere
  `frameloop` parks. Current opt-ins: Hero, ProblemSection, CoreMethod,
  JourneyTimeline, SessionFlow, PricingSection, FinalCTA.
- Scroll progress and a night→dawn warmth ramp are written to **refs**, so
  scrolling never triggers a React re-render.
- Mobile: `dpr` capped at 1.25 (1.75 desktop), antialias off, pointer parallax
  disabled.
- Reduced motion: `frameloop="demand"` — the object is shown, held still.

### 10.2 System B — the KnowMind head triptych

`src/components/three/knowmind/` is a self-contained module with a public
surface in `index.ts` and its own `README.md`. It is mounted by
`MindEvolution.tsx`.

Narrative: **TANGLED → UNRAVELING → CLEAR**. Three sculptural profile heads,
identical in every respect — one lofted geometry object and one material
instance, rendered three times — differing only in the state of the thread
inside each skull. They begin as three copies of the same tangle and separate
as the visitor scrolls: the left head holds at TANGLED, the middle reorganises
as far as UNRAVELING, the right resolves into a spiral. That identity is the
argument the visual makes, and nothing about the heads may be allowed to differ.

All three thread states come out of one parametric family at three degrees of
disorder (`states.ts`), so morphing is a per-point interpolation along the
strand's own length rather than one shape dissolving into another. Per-head
timing lives in `headStage()`; windows overlap so nothing ever cuts.

Its defence-in-depth chain is the standard every 3D addition must meet:

1. `useWebGL2Support()` probes for **WebGL 2** once — three.js dropped WebGL 1
   in r163, and a WebGL-1-only browser passes a naive probe and then throws
   inside the renderer constructor, asynchronously, where no error boundary can
   catch it. `null` while probing → nothing flashes.
2. `usePerformanceTier()` picks `low` / `medium` / `high` from cores, device
   memory, pointer type, viewport, and a software-rasteriser check
   (SwiftShader / llvmpipe). The probe context is explicitly released.
3. `KnowMindFallback` is **always rendered underneath** — the page never has a
   hole in it. It traces the same profile and the same three states, so the
   crossfade to the canvas has nothing to jump.
4. The canvas is `dynamic(..., { ssr: false })` and only mounts when the section
   is near (`rootMargin: "80% 0px"`), and only renders while on screen.
5. `CanvasBoundary` (an error boundary) catches a crash and hands the section
   back to the fallback.
6. `ContextGuard` catches `webglcontextlost` and does the same.
7. `AdaptiveResolution` makes a one-way DPR downgrade if the first seconds
   cannot hold ~34 fps. It never climbs back — a visitor feels a drop far more
   than they notice sharper edges.

Quality tiers (`constants.ts` → `TIERS`) scale thread control points, tube
resolution, head profile samples and slices, DPR cap, antialias and thread
update rate. **Tune these constants; do not scatter new magic numbers through
the scene.**

Shadow maps are off in every tier, and that was measured rather than assumed:
enabling them changed the frame by 0.17 of a possible 765 per pixel, because the
key strikes the thread at a shallow enough angle that its shadow falls behind
the thread itself. The depth cue that works here is free — strands really do
pass behind the skull, and the skull really does hide them. The plumbing stays
in place behind `TIERS[...].shadows`.

`KnowMind3D` sets **no `position`** of its own; it stacks its layers with an
explicit `grid-cols-1 grid-rows-1`. Give it a box with a definite height. A grid
area with no definite height collapses every percentage height beneath it, and
r3f then measures its canvas square instead of matching the box.

### 10.3 Non-negotiables for any 3D work

- The page must be fully usable with WebGL unavailable, the GPU weak, three.js
  failing to load, or the browser blocking WebGL. Test by forcing
  `useWebGLSupport` to `false`.
- 3D must never cover or block hero text, navigation, CTAs, forms or payment.
  Canvases are `pointer-events: none` and sit behind content — keep it that way.
- All meaningful content stays in HTML, outside the canvas (§13.3).
- Respect `prefers-reduced-motion` in every scene.
- Never add post-processing, shadow maps, environment maps or a second
  simultaneous canvas without a measured justification. The current scenes
  deliberately use three lights and no post-processing.
- Never drive per-frame values through React state. Use refs, read them inside
  `useFrame`.
- Always dispose geometries, materials and textures you create imperatively.
- Keep the character's palette to the brand colours in `PALETTE`.

---

## 11 · Animation rules

`motion` (v13) is the animation library. Import from `"motion/react"`.

- **`Reveal` / `RevealGroup` is the page's single scroll-reveal language.** Use
  it. Do not hand-roll another entrance animation.
- Standard easing is `[0.22, 1, 0.36, 1]` / `--ease-out-soft`. Durations sit
  between ~0.3s and ~1s. Stay in that range.
- Reveals use `viewport={{ once: true }}` — content must never re-animate or
  disappear on scroll-back.
- Animate to communicate hierarchy, progress, feedback, transformation or
  interaction. Nothing else. No bouncing, no random drift, no long delays, no
  infinite expensive loops.
- **Never hijack scroll.** No scroll-jacking libraries, no `preventDefault` on
  wheel, no forced snapping between sections.
- Never attach expensive work to a scroll event. The established pattern is:
  `{ passive: true }` listener → write to a **ref** → read once per frame in
  `useFrame` / `requestAnimationFrame`. `useScrollProgress` measures layout only
  on mount, resize, orientation change and `ResizeObserver` — never mid-scroll.
- Prefer transform and opacity. Avoid animating layout properties.

### 11.1 Reduced motion is mandatory

`globals.css` neutralises CSS animations and transitions under
`prefers-reduced-motion: reduce`, and disables smooth scrolling. That is a
backstop, not a substitute — JS-driven motion must handle it explicitly with
`usePrefersReducedMotion()`.

Existing correct behaviour to preserve: `CTAButton` drops the magnetic pull and
the tap scale; `Accordion` swaps the height animation for a fade; `Marquee`
becomes a static wrapped list (so no content is unreachable); `Metric` jumps
straight to the final number; `TransformationSection` renders both panels
stacked instead of the sticky wipe; both 3D scenes hold still.

---

## 12 · Responsive rules

**Mobile is not a smaller desktop.** Design the mobile behaviour deliberately.

Every change must be checked at: **320, 360, 375, 390, 414, 480, 768, 1024,
1280, 1440, 1920+**, in portrait and landscape.

Tailwind's default breakpoints are in use: `sm 640` · `md 768` · `lg 1024` ·
`xl 1280` · `2xl 1536`. `useIsMobile()` is `(max-width: 767px)`.

Check every time:

- No horizontal overflow — and **never** paper over it with `overflow-x: hidden`
  on a wrapper. `body { overflow-x: clip }` in `globals.css` is the last-resort
  backstop, not a licence to ship broken layouts. Find the element that is too
  wide and fix it.
- No clipped or overlapping text; no heading collisions
- Grids collapse sensibly; no fixed pixel layouts that only work at one width
- Buttons remain tappable; forms and modals remain usable
- Images and videos fit; nothing important is cropped away
- The 3D canvas neither freezes nor blocks scroll
- Sticky elements do not cover content (§12.2)
- No unexpected blank space or excessive whitespace

Use fluid layout: the `clamp()` type scale, `container-page` / `container-narrow`,
flexbox and CSS grid. Avoid gratuitous absolute positioning — it is fine when
intentional and responsive (the depth washes behind hero copy are a good
example), not as a layout strategy.

**Never** write device-width JavaScript branches (`if (width === 390)`). Use CSS
breakpoints, fluid units and container queries.

Use `100svh`, not `100vh`, for full-height sections — mobile browser chrome
makes `vh` unreliable. Hero and `MindEvolution` already do this.

### 12.1 Touch targets

Interactive controls need roughly **44×44px** minimum. The navbar hamburger is
`h-11 w-11` (44px) — match that floor. `CTAButton` `md` and `lg` both clear it.
Do not place small links tightly together.

### 12.2 Sticky elements

Two fixed/sticky layers exist, and they must never collide:

- **Navbar** — `fixed top-0 z-50`, shrinks on scroll, mobile drawer at `z-40`.
- **StickyMobileCTA** — `fixed bottom-0 z-40`, phones only (`sm:hidden`).
  It appears past 90% of the first viewport and **hides whenever `#register` or
  the footer is on screen**, so it never covers the thing it points at.
  `main` carries `pb-[4.5rem] sm:pb-0` to reserve its space.
  Padding uses `pb-[max(0.75rem,env(safe-area-inset-bottom))]` for iPhone safe
  areas, and `viewport.viewportFit: "cover"` in `layout.tsx` makes that work.

If you add another fixed layer, verify it against both of these, at 320px, with
the mobile drawer open, and with the on-screen keyboard raised.

### 12.3 Mobile navigation

The drawer must: open, close, close after navigating, close on `Escape`, lock
body scroll while open and restore the previous value on close, and expose
`aria-expanded` / `aria-controls` on the trigger. All of this is implemented in
`Navbar.tsx` — do not regress it.

**TODO / NEEDS CONFIRMATION:** the drawer does not currently trap focus or move
focus into the panel on open. Adding a focus trap would be an accessibility
improvement; it needs testing against the existing `Escape` and scroll-lock
behaviour.

### 12.4 Browser compatibility

Target current Chrome, Safari, Firefox and Edge — with **iOS Safari and Android
Chrome as first-class targets**, not afterthoughts. This audience is
overwhelmingly mobile.

iOS Safari specifically:

- `100svh` over `100vh` (§12); `env(safe-area-inset-*)` for anything pinned to
  an edge.
- `-webkit-mask-image` alongside `mask-image` — `Marquee` already does this.
- WebGL contexts are scarce and aggressively reclaimed. Never leave a probe
  context alive (`usePerformanceTier` explicitly calls `loseContext()`), and
  never mount a second canvas without releasing the first.
- Low Power Mode throttles frame rates hard. The adaptive DPR downgrade must
  keep working — do not remove it.
- `backdrop-blur` is used on the navbar, drawer and sticky CTA. Verify legibility
  where it is unsupported or disabled.

Do not use a browser-detection branch. Use feature detection and progressive
enhancement.

---

## 13 · Accessibility — mandatory

Follow WCAG 2.2 AA principles.

### 13.1 Structure

- **Exactly one `<h1>` per page** — it is in `Hero.tsx`. Never add a second.
- Headings descend in order; never use a heading for visual size. Use the type
  tokens (`text-h2` on an `h3` is fine and is done deliberately in places).
- Every `<section>` carries `aria-labelledby` pointing at a real heading. When
  the visible design has no heading, use an `sr-only` one — the existing
  sections do exactly this. Keep that pattern.
- Landmarks: `header` / `nav[aria-label]` / `main#main` / `footer` are all in
  place. The skip link in `layout.tsx` targets `#main` — do not break it.

### 13.2 Interaction

- Use semantic elements. **Never `<div onClick>`** where a `<button>` or `<a>`
  belongs.
- Every interactive element must be keyboard reachable and operable, with a
  visible focus state. `globals.css` sets a global honey `:focus-visible`
  outline — never remove it, and never set `outline: none` without an equally
  visible replacement.
- Disclosure widgets need `aria-expanded` + `aria-controls`; panels need a
  labelled `region`. See `Accordion.tsx`.
- Decorative SVGs and images get `aria-hidden` / `alt=""`. Meaningful ones get
  real text.

### 13.3 Content in media

Never put essential information only inside a canvas, an image or a video.
`MindEvolution` is the model: three chapters of real HTML copy, with the canvas
marked decorative. Remove the 3D entirely and the section still reads.

### 13.4 Contrast

Verify contrast whenever you change a colour pairing. The known traps:

- `honey` on `paper` fails — use `amber-ink` on light backgrounds.
- `cream-dim` on `night` is intentionally low-emphasis; do not use it for
  anything a visitor must read.
- Text over the 3D background needs the depth wash behind it (see Hero and
  `MindEvolution`). If you move copy over the canvas, move a wash with it.

### 13.5 Language

`<html lang="en-IN">`. Every Tamil string must be wrapped with `lang="ta"` so
screen readers switch pronunciation and the Tamil font applies.

---

## 14 · Media rules

### 14.1 Images

- Always `next/image`. Always explicit `width`/`height` (or `fill` with a sized
  parent) so nothing shifts.
- Always a `sizes` attribute for responsive images —
  `MeetKaleeswaranSection` shows the pattern:
  `sizes="(min-width: 1024px) 40vw, (min-width: 640px) 28rem, 92vw"`.
  Without it, phones download desktop-sized images.
- `priority` **only** for genuinely above-the-fold assets. Currently exactly one
  image has it: the navbar logo. Everything else lazy-loads by default. Do not
  add `priority` to below-the-fold images — it steals bandwidth from LCP.
- Meaningful `alt` text for informative images (see `trainingPhotos` in
  `content.ts`); `alt=""` for decorative ones (the logos in `Navbar`/`Footer`
  are correctly decorative because adjacent text names the brand).
- New raster assets go through `scripts/optimize-assets.mjs` (sharp → WebP,
  max width 1600, quality ~76). **Never render an unoptimized multi-MB image.**
  `public/kaleeswaran_image.png` and `public/knowmind_logo.png` are the two
  deliberate exceptions: they are generator inputs, and nothing in `src/` may
  point `next/image` at them (§3).
- Prefer inline SVG for icons — the page currently uses zero icon-font and zero
  icon-library dependencies. Keep it that way.

### 14.2 Video

There is no video on the page yet: `videoTestimonials` all have `src: null` and
render an honest placeholder.

When real recordings arrive, the existing markup already encodes the rules —
keep them:

- `preload="none"` — **never** `auto` or `metadata` for below-the-fold video
- a real `poster` image
- `controls`, play on user interaction, **no autoplay**
- an `aria-label` describing the clip

Additional non-negotiables:

- **Never load multiple testimonial videos at once.** Poster → click → load →
  play. Only the active video may be initialised; pause and release the others.
- Never download three or more large videos on page load.
- Background video (if ever added) must be muted, `playsInline`, poster-backed,
  reduced-motion aware, with a static image fallback on mobile.
- Captions or a transcript for any video carrying spoken content.

### 14.3 Fonts

Three families, loaded via `next/font/google` with `display: "swap"` and CSS
variables — this self-hosts them and eliminates the render-blocking request.

- Do not add a family or a weight without approval. Instrument Sans already
  loads four weights; that is the ceiling.
- Do not switch to a `<link>` tag or a font CDN — that reintroduces a
  render-blocking third-party request and a CLS risk.

---

## 15 · Performance

Targets: **LCP < 2.5s**, **INP < 200ms**, **CLS < 0.1** on a mid-range Android
over 4G. This page's audience opens it on a phone.

Rules that protect those numbers — do not undo them:

- three.js is **never** in the initial chunk. Both 3D entry points use
  `dynamic(..., { ssr: false })` with a space-reserving placeholder.
- Render loops park when off screen (`frameloop`, `IntersectionObserver`).
- Scroll and pointer values go into refs, never React state.
- `resize={{ scroll: false }}` on the KnowMind canvas — R3F's scroll
  re-measurement is its single biggest scroll cost.
- All scroll/resize/pointer listeners are `{ passive: true }` and are removed on
  unmount. Every `requestAnimationFrame` is cancelled on unmount.
- Layout is measured on mount / resize / `ResizeObserver` — never inside a
  scroll handler.
- Placeholders reserve space so mounting the canvas causes no shift.
- No third-party scripts at all today. Anything added later must be `defer`,
  `async` or interaction-triggered, and must never block first render.
- The only inline script is the static JSON-LD blob in `layout.tsx`.

Do not convert server components to client components for convenience. Do not
add a state library, an animation library, an icon library or a UI kit.

### 15.1 Analytics

There is no analytics today. If it is ever added (a decision for the owner, §21):

- Load it with `next/script` at `afterInteractive` or later — never blocking.
- **A failure in analytics must never break the page.** Guard every call; never
  let a missing global throw inside a render or a click handler.
- Track conversion-meaningful events only: CTA click (the
  `data-payment-configured` attribute on `CTAButton` is the hook), checkout
  start, FAQ open, video play, section reach. Not every mouse movement.
- No personal data, no email addresses, no phone numbers in event payloads.
- One tool. Do not stack three tag managers on a single landing page.

---

## 16 · SEO

`src/app/layout.tsx` owns metadata; `src/lib/schema.ts` owns JSON-LD.

Already in place: `metadataBase`, title + template, description, keywords,
canonical (`alternates.canonical: "/"`), Open Graph (type, locale `en_IN`,
alternate `ta_IN`, url, siteName, title, description), Twitter
`summary_large_image`, robots + googleBot directives, `themeColor`,
`viewportFit: "cover"`, `formatDetection`.

JSON-LD graph: `Organization`, `Person` (Kaleeswaran, with credentials),
`Course` (+ `CourseInstance`, offer, capacity, instructor), `EducationEvent`.

**Structured-data honesty rule.** `schema.ts` deliberately omits
`aggregateRating`: the 4.9 / 258 Google reviews belong to Kaleeswaran's
practice, not to this course, and marking them up as course reviews would
misrepresent them. **Do not add it.** Never mark up a claim the page cannot
substantiate.

Also in place: `opengraph-image.tsx` (a 1200×630 share card generated at build
time by `next/og` from `config.ts`, so it can never drift out of sync with the
dates and price), `favicon.ico`, `icon.png`, `apple-icon.png`, `manifest.ts`,
`robots.ts` and `sitemap.ts`.

- `opengraph-image.tsx` runs on **Satori**, which supports flexbox only — no CSS
  grid, no external stylesheets, no arbitrary CSS. Keep the styles inline and
  flex-based.
- Regenerate icons with `npm run icons`, never by hand-editing a PNG.
- `sitemap.ts` carries a hardcoded `lastModified` date. Update it when the page
  materially changes.
- If the production origin is ever not `www.kaleeswaran.com`, set
  `NEXT_PUBLIC_SITE_URL` — canonical, OG, JSON-LD, robots and sitemap all derive
  from it. Never hardcode an origin in any of those files.

Keep marketing content crawlable in HTML. Never move copy into a canvas, an
image, or client-only rendering.

---

## 17 · TypeScript

`strict: true`. Keep `npx tsc --noEmit` clean at all times.

- **Never use `any`.** Prefer `unknown` plus narrowing.
  There is exactly **one** `as any` in the codebase — `states.ts:235`, in the
  generic lerp across character states. Do not add a second without documenting
  why in a comment at the site.
- Prefer `type` aliases for props, matching the existing style. Export the type
  when a section imports it (`Testimonial`, `FaqItem`, `Tier`, `KnowMind3DProps`).
- Use `as const` for fixed data objects — `siteConfig`, `programDetails`,
  `navLinks`, `guarantee` and `tamil` all do, which is what makes their literal
  types flow into the components.
- Type refs precisely: `useRef<HTMLDivElement>(null)`,
  `RefObject<HTMLElement | null>`, `RefObject<number>`.
- Never use `@ts-ignore` / `@ts-expect-error` to silence a real error.
- Never loosen `tsconfig.json` to make code compile.
- `next-env.d.ts` is generated. Never edit it.

---

## 18 · Security

- **No secrets in this repository, ever.** No API keys, private keys, database
  credentials, payment secrets or service-account files.
- `NEXT_PUBLIC_*` variables are **compiled into the client bundle and are
  public**. Only genuinely public values belong there. A Razorpay hosted Payment
  Link URL is public. A Razorpay key secret or webhook secret is not — those
  would require a server route and an unprefixed variable.
- `.env`, `.env.local` and `.env*.local` are gitignored. `.env.example`
  documents the shape and must never contain a real value.
- Treat all user input as untrusted: escape it, validate it, never interpolate
  it into HTML or a URL unchecked.
- `dangerouslySetInnerHTML` appears exactly once, in `layout.tsx`, for
  build-time JSON-LD generated from our own modules. **No user input is
  involved.** Do not add a second use without sanitisation and a written
  justification.
- External links get `rel="noopener noreferrer"` with `target="_blank"`.
  `CTAButton` and `Footer` already do this.
- Never expose a stack trace, an internal path or a raw error object to a
  visitor.

### 18.1 Environment variables

| Variable | Scope | Purpose | Required |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_RAZORPAY_PAYMENT_LINK` | public | Razorpay hosted Payment Link for the ₹999 founding registration. Empty → all CTAs fall back to `#register`. | for production |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical origin for canonical tags, OG URLs and JSON-LD. Defaults to `https://www.kaleeswaran.com`. | recommended |

No `.env.local` exists in the working tree — copy `.env.example` to create one.
When you add a variable, document it in `.env.example` **and** in this table.

---

## 19 · Change management

**This is not a git repository.** `git status` fails. There is no branch, no
commit history, no undo.

That raises the cost of every mistake, so:

- Read a file immediately before you edit it (other agents may be editing too).
- Never delete a file unless the task explicitly requires it.
- Never rewrite unrelated code, reformat untouched files, or "clean up" as you
  pass through.
- Never remove a dependency without checking every usage.
- Never overwrite a config file wholesale — make targeted edits.
- Never destroy working functionality to solve an unrelated problem.
- When replacing a non-trivial block, keep the change reviewable and describe
  what you replaced in your report.

**TODO / NEEDS CONFIRMATION:** initialising git would make all of the above far
safer. It is a workspace decision for the owner, not an agent's call.

`AGENTS.md` is written and re-added by `next dev`. Do not hand-edit it; if it
reappears in a diff, that is expected.

---

## 20 · Validation

Run these before declaring anything complete:

| Gate | Command | Expected |
| --- | --- | --- |
| Type check | `npx tsc --noEmit` | clean — **mandatory** |
| Production build | `npm run build` | succeeds — **mandatory** for non-trivial changes |
| Dev run | `npm run dev` | page renders, console clean |
| Lint | — | **NOT AVAILABLE** (§2.1) |
| Tests | — | **NOT AVAILABLE** — no test infrastructure |

Do not claim a gate passed if you did not run it. Do not claim a gate exists
when it does not.

### 20.1 Manual QA — user flows

Walk each flow: **START → ACTION → EXPECTED RESULT.**

| Flow | Expected |
| --- | --- |
| Any CTA, payment link unset | smooth-scrolls to `#register`, lands clear of the fixed navbar |
| Any CTA, payment link set | opens Razorpay in a new tab, `rel="noopener noreferrer"` |
| Nav link (desktop) | scrolls to the correct section |
| Mobile menu | opens → body scroll locked → navigate → closes → scroll restored |
| Mobile menu + `Escape` | closes |
| Sticky mobile CTA | appears past the hero, disappears over `#register` and the footer |
| FAQ accordion | opens/closes by click **and** by keyboard; `aria-expanded` tracks |
| Reduced motion on | reveals settle instantly, marquee is a static list, metrics show final values, transformation stacks, 3D holds still |
| WebGL disabled | flat fallbacks render, page fully readable, no console errors |
| Slow GPU | DPR steps down once, scroll stays smooth |
| Footer links | website / phone (`tel:`) / email (`mailto:`) all correct |
| Skip link | `Tab` on load reveals it; activating it jumps to `#main` |

### 20.2 Mobile QA checklist (320 / 375 / 390 / 414)

```
[ ] No horizontal scrolling
[ ] No clipped text
[ ] No overlapping content
[ ] Buttons tappable (~44px)
[ ] Forms usable (when they exist)
[ ] Navigation usable
[ ] Images fit
[ ] Videos fit (when they exist)
[ ] 3D does not freeze
[ ] Animations smooth
[ ] Sticky CTA does not cover content
[ ] Footer works
[ ] No unexpected blank space
[ ] Safe-area insets respected on notched devices
```

### 20.3 Performance QA

```
[ ] Hero paints fast, text before canvas
[ ] Images optimized, sized, correctly prioritized
[ ] No eager video loading
[ ] 3D does not block first render
[ ] No new dependencies
[ ] No unnecessary client components
[ ] No layout shift on canvas mount
[ ] No memory leak (listeners and rAF cleaned up)
[ ] No scroll jank
[ ] No console errors
```

### 20.4 Console and network QA

Console must be free of unexplained errors, warnings, failed requests,
**hydration mismatches**, missing assets and WebGL errors.

Hydration deserves particular care here. The established safe patterns:
`useMediaQuery` uses `useSyncExternalStore` with a `false` server snapshot;
`useWebGLSupport` and `usePerformanceTier` return `null` until an effect runs.
**Never read `window`, `navigator`, `matchMedia` or `localStorage` during
render.**

Network: no 404s, no oversized media, no duplicate requests, nothing
render-blocking.

### 20.5 Regression rule

After changing a shared component, test **every** consumer:

- `CTAButton` → Navbar (desktop + drawer), Hero, OfferSection, PricingSection,
  FinalCTA, StickyMobileCTA
- `Reveal` / `RevealGroup` → nearly every section
- `SectionHeading` → most sections, in both `dark` and `light` tone
- `Navbar` → desktop, tablet, mobile drawer, scrolled and unscrolled
- `globals.css` tokens → the whole page, both tonal halves
- `config.ts` / `content.ts` → every consumer of the changed export, plus the
  JSON-LD in `schema.ts`

---

## 21 · Known gaps

Real, verified gaps. Do not "fix" any of these by fabricating content; several
need assets or a human decision.

| Gap | Status |
| --- | --- |
| `npm run lint` broken (`next lint` removed in Next 16) | needs ESLint 9 flat config — **approval required** |
| No test infrastructure | none planned — **decision required** |
| Not a git repository | **decision required** |
| Video testimonials are placeholders (`src: null`) | needs real recordings |
| Client / media logos are typographic | needs real, licensed logo files |
| No real checkout, webhook or post-payment onboarding | backend work — **approval required** |
| No analytics | **decision required**; if added, track CTA clicks, checkout start, FAQ opens, video plays — and never let analytics failure break the page |
| Mobile drawer has no focus trap | accessibility improvement, needs testing |
| `.env.local` not present | copy from `.env.example` |

---

## 22 · Definition of Done

A feature is **not** done because the UI appears. It is done when:

```
[ ] Requirement implemented, in full
[ ] Existing functionality preserved
[ ] Desktop tested
[ ] Mobile tested (320 / 375 / 390 / 414)
[ ] Tablet considered
[ ] Loading state handled
[ ] Error state handled
[ ] Empty state handled where relevant
[ ] Reduced motion handled
[ ] Keyboard + focus verified
[ ] Contrast verified for any changed colour pairing
[ ] Semantic structure and heading order intact
[ ] SEO / metadata / JSON-LD considered
[ ] Images optimized, sized, correctly prioritized
[ ] Videos lazy, poster-backed, interaction-loaded
[ ] 3D fallback path verified
[ ] Every affected CTA clicked and verified
[ ] Forms verified (when they exist)
[ ] Payment flow verified where relevant
[ ] npx tsc --noEmit passes
[ ] npm run build passes
[ ] Console clean — no hydration errors
[ ] Network clean
[ ] No regression in shared components
[ ] No unnecessary dependencies
[ ] No secrets exposed
[ ] No unrelated files changed
[ ] Diff reviewed
```

---

## 23 · Final report format

Every completed task ends with this. Never claim something was tested if it was
not.

```markdown
## What changed
Short summary.

## Files changed
List.

## User flow affected
Before → After.

## Validation
Typecheck (npx tsc --noEmit):  PASS / FAIL
Build (npm run build):         PASS / FAIL / NOT RUN
Lint:                          NOT AVAILABLE
Tests:                         NOT AVAILABLE
Responsive:                    PASS / FAIL / NOT VERIFIED
Console:                       PASS / FAIL / NOT VERIFIED
Network:                       PASS / FAIL / NOT VERIFIED

## Known limitations
Anything not verified, any assumption made, any exception taken to CLAUDE.md
and why.
```

---

## 24 · Document non-obvious decisions

When you introduce architecture that is not self-evident, leave a comment
explaining **why**, in the style already used throughout this codebase — for
example: why the 3D downgrade is one-way; why the marquee degrades to a wrapped
list; why `aggregateRating` is absent from the JSON-LD; why the mobile CTA hides
over `#register`; why the Navbar CTA is wrapped in a `div` rather than given a
`hidden` class.

Those comments are the reason this codebase is safe to change. Preserve them,
and add your own.
