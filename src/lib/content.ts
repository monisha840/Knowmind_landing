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
/*  Section 2 — the psychological hook                                        */
/* -------------------------------------------------------------------------- */

export type Struggle = {
  key: string;
  label: string;
  line1: string;
  line2: string;
};

export const struggles: Struggle[] = [
  {
    key: "start",
    label: "Start",
    line1: "You begin with excitement.",
    line2: "Then stop after a few days.",
  },
  {
    key: "overthink",
    label: "Overthink",
    line1: "You know what to do.",
    line2: "But your mind keeps circling.",
  },
  {
    key: "compare",
    label: "Compare",
    line1: "Someone else seems ahead.",
    line2: "You feel behind.",
  },
  {
    key: "promise",
    label: "Promise",
    line1: "You make promises to yourself.",
    line2: "Then struggle to keep them.",
  },
  {
    key: "guilt",
    label: "Guilt",
    line1: "Every restart feels like failure.",
    line2: "So you stop restarting.",
  },
  {
    key: "potential",
    label: "Potential",
    line1: "You know you are capable of more.",
    line2: "You just cannot reach it consistently.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Section 3 — the core method                                               */
/* -------------------------------------------------------------------------- */

export type MethodStage = {
  key: "awareness" | "reflection" | "action" | "repetition" | "better";
  index: string;
  title: string;
  headline: string;
  body: string;
};

export const methodStages: MethodStage[] = [
  {
    key: "awareness",
    index: "01",
    title: "Awareness",
    headline: "See yourself.",
    body: "Before anything changes, something has to be noticed. Most patterns run quietly, underneath the day. Awareness is simply bringing them into the light.",
  },
  {
    key: "reflection",
    index: "02",
    title: "Reflection",
    headline: "Understand your patterns.",
    body: "Noticing is not enough. Reflection asks the harder question — why does this keep repeating? What is it protecting me from?",
  },
  {
    key: "action",
    index: "03",
    title: "Action",
    headline: "Take one small step.",
    body: "Not a transformation. Not a new identity. One small action that is small enough to actually complete today.",
  },
  {
    key: "repetition",
    index: "04",
    title: "Repetition",
    headline: "Return again.",
    body: "The step matters less than the returning. Consistency is not never falling — it is knowing the way back.",
  },
  {
    key: "better",
    index: "05",
    title: "1% Better",
    headline: "Become.",
    body: "Small, repeated, compounding. Not a different person overnight — the same person, slightly more aware, every single day.",
  },
];

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
  { day: 1, week: 1, title: "Awareness", description: "Notice what is happening within you." },
  { day: 2, week: 1, title: "Patterns", description: "Identify the cycles you keep repeating." },
  { day: 3, week: 1, title: "Self-trust", description: "Start small. Complete consistently." },
  { day: 4, week: 1, title: "Playfulness", description: "Reconnect with curiosity, joy and psychological flexibility." },
  { day: 5, week: 1, title: "Comparison", description: "Learn from others without losing yourself." },
  { day: 6, week: 1, title: "Inner critic → Inner coach", description: "You cannot shame yourself into growth." },
  { day: 7, week: 1, title: "Integration", description: "Pause. Reflect. Ask. Integrate." },
  { day: 8, week: 2, title: "Gratitude", description: "Train your attention to notice what is already present." },
  { day: 9, week: 2, title: "Bucket list", description: "Give yourself permission to dream." },
  { day: 10, week: 2, title: "Vision and direction", description: "Dreams need direction." },
  { day: 11, week: 2, title: "Being and non-reactivity", description: "Pause. Observe. Respond consciously." },
  { day: 12, week: 2, title: "Repetition and resilience", description: "Fall. Return. Repeat." },
  { day: 13, week: 2, title: "Self-love", description: "Accept yourself while continuing to grow." },
  { day: 14, week: 2, title: "Reflection and moving forward", description: "Look back. Learn. Choose your next step." },
];

export const journeyWeeks = [
  { week: 1 as const, label: "Week 1", title: "Understand Yourself", days: journeyDays.filter((d) => d.week === 1) },
  { week: 2 as const, label: "Week 2", title: "Move Forward", days: journeyDays.filter((d) => d.week === 2) },
];

/* -------------------------------------------------------------------------- */
/*  Section 5 — before / after                                                */
/* -------------------------------------------------------------------------- */

export const beforeAfter = {
  before: {
    label: "Before",
    quote: "I know what to do.",
    connector: "But…",
    points: [
      "I start and stop.",
      "I overthink.",
      "I compare.",
      "I break promises to myself.",
      "I feel guilty when I restart.",
      "I know my potential but struggle to live it consistently.",
    ],
  },
  after: {
    label: "After",
    quote: "I know how to return.",
    connector: "You may begin to notice…",
    points: [
      "I notice my patterns.",
      "I understand myself better.",
      "I keep smaller promises.",
      "I rebuild self-trust.",
      "I focus on my own journey.",
      "I can restart without guilt.",
      "I take the next 1% action.",
    ],
  },
} as const;

/* -------------------------------------------------------------------------- */
/*  Section 6 — who it's for                                                  */
/* -------------------------------------------------------------------------- */

export type Persona = {
  key: string;
  title: string;
  description: string;
};

export const personas: Persona[] = [
  {
    key: "entrepreneur",
    title: "Entrepreneur",
    description: "You know your potential but struggle to live it consistently.",
  },
  {
    key: "professional",
    title: "Professional",
    description: "You perform well outside but struggle with consistency inside.",
  },
  {
    key: "freelancer",
    title: "Freelancer",
    description: "Self-driven work needs self-trust.",
  },
  {
    key: "anyone",
    title: "Anyone who wants to grow",
    description: "You are simply ready to give yourself 45 minutes for 14 days.",
  },
];

export const outcomes = [
  "Notice your thoughts, emotions and patterns more clearly.",
  "Understand why you repeatedly start and stop.",
  "Rebuild trust in yourself through small kept promises.",
  "Focus on your own journey instead of constantly comparing.",
  "Return — even after you miss a day — without guilt.",
];

export const notForYou = [
  "You are looking for overnight transformation.",
  "You only want motivational speeches.",
  "You expect someone else to change your life for you.",
  "You are unwilling to reflect honestly on yourself.",
  "You are looking for perfection.",
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
  quote:
    "Why do capable and intelligent people know what to do — but still struggle to do it consistently?",
  quoteFollowUp: "That question is at the heart of this journey.",
} as const;

export type Metric = {
  value: string;
  suffix?: string;
  label: string;
  /** Numeric target for the count-up animation; omitted for non-numeric values. */
  count?: number;
  decimals?: number;
};

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
  heading: "Meet the person behind the journey",
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
  "Dual MSc — Counselling and Psychotherapy",
  "MSc Applied Psychology in Clinical",
  "PG Diploma in Yoga",
  "NIMHANS Trained",
  "NLP Practitioner",
  "Clinical Hypnotherapist",
  "Corporate Master Trainer — IATD",
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
};

export const testimonials: Testimonial[] = [
  {
    name: "Anandha",
    quote:
      "Simple way of explanation. This is a great GPS for personal and professional life.",
  },
  {
    name: "Deepa Sai",
    quote:
      "The content touched things I knew but never faced honestly. Day 1 itself created a real shift.",
  },
  {
    name: "Vinoth Kannan",
    quote:
      "It helped me move forward without overthinking and negative thoughts. That is what shifted in me.",
  },
  {
    name: "Vadivelmani",
    quote:
      "This program helped me understand why I was losing focus. Now I know how to return when I drift.",
  },
  {
    name: "Vijaya Saravanan",
    quote:
      "The importance of measurable goals and daily progress became clearer. Kalee made that real.",
  },
  {
    name: "GS",
    quote:
      "Get my sleep cycle fixed was my Day 1 commitment. By Day 7 I had kept it 5 times. Different feeling.",
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

export type Inclusion = {
  key: string;
  title: string;
  description: string;
};

export const inclusions: Inclusion[] = [
  {
    key: "sessions",
    title: "14 Live Morning Sessions",
    description: "5:30 AM – 6:15 AM, every day, live on Zoom with Kalee.",
  },
  {
    key: "workbook",
    title: "14-Day Workbook",
    description: "One reflection and one activity for each day of the journey.",
  },
  {
    key: "whatsapp",
    title: "Private WhatsApp Group",
    description: "Daily reminders, activities, reflections and community connection.",
  },
  {
    key: "reflection",
    title: "Pre + Post Journey Reflection",
    description: "See your own journey from Day 1 to Day 14 in your own words.",
  },
  {
    key: "micro-action",
    title: "Daily Micro-Action",
    description: "One question, every single day — “What is my next 1%?”",
  },
  {
    key: "language",
    title: "Tamil + English Delivery",
    description: "Natural Tanglish. Simple. Practical. Relatable.",
  },
];

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
    title: "Self-Trust Assessment",
    description: "Take it on Day 1. Take it again on Day 14.",
    detail: "Average shift from the founding batch: 4.8 → 7.2",
    value: 499,
  },
  {
    index: "02",
    title: "Pattern Identification Worksheet",
    description: "Identify your dominant repeating pattern in under 10 minutes.",
    value: 299,
  },
  {
    index: "03",
    title: "14 Psychological Truths by Kalee",
    description: "One powerful insight per day, for 14 days.",
    value: 199,
  },
];

export const totalBonusValue = bonuses.reduce((sum, b) => sum + b.value, 0); // 997

/* -------------------------------------------------------------------------- */
/*  Section 13 — session flow                                                 */
/* -------------------------------------------------------------------------- */

export type SessionStep = {
  index: string;
  title: string;
  description: string;
};

export const sessionSteps: SessionStep[] = [
  {
    index: "01",
    title: "Arrive",
    description: "A simple check-in. “How are you arriving today?”",
  },
  {
    index: "02",
    title: "Learn",
    description: "One powerful idea. Not information overload.",
  },
  {
    index: "03",
    title: "Reflect",
    description: "Look at your own life honestly.",
  },
  {
    index: "04",
    title: "Participate",
    description: "Chat reflection, activity or sharing with the group.",
  },
  {
    index: "05",
    title: "Act",
    description: "Choose one small action. Your 1% for today.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Section 15 — why live                                                     */
/* -------------------------------------------------------------------------- */

export const liveReasons = [
  {
    title: "Presence",
    description: "You show up at a real time, with real people. That is what makes it count.",
  },
  {
    title: "Reflection",
    description: "Reflection happens in the room, not later in a playlist you mean to finish.",
  },
  {
    title: "Participation",
    description: "You are asked. You answer. Something moves.",
  },
  {
    title: "Community",
    description: "Twenty-five people, returning to the same morning, for fourteen days.",
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
    question: "Is this a recorded course?",
    answer:
      "No. Every one of the 14 sessions is live on Zoom at 5:30 AM. There is no recording for the first four batches — the value comes from presence, reflection and participation, not from a video library.",
  },
  {
    question: "What if I miss a session?",
    answer:
      "பரவால பார்த்துக்கலாம். Missing a day is not failure — disappearing is. The workbook and the WhatsApp group carry that day's reflection and activity, so you can complete it in your own time and return the next morning. அடுத்த நாள் ஆரம்பிக்கலாம்.",
  },
  {
    question: "I am not an entrepreneur. Can I join?",
    answer:
      "Yes. This journey is for entrepreneurs, working professionals, freelancers and anyone who is simply ready to give themselves 45 minutes a day for 14 days. Nothing in it requires you to run a business.",
  },
  {
    question: "Is the program only in Tamil?",
    answer:
      "It is delivered in natural Tanglish — Tamil and English together. If you follow either language comfortably, you will follow the sessions comfortably.",
  },
  {
    question: "Do I need psychology knowledge?",
    answer:
      "None at all. The psychology is in how the journey is built, not in what you are asked to know. Everything is explained simply, practically and in everyday language.",
  },
  {
    question: "Will this solve all my problems in 14 days?",
    answer:
      "No, and anyone who promises that is selling something else. Fourteen days is enough to become more aware of your patterns, rebuild a little self-trust and learn how to return after you drift. That is the honest scope of it.",
  },
  {
    question: "Why 5:30 AM?",
    answer:
      "Because it is the one part of the day the world has not claimed yet. No office, no meetings, no notifications — 45 minutes that belong to you before anything else begins.",
  },
  {
    question: "How is this different from other programs?",
    answer:
      "It is live, it is small (25 participants), and it is built around repetition rather than information. You are not collecting more things to know. You are practising awareness, reflection and one small action, daily, for 14 days.",
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
    "If you feel no shift in your awareness, self-trust, or consistency — I will return every rupee.",
  ],
  emphasis: "No questions asked.",
  conditions:
    "The refund applies to participants who attend all 14 live sessions and complete all 14 night reflections. Share your completed workbook and we will process the refund in full — no explanation required.",
} as const;

/* -------------------------------------------------------------------------- */
/*  Tamil lines used throughout the page                                      */
/* -------------------------------------------------------------------------- */

export const tamil = {
  heroQuestion:
    "உங்களுக்கு என்ன செய்ய வேண்டும் என்று தெரியும். ஆனால் தொடர்ந்து செய்வது ஏன் கஷ்டமாக இருக்கிறது?",
  itsOkayLetsSee: "பரவால … பார்த்துக்கலாம் ஆரம்பிக்கலாம்.",
  itsOkay: "பரவால பார்த்துக்கலாம்.",
  startAgain: "திரும்ப ஆரம்பிக்கலாம்.",
  nextDay: "அடுத்த நாள் ஆரம்பிக்கலாம்.",
} as const;
