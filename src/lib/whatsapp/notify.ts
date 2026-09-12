/**
 * The one door into sending a WhatsApp confirmation.
 *
 * ---------------------------------------------------------------------------
 * What calls this, and what must never call this
 * ---------------------------------------------------------------------------
 * Exactly two call sites: `POST /api/razorpay/verify` and
 * `POST /api/razorpay/webhook`, each only on the branch where *this call* is
 * what just moved a registration to PAID — never on a replay, never on the
 * form-submitted or checkout-opened steps that happen before a payment is
 * verified. A third call site, `GET /api/whatsapp/retry`, exists purely to
 * retry a row this function already attempted and failed.
 *
 * Both payment routes call this through Next's `after()`, so the WhatsApp
 * attempt runs after the HTTP response is already on its way back — a slow or
 * unreachable WhatsApp provider can never add latency to a payment confirmation,
 * and (the more important half) can never turn a real payment into an error
 * response. See CLAUDE.md's payment-must-not-depend-on-WhatsApp requirement.
 *
 * ---------------------------------------------------------------------------
 * Why this is safe to call more than once for the same registration
 * ---------------------------------------------------------------------------
 * `claimWhatsappSend` is an atomic, database-enforced compare-and-swap (see
 * its comment in `lib/db/registrations.ts`). Every caller — the verify route,
 * the webhook, the retry sweep — goes through it first, and only the one that
 * wins the claim proceeds to an actual `fetch` against the configured provider. Losing
 * the claim is not an error; it is this function correctly declining to send
 * a second message.
 */

import type { Registration } from "@/lib/payments/types";
import type { Lead } from "@/lib/admin/types";
import {
  claimWhatsappSend,
  markWhatsappFailed,
  markWhatsappSent,
} from "@/lib/db/registrations";
import { toWhatsappDestination } from "@/lib/whatsapp/message";
import {
  resolveWhatsappSender,
  sanitizeWhatsappError,
  whatsappErrorCode,
  whatsappErrorStatus,
  whatsappTestPhone,
} from "@/lib/whatsapp/provider";

if (typeof window !== "undefined") {
  throw new Error(
    "lib/whatsapp/notify is server-only and must never be imported by a client component.",
  );
}

function logWhatsappEvent(event: string, fields: Record<string, unknown> = {}): void {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    safe[key] = typeof value === "string" && value.length > 200 ? `${value.slice(0, 200)}…` : value;
  }
  console.info(`[whatsapp] ${event}`, safe);
}

/** Only what this module actually needs, so a `Registration` and a `Lead` — the
 *  two shapes its two callers have on hand — can both be passed as-is. */
type Confirmable = { id: string; mobile: string; name: string; amountPaise: number };

function fromRegistration(registration: Registration): Confirmable {
  return {
    id: registration.id,
    mobile: registration.answers.mobile,
    name: registration.answers.name,
    amountPaise: registration.amount,
  };
}

function fromLead(lead: Lead): Confirmable {
  return { id: lead.id, mobile: lead.mobile, name: lead.name, amountPaise: lead.amountPaise };
}

/**
 * Claim, send, record. Never throws — every failure is logged and written to
 * `whatsapp_error`, and the caller (a payment route inside `after()`, or the
 * retry sweep) has nothing to catch and nothing it could usefully do with an
 * exception here anyway.
 */
async function attempt(target: Confirmable): Promise<void> {
  const claimed = await claimWhatsappSend(target.id);
  if (!claimed) {
    // Not an error: already SENT, already PENDING elsewhere, not PAID, or no
    // database configured (logged at source in claimWhatsappSend).
    return;
  }

  // Which provider, and is it actually configured. `resolveWhatsappSender`
  // owns that decision entirely (see lib/whatsapp/provider.ts) — this module
  // deliberately cannot tell WASI and Evolution Go apart.
  const resolved = resolveWhatsappSender();
  if (!resolved.ok) {
    logWhatsappEvent("provider_unavailable", {
      registrationId: target.id,
      reason: resolved.reason,
    });
    await markWhatsappFailed(target.id, resolved.reason);
    return;
  }
  const { sender } = resolved;

  const testPhone = whatsappTestPhone();
  let destination: string | null;
  let redirectedToTestPhone = false;

  if (testPhone) {
    if (!/^\d{10,15}$/.test(testPhone)) {
      // A malformed test override must never fall back to the real number —
      // that would be exactly the accidental real send test mode exists to
      // prevent.
      logWhatsappEvent("test_phone_malformed", { registrationId: target.id });
      await markWhatsappFailed(
        target.id,
        "The WhatsApp test-phone override is set but is not a plain digit string.",
      );
      return;
    }
    destination = testPhone;
    redirectedToTestPhone = true;
  } else {
    destination = toWhatsappDestination(target.mobile);
  }

  if (!destination) {
    logWhatsappEvent("invalid_destination", { registrationId: target.id });
    await markWhatsappFailed(target.id, "Stored mobile number is not a valid Indian WhatsApp number.");
    return;
  }

  try {
    const { messageId } = await sender.send(destination, {
      registrationId: target.id,
      name: target.name,
      amountPaise: target.amountPaise,
    });
    await markWhatsappSent(target.id, messageId);
    // `personalised` is logged because it is not cosmetic: a WASI send carries
    // a fixed approved template, so this line must not imply the lead's name
    // and amount went with it when they did not.
    logWhatsappEvent("sent", {
      registrationId: target.id,
      provider: sender.provider,
      personalised: sender.personalised,
      messageId,
      redirectedToTestPhone,
    });
  } catch (cause) {
    const sanitized = sanitizeWhatsappError(cause);
    logWhatsappEvent("send_failed", {
      registrationId: target.id,
      provider: sender.provider,
      providerStatus: whatsappErrorStatus(cause),
      providerCode: whatsappErrorCode(cause),
      redirectedToTestPhone,
      reason: sanitized,
    });
    await markWhatsappFailed(target.id, sanitized);
  }
}

/** Called from the two payment routes, on the branch that just confirmed PAID. */
export function notifyPaymentConfirmed(registration: Registration): Promise<void> {
  return attempt(fromRegistration(registration));
}

/** Called from the retry sweep, once per candidate row it selected. */
export function retryWhatsappConfirmation(lead: Lead): Promise<void> {
  return attempt(fromLead(lead));
}
