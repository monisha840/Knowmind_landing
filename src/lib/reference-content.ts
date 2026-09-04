/**
 * The reference landing page's copy, verbatim.
 *
 * WHAT THIS IS
 * ------------
 * Every string the reference renders, transcribed exactly as it renders it —
 * punctuation, ellipses (… as one glyph), em and en dashes, emoji and Tamil
 * included. It is the content half of the Master Reproduction Specification
 * §02; `reference.css` is the design half.
 *
 * WHY IT IS A SEPARATE MODULE
 * ---------------------------
 * `content.ts` is the approved programme deck, and several of its blocks say
 * the same thing in different words — the deck writes Day 1 as "What's really
 * going on within you?" where the reference writes "Notice what is within
 * you.", and lists the client as "McKinsey & Company" where the reference
 * writes "McKinsey & Co.". Overwriting the deck to match the reference would
 * destroy the approved record; paraphrasing the reference to match the deck
 * would break the reproduction. So both are kept, each labelled with what it
 * is, and this module is the one the programme page reads.
 *
 * Every divergence found while transcribing is listed at the foot of this file
 * rather than silently resolved (specification §09, task A9).
 *
 * RULES
 * -----
 * Do not paraphrase, shorten, correct or "improve" anything here — not the
 * grammar, not the capitalisation, not the spacing around the ellipses. It is
 * a transcription, and its only correctness criterion is that it matches the
 * reference. Prices and dates are interpolated from `config.ts` wherever the
 * reference's literal agrees with it, so the page can still never disagree
 * with what checkout charges (CLAUDE.md §1.1, §7.5).
 */

import { formatINR, inr, programDetails, siteConfig } from "@/lib/config";

/* -------------------------------------------------------------------------- */
/*  Band 1 — the sticky bar                                                   */
/* -------------------------------------------------------------------------- */

export const refSticky = {
  brand: siteConfig.name,
  tagline: siteConfig.tagline,
  closesIn: "Closes in",
  /** The instant the countdown runs to — the first session, in IST. */
  deadline: "2026-09-14T05:30:00+05:30",
  closed: "Closing",
  cta: `Join – ${inr(programDetails.price)}`,
} as const;

/* -------------------------------------------------------------------------- */
/*  Band 2 — hero                                                             */
/* -------------------------------------------------------------------------- */

export const refHero = {
  /** The amber attention bar above the batch tag, added at the owner's request. */
  attention: {
    icon: "⚠️",
    label: "Attention:",
    audiences: ["Entrepreneurs", "Working Professionals", "Freelancers", "Homemakers"],
  },
  tag: `${siteConfig.batch} · Live on Zoom · ${programDetails.dateLabelShort}`,
  mark: "1% Better.",
  sub: "Every Day.",
  /* Tanglish — Tamil, written in Roman letters. Deliberately not Tamil script
     (nothing on the page carries `lang="ta"` any more) and deliberately not an
     English translation: the owner asked for the Tamil to be *heard*, in a
     script a Tamil-speaking reader scans without switching alphabets.
     The English line under it is the gloss, not a second copy of it. */
  tanglish: "Paravaala paathukkalaam… aarambikkalaam.",
  tanglishEnglish: "You don't have to be perfect. You just have to begin.",
  headline: "Are You Ready to Become 1% Better Every Day?",
  /** Two lines, set as two lines by a <br> in the reference. */
  subLines: [
    "14 Days. One Small Commitment. One Better Relationship with Yourself.",
    "Notice your patterns. Change, one small step at a time.",
  ],
  badges: [
    "5:30 AM Live",
    `${programDetails.dateLabelShort}`,
    "Zoom",
    "Tamil + English",
    "Limited Batch",
  ],
  cta: "BEGIN MY 14-DAY JOURNEY",
  ctaNote: `${inr(programDetails.price)} only · Includes ${inr(1097)} worth of bonuses free · Limited seats`,
  /** The placeholder the reference frames, kept for the no-photo path. */
  photoPlaceholder: "Kalee's photo here",
  stats: [
    { n: "4.9", l: "258 reviews" },
    { n: "30,000+", l: "Impacted" },
    { n: "15+", l: "Years" },
  ],
} as const;

/* -------------------------------------------------------------------------- */
/*  Band 3 — VSL                                                              */
/* -------------------------------------------------------------------------- */

export const refVsl = {
  label: "Watch this first",
  placeholder: "Add VSL video here (1.5–2 minutes)",
  /* The corrections deck's own line, in full. It used to stop at the ellipsis;
     the second half is the question the band is actually asking. */
  quote: '"Oru Chinna Kelvi Ungalukku..." – Arambikalama??',
} as const;

/* -------------------------------------------------------------------------- */
/*  Band 4 — is this your pattern?                                            */
/* -------------------------------------------------------------------------- */

export const refPattern = {
  tag: "Idhu Ungaloda Pattern-aa?",
  /* The lead is now the smaller line and the accent the larger one — see
     `.s-title` / `.s-title-accent` in reference.css.

     Both clauses are the corrections deck's own, spelling included. The second
     one is not a re-spelling of what was here: it used to say the journey goes
     like this, and the deck says it does not go the way we thought. That is the
     band's whole argument, so it is the deck's sentence that runs. */
  titleLead: "Namma ellarum change aaganum-nu ninaikkirom…",
  titleAccent: "Aana namma ninacha mathiri porathu illai…",
  steps: [
    {
      title: '"Indha time kandippa consistent-aa iruppen!"',
      body: "Motivation irukkum. Energy irukkum. Strong start.",
    },
    {
      title: "Overthink Pannuvom",
      body: '"Idha panna enna use?" "Naan correct direction-la dhaan porena?"',
    },
    {
      title: "Compare Pannuvom",
      body: '"Avanga evlo munnaadi poitaanga…"',
    },
    {
      title: "Oru Naal Miss Aagum",
      body: "Routine breaks. Guilt sets in. The cycle restarts.",
    },
  ],
  truth: {
    top: ["You don't need another motivational speech.", "You don't need more information."],
    tanglish: "Paravaala paathukkalaam… aarambikkalaam.",
    english: "You don't have to be perfect. You just have to begin.",
    quote: "You need Awareness + Choice + Repetition + Growth.",
    note: "Not perfection. Not pressure. Just progress.",
  },
} as const;

/* -------------------------------------------------------------------------- */
/*  Band 5 — the 1% philosophy                                                */
/* -------------------------------------------------------------------------- */

export const refPhilosophy = {
  tag: "The 1% Philosophy",
  title: { before: "What Is ", accent: "1% Better Every Day?" },
  lead: "Real change doesn't always begin with a big decision. Sometimes it begins with one small step. One honest reflection. One promise you keep to yourself.",
  cards: [
    {
      title: "AWARENESS",
      body: "You cannot change what you don't notice. Become aware of what is running your life.",
    },
    {
      title: "CHOICE",
      body: "Once you become aware, you can choose differently. Awareness opens the door.",
    },
    {
      title: "REPETITION",
      body: "Small choices repeated create new patterns. Return again. Even after you miss.",
    },
    {
      title: "GROWTH",
      body: "Over time, small changes become part of who you are. This is not perfection. It's intention.",
    },
  ],
  /** Four lines, set as four lines by <br> in the reference. */
  bottom: {
    first: "This is not about becoming perfect.",
    secondBefore: "It's about becoming ",
    secondStrong: "a little more conscious",
    secondAfter: " every day.",
    third: "A little more honest. A little more intentional.",
    last: "Just 1% Better. Every Day.",
  },
} as const;

/* -------------------------------------------------------------------------- */
/*  Band 6 — the fourteen days                                                */
/* -------------------------------------------------------------------------- */

export type RefDay = {
  /** The reference's own label: D1 … D14. */
  n: string;
  title: string;
  body: string;
};

export const refJourney = {
  tag: "Your 14-Day Growth Journey",
  title: { before: "14 Days. ", accent: "14 Powerful Conversations with Yourself." },
  lead: "This is not about learning more. It's about pausing, reflecting, and practicing. One day. One insight. One small practice.",
  weeks: [
    {
      label: "Week 1 – Understand Yourself",
      tone: "w1" as const,
      days: [
        { n: "D1", title: "Awareness", body: "Notice what is within you." },
        { n: "D2", title: "Patterns", body: "Understand the patterns shaping your life." },
        {
          n: "D3",
          title: "Self-Trust",
          body: "Build trust by keeping small promises to yourself.",
        },
        { n: "D4", title: "Playfulness", body: "Bring more joy and lightness into your journey." },
        { n: "D5", title: "Comparison", body: "Learn from others without losing yourself." },
        { n: "D6", title: "Inner Coach", body: "Change the way you speak to yourself." },
        { n: "D7", title: "Integration", body: "Pause. Reflect. Connect the dots." },
      ] satisfies RefDay[],
    },
    {
      label: "Week 2 – Move Forward",
      tone: "w2" as const,
      days: [
        { n: "D8", title: "Gratitude", body: "Notice what is already present in your life." },
        { n: "D9", title: "Dreams", body: "Give yourself permission to want more from life." },
        { n: "D10", title: "Vision", body: "Turn your dreams into direction." },
        { n: "D11", title: "Being", body: "Pause. Observe. Respond instead of reacting." },
        {
          n: "D12",
          title: "Repetition & Resilience",
          body: "Keep returning. Keep practicing. Keep growing.",
        },
        { n: "D13", title: "Self-Love", body: "Accept yourself while continuing to grow." },
        { n: "D14", title: "Reflection", body: "Turn experience into wisdom and move forward." },
      ] satisfies RefDay[],
    },
  ],
  note: {
    before: "You don't have to do everything at once. ",
    strong: "Just show up for yourself.",
    after: " One day. One insight. One small practice.",
  },
  cta: "YES, I WANT TO JOIN → ",
} as const;

/* -------------------------------------------------------------------------- */
/*  Band 6.5 — miss a day?                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The reassurance that used to close band 7, now a band of its own.
 *
 * The corrections deck removes "How Does the 14-Day Journey Work?" entirely
 * (slide 5) and then says of this block, on slide 6: "We can keep this / Keep
 * this point and have CTA buttom". It went out with the section the first time
 * round, which is the half of that instruction that was missed. It is promoted
 * here rather than copied, so `refHow.miss` below still reads from this one
 * object and the two can never drift — `HowItWorksSection` stays on disk,
 * uncomposed, and would still render the same words if it were ever composed
 * back in (CLAUDE.md §19, §4.2).
 *
 * `cta` is the only new string: the deck asks for a button and does not letter
 * it, so it takes the journey band's own wording rather than inventing a new
 * verb for the page's CTA vocabulary (CLAUDE.md §7.2).
 */
export const refMissADay = {
  question: "Miss a day?",
  reassurance: "Paravaala paathukkalaam… aarambikkalaam.",
  after: "Don't disappear. The next morning is another opportunity.",
  cta: "YES, I WANT TO JOIN → ",
} as const;

/* -------------------------------------------------------------------------- */
/*  Band 7 — how it works                                                     */
/* -------------------------------------------------------------------------- */

export const refHow = {
  title: "How Does the 14-Day Journey Work?",
  lead: "Simple. Live. Psychological. One step at a time.",
  steps: [
    {
      title: "Join the Journey",
      body: "Register for the 14-Day 1% Better Every Day journey.",
    },
    {
      title: "Join Live at 5:30 AM",
      body: "Start your morning with a focused live Zoom session. Short. Simple. Practical.",
    },
    {
      title: "Reflect & Practice",
      body: "Each day, explore one psychological principle and take a small action into your day.",
    },
    {
      title: "Stay Connected",
      body: "Be part of a community choosing to become better – one small step at a time.",
    },
    {
      title: "Complete Your Journey",
      body: "At the end of 14 days, pause and see: What changed? What will you continue?",
    },
  ],
  clarity: [
    { label: "Duration", val: "14 Days" },
    { label: "Format", val: "Live Zoom" },
    { label: "Time", val: programDetails.timeShort },
    { label: "Focus", val: "Psychological Growth" },
  ],
  /* Lifted out to `refMissADay` above — it is its own band now. Referenced
     rather than restated so the two cannot disagree. */
  miss: refMissADay,
} as const;

/* -------------------------------------------------------------------------- */
/*  Band 8 — what you explore                                                 */
/* -------------------------------------------------------------------------- */

export const refExplore = {
  tag: "14 Days. 14 Powerful Shifts.",
  title: { before: "What Will You ", accent: "Explore in 14 Days?" },
  cards: [
    {
      title: "Your Mind",
      body: "Awareness · Patterns · Inner Critic · Comparison – understand what is shaping your thoughts and decisions.",
    },
    {
      title: "Your Relationship with Yourself",
      body: "Self-Trust · Playfulness · Gratitude · Self-Love – rebuild how you speak to and feel about yourself.",
    },
    {
      title: "Your Direction",
      body: "Dreams · Bucket List · Vision · Goals – give yourself permission to want more and move toward it.",
    },
    {
      title: "Your Inner Stability",
      body: "Non-Reactivity · Repetition · Resilience · Reflection – learn to pause, return, and keep going.",
    },
  ],
  bottom: {
    first: "This is not about becoming someone else.",
    secondBefore: "It is about ",
    secondStrong: "understanding yourself better",
    secondAfter: " – and becoming more intentional about the person you are becoming.",
    third: "One day. One insight. One small step.",
    last: "1% Better. Every Day.",
  },
} as const;

/* -------------------------------------------------------------------------- */
/*  Band 9 — meet Kaleeswaran                                                 */
/* -------------------------------------------------------------------------- */

export const refKalee = {
  tag: "Meet the Psychologist & Trainer",
  heading: "For 15+ years, one question has guided my work.",
  quote:
    '"Why do we know what to do… but still struggle to do it consistently? Through my work in psychology, coaching, training and personal transformation, I have seen something clearly: Knowledge alone doesn\'t create change. Awareness, practice and repetition do."',
  bio: { before: "That is one of the reasons behind creating: ", strong: "1% Better Every Day." },
  approach: {
    heading:
      "My Approach – I don't believe transformation comes from simply telling you what to do. My role is to help you:",
    points: [
      "Understand yourself better",
      "Become aware of your patterns",
      "Ask better questions",
      "Take meaningful action",
      "Keep returning to the practice",
    ],
    close:
      "Because ultimately, I cannot change your life for you. But I can walk with you, guide you, and help you understand the path better.",
  },
  badges: [
    {
      title: "McKinsey & Company",
      body: "Worked with one of the world's top consulting firms",
    },
    { title: "TN Police – NIMHANS", body: "1,200+ police personnel trained" },
    { title: "International Trainer", body: "Programs across India and internationally" },
  ],
  card: {
    name: "Kaleeswaran Kamaraj",
    roleLines: ["Transformational Psychologist & Leadership Trainer", "Founder – KnowMind Universe"],
    stats: [
      { n: "15+", l: "Years" },
      { n: "2,000+", l: "Coaching hours" },
      { n: "30,000+", l: "Impacted" },
      { n: "100+", l: "Organisations" },
    ],
    google: {
      score: "4.9",
      stars: "★★★★★",
      reviews: `258 Google reviews – ${siteConfig.name}`,
    },
  },
} as const;

/* -------------------------------------------------------------------------- */
/*  Bands 10 and 11 — the two marquees                                        */
/* -------------------------------------------------------------------------- */

/**
 * The organisations, now as their own marks rather than as set type.
 *
 * CLAUDE.md §21 held this open for one specific reason, and it was not the
 * licensing one: the only copy of the client marks anybody had was a single
 * flattened grid in `LP contents.pptx` that could not be cut into individual
 * logos. The corrections deck supplies a different picture — slide 9's clean
 * 5 × 4 grid of twenty marks on their own cards — and the owner has asked for
 * the logos, which is the decision that row was waiting on. So the row is
 * closed the same way the media one was.
 *
 * `src` files are written by `scripts/extract-client-logos.mjs`, which measures
 * the grid's real gutters rather than assuming an even pitch, trims each card's
 * white and scales the mark to 96px tall. The dimensions below are each file's
 * own, after that, and are reproduced in `public/clients/logos.json` by the same
 * run — they let the strip reserve the exact box before anything loads. Re-run
 * the script and paste its printed sizes back here if the deck changes.
 *
 * `name` is the organisation's name and is what a screen reader gets; the mark
 * is the picture of it.
 *
 * ── Two things the deck's twenty changed ──────────────────────────────────
 *
 * `Greater Chennai Corp` is the nineteenth item and is still set as type: it
 * was in the eighteen this replaces, the deck's grid has no mark for it, and
 * drawing one would be fabricating a logo (CLAUDE.md §0.4). Dropping it would
 * quietly delete a real claim, so it stays as a wordmark until a file exists.
 *
 * `The Federal` appears in the deck's client grid and is also in the media
 * strip below. Both are the owner's own lists; it is carried in both rather
 * than silently removed from one. Flagged for the owner.
 */
export const refCorpMarquee = {
  /* Slide 9's own heading, replacing "Organisations Kalee has trained". */
  label: "Trusted by Professionals & Organisations",
  items: [
    { name: "McKinsey & Company", src: "/clients/mckinsey-and-company.webp", width: 249, height: 96 },
    { name: "Siemens Gamesa", src: "/clients/siemens-gamesa.webp", width: 552, height: 96 },
    { name: "Daimler India", src: "/clients/daimler-india.webp", width: 346, height: 96 },
    { name: "TVS", src: "/clients/tvs.webp", width: 530, height: 96 },
    { name: "TVS Electronics", src: "/clients/tvs-electronics.webp", width: 153, height: 96 },
    { name: "Bosch", src: "/clients/bosch.webp", width: 364, height: 96 },
    { name: "Ashok Leyland", src: "/clients/ashok-leyland.webp", width: 223, height: 96 },
    { name: "Titan", src: "/clients/titan.webp", width: 136, height: 96 },
    { name: "ITC Limited", src: "/clients/itc-limited.webp", width: 86, height: 96 },
    { name: "Amara Raja", src: "/clients/amara-raja.webp", width: 331, height: 96 },
    { name: "Renault Nissan", src: "/clients/renault-nissan.webp", width: 300, height: 96 },
    { name: "FLSmidth", src: "/clients/flsmidth.webp", width: 340, height: 96 },
    { name: "Tamil Nadu Police", src: "/clients/tamil-nadu-police.webp", width: 88, height: 96 },
    { name: "HP India", src: "/clients/hp-india.webp", width: 73, height: 96 },
    { name: "Tata Tea", src: "/clients/tata-tea.webp", width: 208, height: 96 },
    { name: "Samsung", src: "/clients/samsung.webp", width: 504, height: 96 },
    { name: "Saint-Gobain", src: "/clients/saint-gobain.webp", width: 193, height: 96 },
    { name: "Aditya Birla Group", src: "/clients/aditya-birla-group.webp", width: 104, height: 96 },
    { name: "The Federal", src: "/clients/the-federal.webp", width: 255, height: 96 },
    { name: "Rane", src: "/clients/rane.webp", width: 142, height: 96 },
    "Greater Chennai Corp",
  ],
} as const;

/**
 * The nine outlets, now as their own marks rather than as set type.
 *
 * The wordmarks these replace were a deliberate hold, not an oversight —
 * CLAUDE.md §21 recorded that the deck carried real logo images and that
 * shipping third-party marks was a licensing decision nobody had made. The
 * owner has now made it and asked for the logos, so they are here.
 *
 * `src` files are written by `scripts/extract-media-logos.mjs` straight out of
 * `LP contents.pptx`. The dimensions are each mark's own, after the script trims
 * the deck's surrounding background and scales it to 96px tall — they are
 * carried here so the strip can reserve the exact box before anything loads,
 * and they are reproduced in `public/media/logos.json` by the same run. If the
 * deck changes, re-run the script and copy its printed sizes back here.
 *
 * `name` stays the outlet's name and is what a screen reader gets; the mark is
 * the picture of it.
 */
export const refMediaMarquee = {
  label: "Featured in Tamil Nadu's leading media",
  items: [
    { name: "Sun News", src: "/media/sun-news.webp", width: 132, height: 96 },
    { name: "Thanthi TV", src: "/media/thanthi-tv.webp", width: 86, height: 96 },
    { name: "Vijay TV", src: "/media/vijay-tv.webp", width: 72, height: 96 },
    { name: "Vikatan", src: "/media/vikatan.webp", width: 375, height: 96 },
    { name: "Hello FM 106.4", src: "/media/hello-fm.webp", width: 315, height: 96 },
    { name: "Puthiya Thalaimurai", src: "/media/puthiya-thalaimurai.webp", width: 243, height: 96 },
    { name: "Puthu Yugam", src: "/media/puthu-yugam.webp", width: 389, height: 96 },
    { name: "Maalai Malar", src: "/media/maalai-malar.webp", width: 93, height: 96 },
    { name: "The Federal", src: "/media/the-federal.webp", width: 178, height: 96 },
  ],
} as const;

/* -------------------------------------------------------------------------- */
/*  Band 12 — testimonials                                                    */
/* -------------------------------------------------------------------------- */

export const refTestimonials = {
  tag: "What Participants Say",
  title: {
    before: "The Best Way to Understand a Journey Is to ",
    accent: "Hear from the People Who Experienced It.",
  },
  /**
   * The featured-video band's own copy, supplied by the owner with the
   * redesign. Section furniture, not testimony — nothing here is attributed to
   * a participant.
   */
  feature: {
    headline: ["Real people.", "Real realizations."],
    lead: "What changed during the journey?",
    /** Shorter, for the single-column layout. */
    headlineMobile: ["Real voices", "from the journey"],
    stages: {
      before: "Before",
      realization: "Realization",
      after: "After",
    },
    /** Announced to screen readers when the selection changes. */
    nowShowing: "Now showing",
    /** Shown while a person has no written story yet. */
    watchPrompt: "Watch the recording",
  },
  /**
   * The reference labels three slots rather than filling them. They are now
   * filled — see `videos` — but the labels stay, because they are still what a
   * slot renders when no recording is behind it. Remove a file from `videos`
   * and its frame returns to the reference's own dashed placeholder rather
   * than collapsing (CLAUDE.md §9.2, the empty state).
   */
  videoSlots: [
    "Participant Video 1",
    "Participant Video 2",
    "Participant Video 3",
    "Participant Video 4",
    "Participant Video 5",
    "Participant Video 6",
  ],
  videoPlaceholder: "Add video embed here",
  /**
   * Three participant recordings from the owner's Drive asset library, encoded
   * for the web by `scripts/optimize-video.mjs` (which records the Drive file
   * id each one came from, and why the other three in that folder are not
   * here).
   *
   * `name` and `role` are transcribed from each recording's own burned-in
   * lower third — read off the supplied asset, not authored here, exactly as
   * `refAssets.heroPhoto.alt` reads the credentials card's badges off the
   * image (CLAUDE.md §1.1). The spellings are the participants' own, "Coprate"
   * included; correcting somebody's own caption would put the page and the
   * footage it is captioning into disagreement, and it is not an agent's call
   * to make. Flagged for the owner rather than fixed.
   *
   * They are also repeated here in HTML rather than left to the burned-in
   * caption alone, because the caption is only legible for the first six
   * seconds and is invisible to a screen reader either way (CLAUDE.md §13.3).
   *
   * These are not the six quotes below. Six different people, no overlap of
   * evidence — nobody's words are being paired with somebody else's face.
   */
  /**
   * ── The story slots ──────────────────────────────────────────────────────
   *
   * `story` is what the featured panel renders: a short quote and the three
   * stages, Before → Realization → After.
   *
   * All six are `null`, and that is deliberate. These six people have a name, a
   * role and a recording in this repository and nothing else — no transcript,
   * no written quote, nothing that could be summarised. The six quotes further
   * down belong to six *different* participants, and pairing them would put one
   * person's words under another person's face, which is the one thing the note
   * above this list exists to prevent.
   *
   * So the slots wait rather than getting filled with something invented
   * (CLAUDE.md §0.4, §1.1). `TestimonialFeature` renders the panel only for a
   * person whose `story` is set, and the featured video, the name, the role,
   * the selector and the navigation all work regardless. Paste real words into
   * one of these and that person's panel appears with no other change.
   *
   * Shape, when you fill one in:
   *
   *   story: {
   *     quote: "One line, in their words.",
   *     before: "What they noticed before.",
   *     realization: "What they understood.",
   *     after: "What changed.",
   *   },
   */
  videos: [
    {
      src: "/testimonials/gowri-shankar.mp4",
      poster: "/testimonials/gowri-shankar.webp",
      name: "Gowri shankar",
      role: "Coprate trainer , Agency owner",
      story: null,
    },
    {
      src: "/testimonials/sriraynu.mp4",
      poster: "/testimonials/sriraynu.webp",
      name: "Sriraynu",
      role: "Psychologist and School counsellor",
      story: null,
    },
    {
      src: "/testimonials/bhoopeshdhayalan.mp4",
      poster: "/testimonials/bhoopeshdhayalan.webp",
      name: "Dr A Bhoopeshdhayalan",
      role: "BNYS",
      story: null,
    },
    {
      src: "/testimonials/shahul-hameed.mp4",
      poster: "/testimonials/shahul-hameed.webp",
      name: "Shahul Hameed",
      role: "Behavioural and performance development trainer",
      story: null,
    },
    {
      src: "/testimonials/anandh.mp4",
      poster: "/testimonials/anandh.webp",
      name: "Anandh",
      role: "Customer success  Tamilpreneur",
      story: null,
    },
    {
      src: "/testimonials/vinoth.mp4",
      poster: "/testimonials/vinoth.webp",
      name: "Vinoth",
      /* This recording is audio over a static name card — there is no footage
         of him, and his card carries no job title. The role says what the asset
         is rather than asserting a credential it never claims, and the poster
         is that card, so the tile reads as deliberate rather than broken
         (CLAUDE.md §1.1, §9.2). */
      role: "Audio testimonial",
      story: null,
    },
  ],
  /** All six carry five stars and the same role line in the reference. */
  role: "1% Better Program – Founding Batch",
  /**
   * The written half's own furniture, supplied by the owner with the brief that
   * turned the six quote cards into one featured quote. `role` above is what
   * each quote is attributed to; these two name the block and say what it is
   * showing. Neither asserts anything the six quotes do not already say for
   * themselves (CLAUDE.md §1.1).
   */
  quotesHeading: {
    eyebrow: "Voices of the Journey",
    lead: "What people noticed about themselves",
  },
  /**
   * The four written testimonials, from the corrections deck's slide 12.
   *
   * That slide replaces the six that used to be here rather than adding to
   * them — slide 11's callout points at the old grid and says "updaded next
   * slide". Three of the six are not in the replacement set (Anandha, Vinoth
   * Kannan, GS) and are therefore gone; two of the survivors have edited
   * wording; and one quote changed hands, which is why the whole set is
   * reproduced from the deck rather than patched item by item:
   *
   *   · Deepa Sai's ends at "a real shift." in the deck — the old copy carried
   *     "in me. Thank you for the clarity." after it.
   *   · "This program helped me understand why I was losing focus…" was
   *     attributed to Vadivelmani and is Saranyadevi's in the deck. An
   *     attribution is not a wording preference, so it is taken as given
   *     (CLAUDE.md §1.1) and flagged for the owner.
   *   · Vijaya Saravanan's is rewritten, not reworded.
   *   · Pavithra's is new.
   *
   * `role` is now per person. The shared "1% Better Program – Founding Batch"
   * line the six used to share is kept as `role` above, because the recordings'
   * captions still use it; these four carry their own professions, exactly as
   * the deck sets them.
   */
  quotes: [
    {
      name: "Deepa Sai",
      role: "Entrepreneur",
      quote:
        '"The content touched things I knew but never faced honestly. Day 1 itself created a real shift."',
    },
    {
      name: "Saranyadevi",
      role: "Accountant",
      quote:
        '"This program helped me understand why I was losing focus. Now I know how to return when I drift."',
    },
    {
      name: "Vijaya Saravanan",
      role: "Entrepreneur",
      quote:
        '"The importance of measurable goals and daily progress became clearer. Kalee made that real."',
    },
    {
      name: "Pavithra",
      role: "Psychologist",
      quote:
        '"This 14-day journey helped me become more aware, compassionate, and conscious in how I respond to life. I loved that it wasn\'t about perfection - it was simply about becoming 1% better every day."',
    },
  ],
  closer: {
    tanglish: "Paravaala paathukkalaam… aarambikkalaamaa?",
    english: "Your journey could be the next story.",
  },
} as const;

/* -------------------------------------------------------------------------- */
/*  Band 13 — who joins                                                       */
/* -------------------------------------------------------------------------- */

export const refWho = {
  /* Not the reference's — ours. This band is the one place the reference's
     outline skips a level: its two column heads are `h3` with no `h2` over
     them, which specification §00 Finding 5 names as a defect to fix on
     rebuild, noting it "costs nothing visually". This is the missing level, and
     it is `sr-only`, so nothing visual changes. It names the band; it makes no
     claim. */
  srHeading: "Who this journey is for",
  forHeading: "This Journey Is For You If…",
  forItems: [
    {
      title: "You want to work on yourself",
      body: "Not because everything is wrong – but because you know there is more to understand and improve.",
    },
    {
      title: "You keep starting but struggle to continue",
      body: "You want to understand why certain patterns repeat in your life.",
    },
    {
      title: "You are tired of only consuming motivational content",
      body: "You want to pause, reflect and actually apply something.",
    },
    {
      title: "You want to rebuild self-trust",
      body: "By starting small and keeping promises to yourself.",
    },
    {
      title: "You want a better relationship with yourself",
      body: "Less self-criticism. More awareness. More conscious growth.",
    },
  ],
  afterHeading: "You may begin to notice…",
  afterItems: [
    "Your thoughts, emotions and patterns more clearly.",
    "Why you repeatedly start and stop.",
    "Self-trust rebuilding through small kept promises.",
    "More focus on your journey instead of comparing.",
    "The ability to return – even after missing a day – without guilt.",
  ],
  notHeading: "This May NOT Be For You If…",
  notItems: [
    "You are looking for a quick fix. 14 days can begin a journey – but it cannot magically solve everything overnight.",
    "You only want motivation and entertainment. This journey involves reflection, dedication and small actions.",
    "You expect someone else to change your life. Your participation matters.",
    "You are not willing to spend a few minutes reflecting on yourself.",
    "You are looking for individual therapy or clinical treatment. This is a psychological growth and learning journey.",
  ],
  notNote: {
    top: "You don't have to be highly disciplined to begin.",
    big: "You just need a willingness to start.",
    close: "Paravaala paathukkalaam… aarambikkalaam.",
  },
} as const;

/* -------------------------------------------------------------------------- */
/*  Band 14 — bonuses                                                         */
/* -------------------------------------------------------------------------- */

export const refBonuses = {
  tag: "Bonus Offer",
  title: { before: "What Comes Free ", accent: "With Your Registration" },
  cards: [
    {
      name: "14-Day Reflection Workbook",
      body: "Reflect, learn and apply your daily insights. A structured companion for your 14-day journey.",
      value: 299,
    },
    {
      name: "Self-Trust Assessment",
      body: "Understand your self-trust, consistency and ability to restart. Take on Day 1 and Day 14 to see your shift.",
      value: 499,
    },
    {
      name: "30-Day Continuation Tracker",
      body: "Keep your 1% Better journey going beyond 14 days. Build the habit beyond the program.",
      value: 299,
    },
  ],
  totalLabel: "Total Bonus Value",
  /* The reference sets the total as three lines, not two — specification §02
     records them as "Total Bonus Value / ₹1,097 — Included FREE / With the
     14-Day Journey at ₹699". The figure and the price are interpolated, the
     words around them are the reference's. `.bonus-total .after` is the third
     line's rule, and it had no text until now. */
  totalValueSuffix: "– Included FREE",
  totalAfter: `With the 14-Day Journey at ${inr(programDetails.price)}`,
} as const;

/** One fact, one place — the reference's ₹1,097 is this sum (CLAUDE.md §4.2). */
export const refBonusTotal = refBonuses.cards.reduce((sum, b) => sum + b.value, 0);

/**
 * The bonus card's value line. The reference writes it "Worth ₹299 — Free" and
 * sets it in italic; §03 names that line as one of the five places italic is
 * used deliberately. It lived in JSX as "Worth {value}" with the "— Free" lost,
 * which both dropped copy and put it outside `content` (CLAUDE.md §1.1).
 */
export const refBonusWorth = (value: number) => `Worth ${inr(value)} – Free`;

/* -------------------------------------------------------------------------- */
/*  Band 15 — price, live-only, promise                                       */
/* -------------------------------------------------------------------------- */

/** The next batch's price. Struck through beneath the founding price. */
export const NEXT_BATCH_PRICE = 1999;

export const refPrice = {
  heading: "Your Next 1% Starts Here.",
  sub: `${programDetails.dateLabel} · ${programDetails.timeShort} · Live on Zoom · Limited Seats`,
  label: `Join the Journey – Founding ${siteConfig.batch} Price`,
  was: `Next batch: ${inr(NEXT_BATCH_PRICE)}`,
  includes: `Includes all 3 bonuses worth ${inr(refBonusTotal)} – absolutely free`,
  bonusLines: refBonuses.cards.map((b) => `${b.name} – Worth ${inr(b.value)}`),
  bonusTotalLine: `Total Bonus Value: ${inr(refBonusTotal)} – Included Free`,
  badges: [
    `${programDetails.dateLabelShort}`,
    `${programDetails.timeShort} Live`,
    "Zoom",
    "Tamil + English",
    "Limited Seats",
  ],
  cta: "[ YES, I WANT TO GIVE MYSELF 14 DAYS → ]",
  note: `Limited registrations · Live on Zoom · ${programDetails.timeShort} · A ${siteConfig.name} Initiative`,
  noRecording: {
    strong: "Live only – no recording",
    rest: ". Because transformation doesn't happen when you collect more videos. It begins when you show up.",
  },
  guarantee: {
    title: "My Promise to You",
    body: "Attend all 14 days. Do the daily reflection every night. If you feel no shift in your awareness, self-trust, or consistency – I will return every rupee. No questions asked. I am that confident in what these 14 days will do for you.",
    fine: "Refund applies to participants who attend all 14 sessions and complete all 14 night reflections.",
  },
} as const;

/* -------------------------------------------------------------------------- */
/*  Band 15.5 — the journey reel                                              */
/* -------------------------------------------------------------------------- */

/**
 * One photograph in the moving strip between the price and the questions.
 *
 * `width` and `height` are the encoded file's own pixels *after* EXIF rotation,
 * not the numbers `sharp.metadata()` reports for the original — see the
 * `.rotate()` note in `scripts/optimize-assets.mjs`. They are load-bearing
 * twice over: `next/image` needs them, and the reel sizes every picture by
 * height and lets the width follow the ratio, so a wrong pair does not letterbox
 * a photograph, it puts the whole row's seamless loop out of register.
 */
export type RefReelPhoto = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

/**
 * Seven photographs from the owner's "LP images" Drive folder, encoded by
 * `npm run optimize:assets` (which records each one's Drive file id, and why
 * the other two in that folder are not here).
 *
 * ── About the alt text ───────────────────────────────────────────────────
 *
 * It describes the scene and does not name anybody, with one exception: the
 * book handover, where the book in frame carries Kaleeswaran's own name and
 * the face matches `kalee/kaleeswaran-portrait.webp`. Everywhere else the
 * people in these photographs are participants at sessions run across several
 * years and several organisations, and this file is not the place to decide
 * who they are — inventing an attribution is exactly what CLAUDE.md §1.1
 * forbids, and a wrong one would be published to a screen reader as fact.
 *
 * None of them is captioned on the page. The reel is a strip of moments, and
 * the copy above it is the only claim made about them.
 */
const reelPhotos = {
  cohortGroup: {
    src: "/journey/cohort-group.webp",
    alt: "A workshop group photographed together at the end of a session, some seated and some standing.",
    width: 747,
    height: 560,
  },
  sessionHall: {
    src: "/journey/session-hall.webp",
    alt: "A session in progress in a college hall, with a group of students standing on the stage.",
    width: 747,
    height: 560,
  },
  leadershipRoom: {
    src: "/journey/leadership-room.webp",
    alt: "A leadership development session in a workplace training room, participants standing around the tables.",
    width: 747,
    height: 560,
  },
  centreSteps: {
    src: "/journey/centre-steps.webp",
    alt: "Participants gathered on the steps outside a skill development centre at the close of a programme.",
    width: 420,
    height: 560,
  },
  teamCollage: {
    src: "/journey/team-collage.webp",
    alt: "A team gathered around a collage they assembled on the ground during a session.",
    width: 682,
    height: 560,
  },
  bookHandover: {
    src: "/journey/book-handover.webp",
    alt: "Kaleeswaran Kamaraj handing a copy of his book to a participant after a talk.",
    width: 420,
    height: 560,
  },
  fullHall: {
    src: "/journey/full-hall.webp",
    alt: "A hall of participants seated for a session, photographed from the stage.",
    width: 840,
    height: 560,
  },
} as const satisfies Record<string, RefReelPhoto>;

/**
 * The two-row moving strip.
 *
 * Not the reference's — this band does not exist in it. The heading and the
 * lead are the owner's own words, supplied with the request, and they are the
 * only copy in the band: the photographs carry it.
 *
 * ── Why both rows hold all seven ─────────────────────────────────────────
 *
 * Splitting seven pictures across two rows would give each row three or four,
 * and a row that short repeats itself inside a single screen width. Each row
 * runs the whole set instead, in its own order and in the opposite direction,
 * so the two never march in step and no photograph sits directly above its own
 * copy for more than an instant. It costs nothing to serve: the two rows and
 * the three loop copies inside each of them all request the same seven files.
 *
 * The orders are chosen so the two upright photographs — `centreSteps` and
 * `bookHandover`, the only two that are taller than they are wide — land in
 * different places in each row, which is what keeps the strip from reading as
 * a grid.
 */
export const refJourneyReel = {
  /* Split-colour heading, the page's signature move (specification §10) —
     except the accent is amber here rather than #3a1a5c, because the band is
     dark and #3a1a5c on #1a0030 is unreadable. One word of amber is the whole
     of the brand accent in this band. */
  title: { before: "A Glimpse Into the ", accent: "Journey" },
  lead: "Real people. Real moments. Small changes that become meaningful.",
  rows: [
    {
      direction: "left",
      /* Named for a screen reader and for anyone who tabs into the row, which
         is a horizontal scroll container. "1 of 2" rather than "top", because
         the two rows are one gallery split for the motion, not two galleries. */
      label: "Photographs from the journey, row 1 of 2",
      photos: [
        reelPhotos.cohortGroup,
        reelPhotos.centreSteps,
        reelPhotos.leadershipRoom,
        reelPhotos.bookHandover,
        reelPhotos.fullHall,
        reelPhotos.teamCollage,
        reelPhotos.sessionHall,
      ],
    },
    {
      direction: "right",
      label: "Photographs from the journey, row 2 of 2",
      photos: [
        reelPhotos.teamCollage,
        reelPhotos.bookHandover,
        reelPhotos.sessionHall,
        reelPhotos.fullHall,
        reelPhotos.centreSteps,
        reelPhotos.cohortGroup,
        reelPhotos.leadershipRoom,
      ],
    },
  ],
} as const;

/* -------------------------------------------------------------------------- */
/*  Band 16 — FAQ                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Eight questions, numbered in the copy itself exactly as the reference numbers
 * them. `tamil` splits answer 3, which sets one clause in Tamil mid-sentence.
 */
export const refFaq = {
  tag: "Frequently Asked Questions",
  title: "Everything You Want to Know",
  items: [
    {
      q: "1. What is 1% Better Every Day?",
      a: "A 14-day live psychological growth journey designed to help you understand your patterns, build self-trust and take small steps towards meaningful change.",
    },
    {
      q: "2. What time are the sessions?",
      a: "5:30 AM. Each live session is designed to be around 45 minutes – focused, practical and complete before your day begins.",
    },
    {
      q: "3. Do I need to attend all 14 days?",
      a: "We strongly encourage it. But remember – progress, not perfection. Paravaala paathukkalaam. If you miss a session, don't give up. Return the next morning.",
    },
    {
      q: "4. What language will the sessions be in?",
      a: "A simple mix of Tamil and English – Tanglish – making psychological concepts easy to understand and relate to. Everyone is comfortable.",
    },
    {
      q: "5. Is this therapy?",
      a: "No. This is a psychological learning and personal growth program, not individual therapy or clinical treatment. If you need clinical support, please seek a licensed professional.",
    },
    {
      q: "6. Do I have to speak or share personally?",
      a: "No. You can participate at your comfort level. There may be opportunities to reflect and interact, but you are never forced to share personal experiences.",
    },
    {
      q: "7. Who can join?",
      a: "Entrepreneurs, professionals, freelancers – and anyone genuinely interested in working on themselves and growing. If you are willing to start, you are welcome.",
    },
    {
      q: "8. What if I complete everything but feel no value?",
      a: "That is where My Promise to You applies. Attend all 14 sessions and complete all daily reflections. If you genuinely feel no shift in your awareness, self-trust or consistency – your payment will be refunded.",
    },
  ],
} as const;

/* -------------------------------------------------------------------------- */
/*  Band 17 — the close                                                       */
/* -------------------------------------------------------------------------- */

export const refFinal = {
  lines: {
    first: "Every Transformation Starts With 1%.",
    second: "Are You Ready to Become 1% Better Every Day?",
    strong: "You Don't Have to Change Everything Today.",
    last: "Just Give Yourself 14 Days.",
  },
  checklist: [
    "Pause for yourself.",
    "Understand yourself better.",
    "Reflect honestly.",
    "Take one small step.",
    "Keep returning.",
    "14 Days. 45 Minutes a Day.",
  ],
  /* Tanglish display line with its English gloss, the same pairing the hero
     uses. Roman script throughout, so no `lang="ta"` anywhere. */
  tanglish: "Paravaala paathukkalaam… aarambikkalaam.",
  tanglishEnglish: "You don't have to be perfect. You just have to begin.",
  cta: "[ YES, I WANT TO GIVE MYSELF 14 DAYS → ]",
  meta: `${inr(programDetails.price)} · Including All 3 Bonuses · Sep 14–27 · ${programDetails.timeShort} · Live on Zoom · A ${siteConfig.name} Initiative`,
  sign: `– Kalee | Counselling Psychologist | ${siteConfig.name} | ${siteConfig.tagline}`,
} as const;

/* -------------------------------------------------------------------------- */
/*  Band 18 — footer                                                          */
/* -------------------------------------------------------------------------- */

export const refFooter = {
  brand: siteConfig.name,
  tagline: siteConfig.tagline,
  copyright: `© 2026 ${siteConfig.name}. All rights reserved.`,
  disclaimer: "Results may vary based on individual commitment and participation.",
} as const;

/* -------------------------------------------------------------------------- */
/*  Assets — specification §05                                                */
/*                                                                            */
/*  The reference ships no binary assets at all: four labelled placeholders    */
/*  and about sixty emoji. Three of the four have a real counterpart already   */
/*  in `public/`; the fourth does not, and keeps the reference's placeholder.  */
/* -------------------------------------------------------------------------- */

export const refAssets = {
  /**
   * A frame at the image's own 1200:811, radius 20px 20px 0 0, filling a track
   * that runs 380px to 470px with the viewport. Replaces "📸 Kalee's photo
   * here".
   *
   * The credentials card, at the owner's request — it replaced the upright
   * portrait, which is why the frame is landscape (see `.hero-photo`).
   *
   * The alt text transcribes the six badges and the name plate because in this
   * image they are lettering, not decoration: drop them and a screen reader
   * gets a photograph where a sighted visitor gets six credentials
   * (CLAUDE.md §13.3, §14.1). The figures are the supplied image's own — they
   * are read off it, not authored here (§1.1).
   */
  heroPhoto: {
    /* The owner's updated card, supplied as `updated_hero.png` and encoded by
       `npm run optimize:assets` (1.3 MB PNG -> 121 kB WebP). The previous
       `kalee-hero-credentials.webp` is still in `public/` and still referenced
       by nothing; left on disk rather than deleted (CLAUDE.md §19). */
    src: "/kalee/hero-updated.webp",
    alt:
      "Kaleeswaran Kamaraj, Transformations Psychologist and Leadership Trainer. " +
      "15+ years experience · 100+ organizations trained · 300+ training programs delivered · " +
      "15+ modalities of certifications · 2,000+ hours therapy and coaching · PhD scholar. " +
      "Founder of KnowMind Universe.",
  },
  /** 150px circle with a 3px amber ring. Replaces the 📸 glyph on the card. */
  portrait: {
    src: "/kalee/kaleeswaran-portrait.webp",
    alt: "Kaleeswaran Kamaraj.",
  },
} as const;

/* -------------------------------------------------------------------------- */
/*  Divergences found while transcribing (specification §09, task A9)          */
/*                                                                            */
/*  Recorded rather than resolved. Each is a place where the reference and the */
/*  approved deck in `content.ts` say the same thing differently. The          */
/*  programme page renders the reference's wording, per the reproduction       */
/*  brief; the deck's wording is untouched above it in `content.ts`. Neither   */
/*  is a fact conflict — no price, date, time, seat count, contact detail or   */
/*  claim differs between them, and all of those are read from `config.ts` by  */
/*  both.                                                                     */
/*                                                                            */
/*   1. Day titles and descriptions. The deck writes Day 1 as "What's really   */
/*      going on within you?", the reference as "Notice what is within you."   */
/*      All fourteen differ in wording; none differ in subject. The deck also  */
/*      names Day 11 "Doing Nothing & Being" and Day 14 "Reflection &          */
/*      Continuation" where the reference has "Being" and "Reflection".        */
/*   2. Client names. Reference: "McKinsey & Co.", "Titan Company",            */
/*      "ITC Limited", "TN Police Dept". Deck: "McKinsey & Company", "Titan",  */
/*      "ITC", "TN Police". Same eighteen organisations, and the reference's   */
/*      order differs from the deck's.                                        */
/*   3. Tamil. The deck's `tamil.itsOkayLetsSee` is                            */
/*      The reference set this line in Tamil with a heart after it. The     */
/*      page is English-only at the owner's request, so it is carried    */
/*      as its English sense rather than transcribed.                    */
/*      it, per the brief; neither was machine-translated or altered.          */
/*   4. FAQ. Same eight subjects, the reference numbering them in the copy      */
/*      itself and phrasing several answers more briefly.                     */
/*   5. Testimonials. The six names and quotes are identical in both. Only     */
/*      the role line differs: the reference gives all six "1% Better Program  */
/*      — Founding Batch".                                                    */
/* -------------------------------------------------------------------------- */

/** Re-exported so a section never has to reach past this module for money. */
export { formatINR, inr };
