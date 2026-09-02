import { programDetails } from "@/lib/config";
import { AGE_MAX, AGE_MIN, type AnswerKey, type GenderValue } from "@/lib/validation";

/**
 * All repeatable page content, kept as structured data so copy can be updated
 * without touching layout code.
 *
 * SOURCE OF TRUTH: the KnowMind Universe programme brief. Testimonials,
 * credentials, metrics, media names and client names are reproduced as
 * supplied — none are invented or embellished.
 */

/* -------------------------------------------------------------------------- */
/*  Navigation                                                                */
/* -------------------------------------------------------------------------- */

export const navLinks = [
  { label: "The Journey", href: "#journey" },
  { label: "Who It's For", href: "#who-its-for" },
  { label: "About Kalee", href: "#meet-kaleeswaran" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
] as const;

/* -------------------------------------------------------------------------- */
/*  Section 1 — the hero                                                      */
/*                                                                            */
/*  Reproduced from the approved content deck, slide 1. The em dashes, the     */
/*  question mark and the ellipsis are all as supplied — do not "tidy" them.   */
/* -------------------------------------------------------------------------- */

export const hero = {
  eyebrow: "Every transformation starts with 1%",

  /**
   * The headline, split so "1% Better" can carry the honey accent the brand
   * has always given it. Concatenated back together it is the deck's sentence
   * exactly: "Are You Ready to Understand Yourself Better—and Become 1% Better
   * Every Day?"
   */
  headline: {
    before: "Are You Ready to Understand Yourself Better–and Become ",
    accent: "1% Better",
    after: " Every Day?",
  },

  lead:
    "A 14-Day Live Psychological Growth Journey to help you notice your patterns, " +
    "build self-trust, and create meaningful change–one small step at a time.",

  /** The four things the journey is actually about. */
  points: [
    "Understand Yourself",
    "Notice Your Patterns",
    "Build Self-Trust",
    "Keep Returning",
  ],

  /**
   * The commitment, in four beats. These run along the base of the hero, which
   * is where the old fact strip already sat — same architecture, the deck's
   * words instead of a specification list.
   */
  details: [
    "14 Days",
    "45 Minutes a Day",
    "One Small Commitment",
    "One Better Relationship With Yourself",
  ],

  /**
   * "LIVE | 5:30 AM | Zoom". The time comes from `programDetails` rather than
   * being typed again here — it is a programme fact with one home (CLAUDE.md
   * §1.1), and the deck and the config already agree on it.
   */
  live: ["Live", programDetails.timeShort, "Zoom"] as const,

  /** Sits beside the price. The deck's own scarcity wording. */
  batchNote: "Limited Batch",

  /**
   * The call to action, in the visitor's own language.
   *
   * This steps outside the "Begin your 1% journey" vocabulary that CLAUDE.md
   * §7.2 fixes, with explicit approval: it is the deck's CTA, and asking the
   * question in Tamil is the whole point of it. Set in sentence case rather
   * than the deck's all-caps because every other button on the page is, and a
   * shouting button would read as a different brand.
   */
  cta: "Aarambikalama?",

  /**
   * Kaleeswaran's signature line, romanised exactly as the deck sets it.
   *
   * No `lang="ta"` on this one, deliberately. The attribute switches a screen
   * reader into Tamil pronunciation and the page into Noto Sans Tamil, and
   * both are wrong for Latin-script Tanglish — the Tamil-script lines
   * elsewhere in this file are the ones that need it.
   */
  closing: "Paravala Paathukalam… Aarambikalam. ❤️",
} as const;

/* -------------------------------------------------------------------------- */
/*  Section 1b — the VSL                                                      */
/* -------------------------------------------------------------------------- */

export type Vsl = {
  /** The deck's phrase. Set as the section's heading; nothing else is added. */
  heading: string;
  /**
   * The recording itself.
   *
   * Supplied, and live. It stays nullable because the section still has to
   * render something honest if it is ever unset — `VSLSection` falls back to
   * the reference's labelled placeholder rather than an empty frame
   * (CLAUDE.md §9.2).
   *
   * The ten-second clip at `/kalee/kalee-intro.mp4` is NOT this video. It is a
   * silent, looping background plate used behind the registration questions,
   * and presenting it as Kaleeswaran's introduction would be exactly the fake
   * implementation §0.4 forbids. That is still true; this is the real one.
   */
  src: string | null;
  /** Required whenever `src` is set — the frame shown before it plays. */
  poster: string | null;
  /** Describes the recording for anyone who cannot watch it. */
  label: string;
  /** The footage's own aspect ratio, so the frame can never letterbox it. */
  aspect: string;
};

export const vsl: Vsl = {
  heading: "Oru Chinna Kelvi Ungalukku…",
  /* Both files are written by `npm run optimize:video` from `VSL_video.mp4` in
     the project root — the video remuxed for streaming, the poster cut from it
     at one second. */
  src: "/kalee/vsl.mp4",
  poster: "/kalee/vsl-poster.webp",
  label: "Kaleeswaran K introduces the 14-day 1% Better Every Day journey.",
  /* The footage's own 832x464, not the 16/9 this defaulted to while it was
     empty. They are close but not equal, and the difference is the difference
     between a frame that fits the picture and one that letterboxes it. */
  aspect: "832 / 464",
};

/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*  Section 2b — does this sound like you? / you are not lazy                 */
/*                                                                            */
/*  Reproduced from the approved content deck, slide 3, in the deck's own      */
/*  order. The ellipses, the title case and the lower-case "and the cycle      */
/*  repeats" are as supplied — they are the sentence continuing, not a typo.   */
/* -------------------------------------------------------------------------- */

export type ProblemBeat = {
  /** The recognition, set bright. */
  lead: string;
  /** What undoes it, set quiet. The contrast is the argument. */
  follow: string;
};

export const problem = {
  eyebrow: "Does this sound like you?",

  /**
   * Two halves, and they are coloured differently on purpose: the first is what
   * the visitor believes about themselves, the second is what keeps happening
   * to them. Bright, then dimmed.
   */
  heading: {
    hopeful: "You Know You Can Do Better…",
    pull: "But Something Keeps Pulling You Back.",
  },

  /** The loop, in four beats rather than six rows. */
  beats: [
    {
      lead: "You know what you need to do.",
      follow: "But knowing doesn't always become action.",
    },
    {
      lead: "You genuinely want to change.",
      follow: "You start with energy and good intentions.",
    },
    {
      lead: "But somewhere along the way, you stop.",
      follow: "Life happens. Motivation drops. Old patterns return.",
    },
    {
      lead: "Then you start again…",
      follow: "and the cycle repeats.",
    },
  ] satisfies ProblemBeat[],

  /** The turn. Split so "not" can carry the honey, as it always has. */
  turn: {
    before: "You are ",
    accent: "not",
    after: " lazy.",
  },
  turnSupport: "Maybe you are simply exhausted from starting again and stopping again.",

  /** The realisation the section hands over on. */
  realisation: "Maybe You Don't Need Another Motivation Session.",
  realisationSupport: "Maybe it's time to understand yourself better.",
  /** Slide 3's closing line — what "understand yourself" actually means. */
  realisationDetail: "Your patterns. Your inner voice. Your relationship with yourself.",
} as const;

/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*  Section 3b — what is 1% Better Every Day?                                 */
/*                                                                            */
/*  The approved explainer copy, in the approved order. Four stages, one short */
/*  line each — no theory added, and no terminology that is not here.          */
/* -------------------------------------------------------------------------- */

export type PhilosophyStage = {
  key: "awareness" | "choice" | "repetition" | "growth";
  index: string;
  title: string;
  body: string;
};

export const philosophy = {
  eyebrow: "What is 1% Better Every Day?",

  /**
   * The release, then the instruction. The second line is the most important
   * sentence in the section and is set as such.
   */
  heading: {
    release: "You Don't Have to Change Your Whole Life Today.",
    instruction: {
      before: "You Just Have to Begin With ",
      accent: "One Small Step.",
    },
  },

  wantsIntro: "Maybe you want to:",
  wants: [
    "Wake up earlier.",
    "Stop overthinking.",
    "Be more consistent.",
    "Build better habits.",
    "Improve your relationships.",
    "Feel more confident.",
  ],
  overwhelm: "But trying to change everything at once can feel overwhelming.",

  /** The reframe: the question that overwhelms, and the one that does not. */
  approach: "1% Better Every Day is a different approach.",
  insteadLabel: "Instead of asking",
  insteadQuestion: "How do I change my whole life?",
  askLabel: "You ask",
  askQuestion: "What is one small thing I can do today?",

  compounding:
    "That one small action may feel small. But repeated over time, small actions " +
    "create new patterns. And new patterns create meaningful change.",

  stagesHeading: "The 1% Better Philosophy",
  stages: [
    {
      key: "awareness",
      index: "01",
      title: "Awareness",
      body: "Notice what is happening within you.",
    },
    {
      key: "choice",
      index: "02",
      title: "Choice",
      body: "Choose what you want to do differently.",
    },
    {
      key: "repetition",
      index: "03",
      title: "Repetition",
      body: "Practice it again and again.",
    },
    {
      key: "growth",
      index: "04",
      title: "Growth",
      body: "Allow small changes to become meaningful transformation.",
    },
  ] satisfies PhilosophyStage[],

  closing: {
    heading: "This Is Not About Perfection.",
    intro: "It's about becoming:",
    /** One sentence in the deck, and kept as one line here — three stacked
        fragments would have cost a third of a phone screen for no gain. */
    items: "A little more aware. A little more honest. A little more intentional.",
    signature: {
      before: "Just ",
      accent: "1% Better.",
      after: " Every Day.",
    },
  },
} as const;

/* -------------------------------------------------------------------------- */
/*  Section 4 — the 14-day journey                                            */
/* -------------------------------------------------------------------------- */

export type JourneyDay = {
  day: number;
  title: string;
  description: string;
  week: 1 | 2;
};

export const journeyDays: JourneyDay[] = [
  { day: 1, week: 1, title: "Awareness", description: "What’s really going on within you?" },
  { day: 2, week: 1, title: "Patterns", description: "Recognising the loops you keep repeating." },
  { day: 3, week: 1, title: "Self-Trust", description: "Why you stop trusting yourself – and how to rebuild it." },
  { day: 4, week: 1, title: "Playfulness", description: "Rediscovering curiosity, lightness and possibility." },
  { day: 5, week: 1, title: "Comparison", description: "How comparison quietly affects your confidence." },
  { day: 6, week: 1, title: "Inner Coach", description: "Learning to speak to yourself differently." },
  { day: 7, week: 1, title: "Integration", description: "Connecting what you’ve noticed so far." },
  { day: 8, week: 2, title: "Gratitude", description: "Shifting your attention to what’s already working." },
  { day: 9, week: 2, title: "Dreams", description: "Giving yourself permission to want more." },
  { day: 10, week: 2, title: "Vision", description: "Turning what you want into a clearer direction." },
  { day: 11, week: 2, title: "Doing Nothing & Being", description: "Learning to be without constantly doing." },
  { day: 12, week: 2, title: "Repetition & Resilience", description: "Why consistency matters more than motivation." },
  { day: 13, week: 2, title: "Self-Love", description: "Building a healthier relationship with yourself." },
  { day: 14, week: 2, title: "Reflection & Continuation", description: "Looking back. Choosing what you want to carry forward." },
];

/**
 * The two halves of the journey.
 *
 * `days` is derived rather than restated, so a day can never end up in the
 * wrong week or be listed twice. `focus` is the deck's own one-line summary of
 * each week and is what visually separates them — same design language, two
 * different contents (CLAUDE.md §4.2).
 */
export const journeyWeeks = [
  {
    week: 1 as const,
    label: "Week 1",
    title: "Understand Yourself",
    focus: "Awareness • Patterns • Self-Trust • Inner Dialogue",
    days: journeyDays.filter((d) => d.week === 1),
  },
  {
    week: 2 as const,
    label: "Week 2",
    title: "Move Forward",
    focus: "Gratitude • Dreams • Vision • Resilience • Self-Love",
    days: journeyDays.filter((d) => d.week === 2),
  },
];

/**
 * The section's own heading. Approved deck copy; the three lead lines are set
 * as three lines because that is the rhythm they are written in.
 */
export const journey = {
  title: { before: "Your 14-Day ", accent: "Growth Journey" },
  leadLines: [
    "Two Weeks.",
    "One Small Commitment.",
    "A Better Relationship With Yourself.",
  ],
} as const;

/* -------------------------------------------------------------------------- */
/*  Section 4b — what will you explore in 14 days?                            */
/*                                                                            */
/*  Four areas, four terms each, exactly as approved. The terms are the        */
/*  deck's own vocabulary — do not rename them, and do not add a fifth.        */
/* -------------------------------------------------------------------------- */

export type ExploreArea = {
  key: string;
  title: string;
  items: readonly string[];
};

export const explore = {
  title: { before: "What Will You ", accent: "Explore", after: " in 14 Days?" },
  areas: [
    {
      key: "mind",
      title: "Your Mind",
      items: ["Awareness", "Patterns", "Inner Critic", "Comparison"],
    },
    {
      key: "self",
      title: "Your Relationship With Yourself",
      items: ["Self-Trust", "Playfulness", "Gratitude", "Self-Love"],
    },
    {
      key: "direction",
      title: "Your Direction",
      items: ["Dreams", "Bucket List", "Vision", "Goals"],
    },
    {
      key: "stability",
      title: "Your Inner Stability",
      items: ["Non-Reactivity", "Repetition", "Resilience", "Reflection"],
    },
  ] satisfies ExploreArea[],
} as const;

/* -------------------------------------------------------------------------- */
/*  Section 4c — how does the 14-day journey work?                            */
/*                                                                            */
/*  What a participant actually does, start to finish.                         */
/* -------------------------------------------------------------------------- */

export type JourneyStepHow = {
  index: string;
  title: string;
  description: string;
};

export const howItWorks = {
  title: { before: "How Does the 14-Day Journey ", accent: "Work?" },
  steps: [
    {
      index: "01",
      title: "Join the Journey",
      description: "Register and commit to yourself for 14 days.",
    },
    {
      /* The time is read from `programDetails`, never typed again — it is a
         programme fact with one home (CLAUDE.md §1.1). */
      index: "02",
      title: `Join Live at ${programDetails.timeShort}`,
      description: "Show up for the live session on Zoom.",
    },
    {
      index: "03",
      title: "Reflect & Practice",
      description: "Each day, you’ll learn, reflect, and take one small action.",
    },
    {
      index: "04",
      title: "Stay Connected for 14 Days",
      description: "Stay connected with the group and keep returning to the practice.",
    },
    {
      index: "05",
      title: "Complete Your Journey",
      description: "Look back at what you’ve noticed, learned, and changed.",
    },
  ] satisfies JourneyStepHow[],

  closing: "Carry the practice forward.",
} as const;

/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*  Section 6 — who it's for                                                  */
/* -------------------------------------------------------------------------- */

/**
 * "This journey is for you if…" — the approved seven.
 *
 * Statements of recognition, so they are rendered as one sentence each with no
 * title/description split and no per-item icon. Nothing here names a condition
 * or a diagnosis, and nothing may be added that does.
 */
export const forYouIf = [
  "You feel stuck even though you know you can do better.",
  "You want to understand yourself–not just improve your productivity.",
  "You keep starting things but struggle to stay consistent.",
  "You overthink decisions or compare yourself with others.",
  "You want to rebuild self-trust and confidence.",
  "You are willing to reflect honestly and try small changes.",
  "You want a simple, practical approach to personal growth.",
];

export const outcomes = [
  "Notice your thoughts, emotions and patterns more clearly.",
  "Understand why you repeatedly start and stop.",
  "Rebuild trust in yourself through small kept promises.",
  "Focus on your own journey instead of constantly comparing.",
  "Return – even after you miss a day – without guilt.",
];

export const notForYouHeading = "This may not be for you if…";

/**
 * Expectation-setting, not exclusion. The last line is the deck's own wording
 * and stays exactly as supplied — it names what someone might be looking for,
 * which is not the same sentence as a disclaimer about what this programme is,
 * and it must not be rewritten into one.
 */
export const notForYou = [
  "You are looking for a quick fix without doing any inner work.",
  "You want motivation without reflection or practice.",
  "You expect someone else to change your life for you.",
  "You are not willing to look at your own patterns.",
  "You are looking for therapy or clinical treatment.",
];

/* -------------------------------------------------------------------------- */
/*  Section 8 — authority                                                     */
/* -------------------------------------------------------------------------- */

export const kalee = {
  name: "Kaleeswaran K",
  shortName: "Kalee",
  roles: [
    "Counselling Psychologist",
    "International Experiential Corporate Trainer",
    "Coach",
    "Keynote Speaker",
    "International Outbound Trainer",
    "PhD Scholar in Psychology",
  ],
  founderOf: "OOKKAM Foundation",
  founderRole: "Founder and Director",
  /** The question his work circles, exactly as the deck asks it. */
  quote: "Why do we know what to do… but still struggle to do it consistently?",
  quoteFollowUp:
    "Knowledge alone doesn’t create change. Awareness, practice and repetition do.",
} as const;

/* -------------------------------------------------------------------------- */
/*  Meet the person behind the journey                                        */
/*                                                                            */
/*  The single authority section. It was consolidated from two — an early     */
/*  "Meet Kalee" introduction and a later "Authority" block — which repeated  */
/*  the same quote and the same three numbers. Everything he is claimed to    */
/*  be is stated here exactly once.                                           */
/* -------------------------------------------------------------------------- */

export type MeetMetricKey =
  | "experience"
  | "sessions"
  | "professionals"
  | "organisations"
  | "rating";

export type MeetMetric = {
  key: MeetMetricKey;
  /** Rendered verbatim. These are verified claims, not animated counters. */
  value: string;
  suffix: string;
  label: string;
};

export const meetKalee = {
  eyebrow: "Meet Kalee",
  /** The deck's own positioning for this section. */
  heading: "Meet the Psychologist & Trainer",
  /**
   * The opening, in the first person.
   *
   * The section used to introduce him in the third person, which read as a
   * write-up about someone. The deck has him speak — and since the whole point
   * of this section is that a visitor decides whether they trust a person, his
   * own voice does more than a description of him can.
   */
  story:
    "For the past 15+ years, I have been working with individuals, professionals, " +
    "leaders and organisations to understand one important question:",
  foundation: "This is the foundation of how I work.",
  approachHeading: "My approach",
  approachIntro: "My approach is simple:",
  /** The formal name, used for the attribution under his question. */
  name: kalee.name,
  /**
   * The headline role. The remaining five live in `kalee.roles` and are
   * rendered separately, so this one is never printed twice.
   */
  role: "Counselling Psychologist",
  intro:
    "NIMHANS trained, and Founder and Director of the OOKKAM Foundation. Fifteen years of his work has circled a single problem: why capable people struggle to do what they already know.",
  rolesHeading: "Professional roles",
  experienceHeading: "Where that experience comes from",
  photosHeading: "In the room",
  credentialsHeading: "Training and credentials",
} as const;

/**
 * The five authority numbers, stated once for the whole page.
 *
 * Rendered verbatim rather than counted up: these are verified claims, and a
 * counter mid-flight briefly displays a number that is not true.
 */
/**
 * The five things he does, as the deck lists them. Five short lines and no
 * methodology around them — that restraint is the content, not an omission.
 */
export const approach = [
  "Understand yourself better.",
  "Become aware of your patterns.",
  "Ask better questions.",
  "Take meaningful action.",
  "Keep returning to the practice.",
];

/**
 * The human statement the section rests on. Not a marketing claim, and it must
 * not be edited into one — the first line is a limit he is stating about
 * himself, and it is what makes the second line credible.
 */
export const positioning = {
  limit: "I cannot change your life for you.",
  offer: "But I can walk with you, guide you, and help you understand the path better.",
} as const;

export const meetKaleeMetrics: MeetMetric[] = [
  { key: "experience", value: "15", suffix: "+", label: "Years Experience" },
  { key: "sessions", value: "2,000", suffix: "+", label: "Coaching & Therapy Sessions" },
  { key: "professionals", value: "30,000", suffix: "+", label: "Professionals Impacted" },
  { key: "organisations", value: "100", suffix: "+", label: "Organisations Trained" },
  { key: "rating", value: "4.9", suffix: "", label: "Rating across 258 Google reviews" },
];

export type AuthorityHighlight = {
  title: string;
  description: string;
};

export const authorityHighlights: AuthorityHighlight[] = [
  {
    title: "McKinsey & Company",
    description: "Worked with one of the world's top consulting firms.",
  },
  {
    title: "Tamil Nadu Police Department",
    description: "1,200+ police personnel trained under NIMHANS Bangalore.",
  },
  {
    title: "International Trainer",
    description: "Programs delivered across India and internationally.",
  },
];

export const credentials = [
  "Dual MSc – Counselling and Psychotherapy",
  "MSc Applied Psychology in Clinical",
  "PG Diploma in Yoga",
  "NIMHANS Trained",
  "NLP Practitioner",
  "Clinical Hypnotherapist",
  "Corporate Master Trainer – IATD",
  "CBT and REBT Certified",
  "Expressive Arts Therapist",
  "Playback Theatre Artist",
  "PoSH Enabled Trainer",
  "PhD Scholar in Psychology",
];

/**
 * The roles left to print as chips.
 *
 * Drops the headline role (already shown under his name) and anything the
 * source also lists as a credential — "PhD Scholar in Psychology" appears in
 * both lists, and should be shown once, under credentials.
 */
export const secondaryRoles = kalee.roles.filter(
  (role) => role !== meetKalee.role && !credentials.includes(role),
);

export const trainingPhotos = [
  {
    src: "/photos/experiential-circle.webp",
    alt: "Kaleeswaran K facilitating an experiential group reflection circle with participants holding their workbooks.",
    caption: "Experiential group reflection",
  },
  {
    src: "/photos/leadership-program.webp",
    alt: "Kaleeswaran K delivering a Leadership Development Program session to a standing group of corporate participants.",
    caption: "Leadership development program",
  },
  {
    src: "/photos/experiential-activity.webp",
    alt: "Kaleeswaran K running a hands-on experiential team activity with corporate participants in a training room.",
    caption: "Hands-on experiential training",
  },
];

/* -------------------------------------------------------------------------- */
/*  Section 9 — media + clients                                               */
/* -------------------------------------------------------------------------- */

/**
 * Headings for the credibility blocks, from the deck.
 *
 * `organisationsNote` is not decoration. The deck's heading is "Trusted by
 * Professionals & Organisations", and a list of company names under it alone
 * would read as those companies endorsing this programme — which is not what
 * the source establishes. The note states the actual relationship: he trained
 * in them. Do not remove it and leave the heading.
 */
export const credibility = {
  mediaHeading: "Media / Featured",
  organisationsHeading: "Trusted by Professionals & Organisations",
  organisationsNote: "Organisations Kaleeswaran has trained in.",
  testimonialsEyebrow: "Testimonials",
  testimonialsHeading: "What Participants Say About the Journey",
  testimonialsLead:
    "The best way to understand a journey is to hear from the people who experienced it.",
} as const;

/**
 * Rendered as typographic wordmarks, not logo files.
 *
 * Slide 7 of the deck does carry real logo images for these outlets, and three
 * of them were checked against this list by eye (Sun News, Maalai Malar,
 * Hello FM 106.4 — all present here). They are not shipped: several are
 * scraped thumbnails, and redistributing third-party brand marks is an owner's
 * decision, not an agent's. Drop licensed files into /public/logos and swap
 * the marquee's `renderItem` when that is settled.
 */
export const mediaOutlets = [
  "Sun News",
  "Thanthi TV",
  "Vijay TV",
  "Vikatan",
  "Hello FM 106.4",
  "Puthiya Thalaimurai",
  "Puthu Yugam",
  "Maalai Malar",
  "The Federal",
];

export const clientLogos = [
  "McKinsey & Company",
  "Siemens Gamesa",
  "Daimler India",
  "TVS Electronics",
  "Bosch",
  "Ashok Leyland",
  "Titan",
  "ITC",
  "Amara Raja",
  "Renault Nissan",
  "FLSmidth",
  "TN Police",
  "HP India",
  "Tata Tea",
  "Samsung",
  "Saint Gobain",
  "Aditya Birla",
  "Greater Chennai Corp",
];

/* -------------------------------------------------------------------------- */
/*  Section 10 — testimonials                                                 */
/* -------------------------------------------------------------------------- */

export type Testimonial = {
  name: string;
  quote: string;
  /**
   * Portrait of the person who said this, e.g. "/testimonials/anandha.webp".
   *
   * Deliberately absent on every entry: these are six real participants, and
   * putting a stock or generated stranger's face beside a real person's words
   * would be fabricated social proof. Until a real photograph is supplied and
   * cleared, the card falls back to an initial drawn from the name — the same
   * honesty rule the media wordmarks follow.
   *
   * To add one: run the image through `npm run optimize:assets`, drop it in
   * `public/testimonials/`, and set this field plus `portraitAlt`.
   */
  portrait?: string;
  /** Describes the person in the portrait. Required whenever `portrait` is set. */
  portraitAlt?: string;
  /** Their own description of what they do. Shown only where supplied. */
  role?: string;
};

export const testimonials: Testimonial[] = [
  {
    name: "Deepa Sai",
    role: "Entrepreneur",
    quote:
      "The content touched things I knew but never faced honestly. Day 1 itself created a real shift.",
  },
  {
    name: "Saranyadevi",
    role: "Accountant",
    quote:
      "This program helped me understand why I was losing focus. Now I know how to return when I drift.",
  },
  {
    name: "Vijaya Saravanan",
    role: "Entrepreneur",
    quote:
      "The importance of measurable goals and daily progress became clearer. Kalee made that real.",
  },
  {
    name: "Pavithra",
    role: "Psychologist",
    quote:
      "This 14-day journey helped me become more aware, compassionate, and conscious in how I " +
      "respond to life. I loved that it wasn’t about perfection - it was simply about becoming " +
      "1% better every day.",
  },
];

/**
 * Video testimonials.
 *
 * `src` is intentionally null until the real recordings are supplied — the UI
 * renders a clearly-labelled placeholder rather than inventing content.
 */
export type VideoTestimonial = {
  id: string;
  label: string;
  src: string | null;
  poster: string | null;
};

export const videoTestimonials: VideoTestimonial[] = [
  { id: "video-1", label: "Video testimonial 1", src: null, poster: null },
  { id: "video-2", label: "Video testimonial 2", src: null, poster: null },
  { id: "video-3", label: "Video testimonial 3", src: null, poster: null },
];

/* -------------------------------------------------------------------------- */
/*  Section 11 — what you get                                                 */
/* -------------------------------------------------------------------------- */

/**
 * What you get, as the deck states it.
 *
 * The headline is the programme itself; the four rows are the deck's own
 * clarity box, verbatim. Duration and time are read from `programDetails`
 * rather than typed again — they are programme facts with one home.
 */
export const offer = {
  headline: "14-Day Live Psychological Growth Journey",
  specs: [
    { label: "Duration", value: `${programDetails.days} Days` },
    { label: "Format", value: programDetails.platform },
    { label: "Time", value: programDetails.timeShort },
    { label: "Focus", value: "Psychological Growth & Daily Transformation" },
  ],
} as const;

/* -------------------------------------------------------------------------- */
/*  Section 12 — bonuses                                                      */
/* -------------------------------------------------------------------------- */

export type Bonus = {
  index: string;
  title: string;
  description: string;
  detail?: string;
  value: number;
};

export const bonuses: Bonus[] = [
  {
    index: "01",
    title: "14-Day Reflection Workbook",
    description: "Reflect, learn and apply your daily insights.",
    value: 299,
  },
  {
    index: "02",
    title: "Self-Trust Assessment",
    description: "Understand your self-trust, consistency and ability to restart.",
    value: 499,
  },
  {
    index: "03",
    title: "30-Day Continuation Tracker",
    description: "Keep your 1% Better journey going beyond 14 days.",
    value: 299,
  },
];

/** The deck's own line for what these are. */
export const bonusesNote = "Included FREE with the 14-Day Journey.";

/** Derived, never asserted — 299 + 499 + 299 = 1,097, the deck's figure. */
export const totalBonusValue = bonuses.reduce((sum, b) => sum + b.value, 0);

/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*  Section 15 — why live                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Why the format is live.
 *
 * A note on the wording, because it is worth knowing before anyone edits it.
 * Slide 14 of the deck was evidently written *from* this section: its four
 * titles, its "no recording for the first four batches" line and its closing
 * paragraph are almost word for word what stood here. The brief for this phase
 * then supplied shorter, plainer descriptions than either.
 *
 * The short ones are what render, because plainer is the point of this whole
 * redesign — the longer versions are the kind of writing the audience was
 * found to bounce off. The deck's own longer wording is in the source deck
 * (slide 14) if it is ever wanted back.
 */
export const live = {
  eyebrow: "Live only",
  title: "Why live?",
  noRecording:
    "There is no recording for the first four batches. That is a deliberate choice, " +
    "not a limitation.",
  conclusion: "The live format is part of the journey.",
} as const;

export const liveReasons = [
  {
    title: "Presence",
    description: "Showing up creates commitment.",
  },
  {
    title: "Reflection",
    description: "You get space to pause and look within.",
  },
  {
    title: "Participation",
    description: "You are not just listening. You are actively engaging.",
  },
  {
    title: "Community",
    description: "You are not doing this alone.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Section 17 — FAQ                                                          */
/* -------------------------------------------------------------------------- */

export type FaqItem = {
  question: string;
  answer: string;
};

export const faqItems: FaqItem[] = [
  {
    question: "What is 1% Better Every Day?",
    answer:
      "A 14-day live psychological growth journey designed to help you understand your " +
      "patterns, build self-trust and take small steps towards meaningful change.",
  },
  {
    question: "What time are the sessions?",
    /* The time is read from `programDetails`, not typed again (CLAUDE.md §1.1). */
    answer: `${programDetails.timeShort}. Each live session is designed to be around ${programDetails.durationMinutes} minutes.`,
  },
  {
    question: "Do I need to attend all 14 days?",
    answer:
      "We strongly encourage you to attend all 14 days to experience the complete journey. " +
      "But remember: progress, not perfection. If you miss a session, don’t give up on the journey.",
  },
  {
    question: "What language will the sessions be in?",
    answer:
      "The sessions will be conducted in a simple mix of Tamil and English, making " +
      "psychological concepts easy to understand and relate to.",
  },
  {
    question: "Is this therapy?",
    answer:
      "No. This is a psychological learning and personal growth program, not individual " +
      "therapy or clinical treatment.",
  },
  {
    question: "Do I have to speak or share personally?",
    answer:
      "No. You can participate at your comfort level. There may be opportunities to reflect " +
      "and interact, but you are not forced to share personal experiences.",
  },
  {
    question: "Who can join?",
    answer:
      "Entrepreneurs, professionals, freelancers–and anyone genuinely interested in working " +
      "on themselves and growing.",
  },
  {
    question: "What if I complete everything but feel no value?",
    answer:
      "That is where My Promise to You applies. Attend all 14 sessions and complete all 14 " +
      "daily reflections. If you genuinely feel no shift in your awareness, self-trust or " +
      "consistency, your payment will be refunded according to the stated promise.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Section 16 — guarantee                                                    */
/* -------------------------------------------------------------------------- */

export const guarantee = {
  heading: "My Promise To You",
  body: [
    "Attend all 14 days.",
    "Complete the daily reflection every night.",
    "If you feel no shift in your awareness, self-trust, or 1% Better on any habits – " +
      "I will return every rupee.",
  ],
  emphasis: "No questions asked.",
  /** The deck's own line, and the reason the promise is worth making. */
  confidence: "I am that confident in what these 14 days will do for you.",
  /**
   * The refund conditions, and only the ones the deck states.
   *
   * A sentence stood here requiring the participant to share their completed
   * workbook before a refund would be processed. That condition appears
   * nowhere in the approved source, and an invented condition on a refund is
   * the most damaging kind of invention this page could carry — it is the one
   * that costs somebody money. It is gone.
   */
  conditions:
    "Refund applies to participants who attend all 14 sessions and complete all 14 " +
    "daily reflections.",
} as const;

/* -------------------------------------------------------------------------- */
/*  The closing decision                                                      */
/*                                                                            */
/*  Approved deck copy, slide 17. The offer summary underneath it restates     */
/*  nothing new — every figure is read from `programDetails`, `offer` or        */
/*  `bonuses`, so the last thing a visitor reads cannot disagree with the      */
/*  sections that made the promise.                                           */
/* -------------------------------------------------------------------------- */

export const finalCta = {
  opening: "Every Transformation Starts With 1%.",
  question: "Are You Ready to Become 1% Better Every Day?",
  release: "You Don’t Have to Change Everything Today.",
  ask: "Just Give Yourself 14 Days.",

  /** For the next 14 days. Five verbs, nothing added around them. */
  actions: [
    "Pause for yourself.",
    "Understand yourself better.",
    "Reflect honestly.",
    "Take one small step.",
    "Keep returning.",
  ],

  summaryHeading: "One journey towards yourself",
  bonusesHeading: "Including all 3 bonuses",
  totalLabel: "Total bonus value",
  cta: "Yes, I want to give myself 14 days",
  /** The deck's own footnote under the button. */
  footnote: "Limited registrations for the upcoming batch.",
} as const;

/* -------------------------------------------------------------------------- */
/*  Tamil lines used throughout the page                                      */
/* -------------------------------------------------------------------------- */

export const tamil = {
  itsOkayLetsSee: "பரவால … பார்த்துக்கலாம் ஆரம்பிக்கலாம்.",
  itsOkay: "பரவால பார்த்துக்கலாம்.",
  startAgain: "திரும்ப ஆரம்பிக்கலாம்.",
  nextDay: "அடுத்த நாள் ஆரம்பிக்கலாம்.",
} as const;

/* -------------------------------------------------------------------------- */
/*  Begin your journey — the six registration questions                       */
/*  Asked one at a time, so each one carries its own line of copy rather than  */
/*  sitting as a label above a box.                                           */
/* -------------------------------------------------------------------------- */

export type JourneyStep = {
  key: AnswerKey;
  /** The question itself, set as the field's visible label. */
  question: string;
  /** A quiet line under the question. Omitted where the question is enough. */
  note?: string;
  placeholder?: string;
  field:
    | { kind: "text"; inputMode?: "text"; autoComplete: string }
    | { kind: "number"; min: number; max: number; autoComplete: string }
    | { kind: "tel"; prefix: string; autoComplete: string }
    | { kind: "email"; autoComplete: string }
    | { kind: "choice"; options: readonly { value: GenderValue; label: string }[] };
};

export const journeySteps: readonly JourneyStep[] = [
  {
    key: "name",
    question: "What's your name?",
    placeholder: "Your full name",
    field: { kind: "text", autoComplete: "name" },
  },
  {
    key: "age",
    question: "How old are you?",
    placeholder: "25",
    field: { kind: "number", min: AGE_MIN, max: AGE_MAX, autoComplete: "off" },
  },
  {
    key: "gender",
    question: "What's your gender?",
    field: {
      kind: "choice",
      options: [
        { value: "female", label: "Female" },
        { value: "male", label: "Male" },
        { value: "prefer-not-to-say", label: "Prefer not to say" },
      ],
    },
  },
  {
    key: "occupation",
    question: "What do you do?",
    note: "Occupation or business – a word or two is plenty.",
    placeholder: "Occupation / Business",
    field: { kind: "text", autoComplete: "organization-title" },
  },
  {
    key: "mobile",
    question: "Your mobile number?",
    note: "This is where the Zoom link goes.",
    placeholder: "98765 43210",
    field: { kind: "tel", prefix: "+91", autoComplete: "tel-national" },
  },
  {
    key: "email",
    question: "And your email?",
    placeholder: "you@example.com",
    field: { kind: "email", autoComplete: "email" },
  },
] as const;

export const journeyForm = {
  eyebrow: "Begin",
  heading: "Begin your journey",
  lead: "A few details to get you started.",
  /** Shown once all six are answered — the review step, before any money. */
  ready: {
    heading: "You're ready.",
    lines: ["A few details.", "One meaningful step forward."],
    /** The price is appended with `inr()`; never write the number here. */
    cta: "Pay and begin –",
  },

  /**
   * Every state the payment can be in, in words.
   *
   * Written to the state matrix in CLAUDE.md §9.2: each one says what is true
   * right now and what happens next. None of them claims a registration that
   * the server has not verified — `success` is reached only from a 200 on
   * `/api/razorpay/verify`.
   */
  payment: {
    preparing: "Preparing payment…",
    open: "Complete the payment in the Razorpay window.",
    confirming: "Confirming your payment…",
    /** Restates the commitment made in the pricing card, word for word. */
    success: {
      heading: "Registration successful.",
      /** `₹699 received.` — the amount comes from `inr()`, never a literal. */
      receivedSuffix: "received.",
      lines: [
        "Zoom link within 24 hours.",
        "Keep an eye on your email.",
      ],
    },
    /** Nothing was charged. Said plainly, with the way back. */
    failed: {
      heading: "Payment wasn't completed.",
      line: "Nothing has been charged. Your details are still here – you can try again.",
      retry: "Try again",
    },
    /**
     * Paid, but the confirmation never reached this browser. A real outcome,
     * and neither a success nor a failure — so it is neither claimed.
     */
    unconfirmed: {
      heading: "Payment received.",
      line: "We're still confirming it at our end. You don't need to pay again – if you don't hear from us, get in touch and we'll sort it out.",
    },
  },
} as const;
