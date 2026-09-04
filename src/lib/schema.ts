import { credentials, kalee } from "./content";
import { PROGRAM_URL, programDetails, siteConfig } from "./config";

/**
 * JSON-LD for the page.
 *
 * Deliberately conservative: only claims backed by the programme brief are
 * marked up. In particular there is no `aggregateRating` — the 4.9 / 258
 * Google reviews belong to Kaleeswaran's practice, not to this course, and
 * marking them up as course reviews would misrepresent them.
 */

/*
 * Registration happens on this page now — the questions, then Razorpay Checkout
 * opened from the end of them — so this is the honest URL to point a search
 * engine at. It used to fall back to an off-site hosted payment link, which
 * would today send someone past the form the flow depends on.
 */
/* The page itself, with no fragment. Registration used to be a section with
   its own id; it is a dialog now, so `#begin-journey` would point a crawler at
   an anchor that no longer exists on the page. */
const registrationUrl = PROGRAM_URL;

const organization = {
  "@type": "Organization",
  "@id": `${siteConfig.url}/#organization`,
  name: siteConfig.name,
  slogan: siteConfig.tagline,
  url: siteConfig.url,
  logo: `${siteConfig.url}/brand/logo.png`,
  email: siteConfig.contact.email,
  telephone: siteConfig.contact.phone,
};

const person = {
  "@type": "Person",
  "@id": `${siteConfig.url}/#kaleeswaran`,
  name: kalee.name,
  jobTitle: [...kalee.roles],
  description:
    "Counselling Psychologist, international experiential corporate trainer and coach; Founder and Director of OOKKAM Foundation.",
  worksFor: {
    "@type": "Organization",
    name: kalee.founderOf,
  },
  knowsAbout: [
    "Counselling psychology",
    "Behavioural change",
    "Self-trust and consistency",
    "Experiential learning",
    "Cognitive Behavioural Therapy",
  ],
  hasCredential: credentials.map((c) => ({
    "@type": "EducationalOccupationalCredential",
    name: c,
  })),
  url: siteConfig.contact.websiteHref,
};

const offer = {
  "@type": "Offer",
  price: String(programDetails.price),
  priceCurrency: programDetails.currency,
  availability: "https://schema.org/LimitedAvailability",
  url: registrationUrl,
  category: "Founding price",
};

const course = {
  "@type": "Course",
  "@id": `${siteConfig.url}/#course`,
  name: `${siteConfig.program} – ${siteConfig.programSubtitle}`,
  description:
    "A 14-day live psychological growth journey. Forty-five guided minutes every morning at 5:30 AM, built around awareness, reflection, one small daily action and repetition.",
  provider: { "@id": `${siteConfig.url}/#organization` },
  inLanguage: ["ta", "en"],
  isAccessibleForFree: false,
  offers: offer,
  hasCourseInstance: {
    "@type": "CourseInstance",
    name: `${siteConfig.program} – ${siteConfig.batch}`,
    courseMode: "Online",
    courseWorkload: `PT${programDetails.durationMinutes}M`,
    startDate: programDetails.startDate,
    endDate: programDetails.endDate,
    maximumAttendeeCapacity: programDetails.seats,
    instructor: { "@id": `${siteConfig.url}/#kaleeswaran` },
    location: {
      "@type": "VirtualLocation",
      url: registrationUrl,
    },
  },
};

const event = {
  "@type": "EducationEvent",
  "@id": `${siteConfig.url}/#event`,
  name: `${siteConfig.program} – ${siteConfig.batch}`,
  description:
    "Fourteen consecutive live morning sessions on Zoom, 5:30 AM – 6:15 AM IST, in Tamil and English. Limited batch.",
  startDate: `${programDetails.startDate}T05:30:00+05:30`,
  endDate: `${programDetails.endDate}T06:15:00+05:30`,
  eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  inLanguage: ["ta", "en"],
  maximumAttendeeCapacity: programDetails.seats,
  location: {
    "@type": "VirtualLocation",
    url: registrationUrl,
  },
  organizer: { "@id": `${siteConfig.url}/#organization` },
  performer: { "@id": `${siteConfig.url}/#kaleeswaran` },
  offers: { ...offer, validFrom: "2026-08-01T00:00:00+05:30" },
  about: "Psychological growth, self-trust and daily consistency",
};

export const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [organization, person, course, event],
};
