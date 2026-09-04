/**
 * The WhatsApp confirmation: what it says, and who it is addressed to.
 *
 * One place for both, per the owner's instruction that the wording be
 * configurable rather than scattered through the send path. No `node:`
 * imports and nothing that reads `process.env`, so this is safe to import
 * from `lib/whatsapp/notify.ts` without dragging anything server-secret along
 * — it carries no credential of its own.
 */

import { inr, programDetails, siteConfig } from "@/lib/config";
import { INDIAN_MOBILE, localMobileDigits } from "@/lib/validation";

/**
 * A stored registration's `answers.mobile` is already the ten local digits
 * `localMobileDigits` produces at `/api/register` — see
 * `pendingRegistration` in `lib/payments/registrations.ts`. This re-normalises
 * defensively rather than trusting that invariant, and returns `null` for
 * anything that is not a real 10-digit Indian mobile number rather than
 * sending to a malformed one.
 *
 * The `91` prefix with no `+` and no separator matches the one other place
 * this codebase already builds a WhatsApp destination from a stored mobile —
 * `https://wa.me/91${lead.mobile}` in `components/admin/LeadDetail.tsx` — and
 * is the shape Baileys-family WhatsApp APIs (which Evolution Go's own naming
 * and manager UI descend from) universally expect. It is still an assumption
 * about Evolution Go specifically, not a confirmed fact — see the header
 * comment in `lib/whatsapp/evolution.ts` and this project's final report.
 */
export function toWhatsappDestination(mobile: string): string | null {
  const digits = localMobileDigits(mobile);
  return INDIAN_MOBILE.test(digits) ? `91${digits}` : null;
}

/**
 * The confirmation text.
 *
 * Takes three primitives rather than a `Registration` or a `Lead` because it
 * is built from both, at two different call sites: `notify.ts` has a full
 * `Registration` (whose amount field is `amount`), and the retry sweep in
 * `app/api/whatsapp/retry/route.ts` has only a `Lead` row (whose amount field
 * is `amountPaise`). Naming the parameter for what it is rather than for
 * either caller's field name avoids a silent mismatch between the two.
 *
 * `amountPaise` is what *this* registration was actually charged, not a fresh
 * read of today's `programDetails.price` — matching the same "faithful to the
 * original amount" rule the admin reconcile route already follows: a price
 * change must never rewrite what an earlier confirmation says was paid.
 */
export function paymentConfirmationMessage(
  registrationId: string,
  name: string,
  amountPaise: number,
): string {
  const greetingName = name.trim() || "there";
  const rupees = inr(amountPaise / 100);

  return [
    `Hi ${greetingName} 👋`,
    "",
    `Your registration for ${siteConfig.program} — the ${programDetails.days}-Day Journey is confirmed.`,
    "",
    `Payment received: ${rupees}`,
    "",
    "We're excited to have you join us.",
    "",
    `Your registration ID: ${registrationId}`,
    "",
    "More details about the session will be shared with you here.",
    "",
    "— Kalee",
  ].join("\n");
}
