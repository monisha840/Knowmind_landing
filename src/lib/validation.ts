/**
 * Registration answer validation.
 *
 * Deliberately dependency-free and free of browser APIs, so the identical rules
 * can run on a server route the day one exists. Front-end validation is UX;
 * whatever eventually receives these answers has to run `validateAnswers`
 * again and treat its result as the authoritative one.
 *
 * Rules are kept permissive on purpose (CLAUDE.md §9.1): names carry spaces,
 * accents and Tamil characters, and phone numbers arrive with spaces, hyphens
 * and country codes. Rejecting a real person's real details is a worse failure
 * than accepting an odd-looking one.
 */

export type AnswerKey = "name" | "gender" | "age" | "occupation" | "mobile" | "email";

export type Answers = Record<AnswerKey, string>;

export const emptyAnswers: Answers = {
  name: "",
  gender: "",
  age: "",
  occupation: "",
  mobile: "",
  email: "",
};

export const GENDER_VALUES = ["female", "male", "prefer-not-to-say"] as const;
export type GenderValue = (typeof GENDER_VALUES)[number];

/** The programme is an adult cohort; the bounds only exclude nonsense. */
export const AGE_MIN = 13;
export const AGE_MAX = 100;

/** Digits only, after the +91 the field displays. */
const INDIAN_MOBILE = /^[6-9]\d{9}$/;

/** Intentionally loose: one @, a dot in the domain, no spaces. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Everything but the digits — how a person actually types a phone number. */
export const stripPhoneFormatting = (value: string) => value.replace(/[^\d]/g, "");

/** Drops a leading 91 / 0 so a pasted "+91 98765 43210" still validates. */
export const localMobileDigits = (value: string) => {
  const digits = stripPhoneFormatting(value);
  if (digits.length > 10 && digits.startsWith("91")) return digits.slice(-10);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
};

/**
 * One field's error, or null when it is acceptable.
 *
 * Messages say what is wrong *and* what to do about it — "Invalid" tells a
 * person nothing they did not already know.
 */
export function validateAnswer(key: AnswerKey, raw: string): string | null {
  const value = raw.trim();

  switch (key) {
    case "name": {
      if (!value) return "Please enter your name.";
      if (value.length < 2) return "That looks a little short — please enter your full name.";
      if (value.length > 60) return "Please keep your name under 60 characters.";
      // A name has to contain a letter in some script; digits alone are a typo.
      if (!/\p{L}/u.test(value)) return "Please enter your name using letters.";
      return null;
    }

    case "gender": {
      if (!value) return "Please choose one.";
      return (GENDER_VALUES as readonly string[]).includes(value)
        ? null
        : "Please choose one of the options.";
    }

    case "age": {
      if (!value) return "Please enter your age.";
      if (!/^\d{1,3}$/.test(value)) return "Please enter your age in numbers.";
      const age = Number(value);
      if (age < AGE_MIN) return `This journey is for ages ${AGE_MIN} and above.`;
      if (age > AGE_MAX) return "Please enter a valid age.";
      return null;
    }

    case "occupation": {
      if (!value) return "Please tell us what you do.";
      if (value.length < 2) return "That looks a little short.";
      if (value.length > 80) return "Please keep this under 80 characters.";
      return null;
    }

    case "mobile": {
      if (!value) return "Please enter your mobile number.";
      const digits = localMobileDigits(value);
      if (digits.length !== 10) return "An Indian mobile number is 10 digits.";
      if (!INDIAN_MOBILE.test(digits)) return "Indian mobile numbers start with 6, 7, 8 or 9.";
      return null;
    }

    case "email": {
      if (!value) return "Please enter your email address.";
      if (value.length > 254) return "That email address is too long.";
      if (!EMAIL.test(value)) return "Please enter a valid email address.";
      return null;
    }
  }
}

/** Every field at once. Empty object means the set is complete and valid. */
export function validateAnswers(answers: Answers): Partial<Record<AnswerKey, string>> {
  const errors: Partial<Record<AnswerKey, string>> = {};
  for (const key of Object.keys(emptyAnswers) as AnswerKey[]) {
    const error = validateAnswer(key, answers[key] ?? "");
    if (error) errors[key] = error;
  }
  return errors;
}
