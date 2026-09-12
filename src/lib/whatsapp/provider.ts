/**
 * Which WhatsApp provider this deployment sends through, and the one shape
 * `notify.ts` talks to either of them in.
 *
 * ---------------------------------------------------------------------------
 * Why a selector rather than a swap
 * ---------------------------------------------------------------------------
 * WASI (the "Hub API") replaced Evolution Go as the sender, but Evolution Go
 * is kept wired up and reachable behind `WHATSAPP_PROVIDER=evolution`, at the
 * owner's instruction. The reason is worth writing down: at the time of the
 * switch Evolution Go was the only path verified end to end — connected,
 * logged in, and observed delivering a real message — while WASI was new. One
 * environment variable reverting a live deployment to a known-good sender is
 * cheap insurance, and CLAUDE.md §0.3 asks precisely that working code not be
 * discarded because a newer implementation looks better.
 *
 * ---------------------------------------------------------------------------
 * Why the interface is not `send(number, text)`
 * ---------------------------------------------------------------------------
 * The obvious abstraction is wrong here, and quietly so. The two providers do
 * not differ only in transport:
 *
 *   - Evolution Go is a Baileys-family bridge. It sends arbitrary free text,
 *     so it renders `paymentConfirmationMessage()` and posts the string.
 *   - WASI is an official Meta WABA account. A business-initiated message
 *     **must** be a pre-approved template, and the template approved on this
 *     account carries no variables — so there is no text to render, and the
 *     lead's name, the amount and the registration id cannot travel with it.
 *     See the header comment in `wasi.ts` for the measurement that established
 *     this.
 *
 * A `send(number, text)` interface would force WASI to accept a string it is
 * structurally unable to deliver, and the resulting code would read as though
 * both providers send the same message when they do not. So a sender is
 * handed the *facts* of the registration instead, and each one decides what it
 * can actually say with them.
 */

import {
  EvolutionApiError,
  evolutionCredentials,
  sendWhatsappText,
} from "@/lib/whatsapp/evolution";
import { paymentConfirmationMessage } from "@/lib/whatsapp/message";
import { WasiApiError, wasiCredentials, sendWasiTemplate } from "@/lib/whatsapp/wasi";

if (typeof window !== "undefined") {
  throw new Error(
    "lib/whatsapp/provider is server-only and must never be imported by a client component.",
  );
}

/* ---------------------------------------------------------------- selection -- */

export type WhatsappProviderName = "wasi" | "evolution";

/** The default when `WHATSAPP_PROVIDER` is unset. WASI is the provider this
 *  deployment now uses; set `WHATSAPP_PROVIDER=evolution` to revert. */
const DEFAULT_PROVIDER: WhatsappProviderName = "wasi";

const PROVIDER_NAMES: readonly WhatsappProviderName[] = ["wasi", "evolution"];

function readProviderName(): string {
  return process.env.WHATSAPP_PROVIDER?.trim().toLowerCase() || DEFAULT_PROVIDER;
}

/* ----------------------------------------------------------------- senders -- */

/** What a confirmation is allowed to know about the registration it confirms.
 *  Deliberately primitives, so a `Registration` and a `Lead` — the two shapes
 *  `notify.ts`'s callers have on hand — both reduce to it. */
export type ConfirmationDetails = {
  registrationId: string;
  name: string;
  amountPaise: number;
};

export type WhatsappSender = {
  readonly provider: WhatsappProviderName;
  /** Whether the message this sender delivers actually carries the details
   *  above. False for a static approved template — read by `notify.ts` purely
   *  so the log line does not overstate what was sent. */
  readonly personalised: boolean;
  send(destination: string, details: ConfirmationDetails): Promise<{ messageId: string | null }>;
};

export type SenderResolution =
  | { ok: true; sender: WhatsappSender }
  | { ok: false; reason: string };

/**
 * The configured sender, or the honest reason there isn't one.
 *
 * An unrecognised `WHATSAPP_PROVIDER` is refused rather than quietly falling
 * back to the default: a typo that silently redirected every confirmation to
 * the other provider would be far harder to notice than a run of recorded
 * failures, which the retry sweep will pick back up once the variable is
 * fixed.
 */
export function resolveWhatsappSender(): SenderResolution {
  const name = readProviderName();

  if (!PROVIDER_NAMES.includes(name as WhatsappProviderName)) {
    return {
      ok: false,
      reason: `WHATSAPP_PROVIDER is "${name}", which is not one of: ${PROVIDER_NAMES.join(", ")}.`,
    };
  }

  if (name === "wasi") {
    const credentials = wasiCredentials();
    if (!credentials) {
      return {
        ok: false,
        reason:
          "WASI is selected but not configured (needs WASI_API_BASE_URL, WASI_API_KEY and WASI_CLIENT_ID).",
      };
    }
    return {
      ok: true,
      sender: {
        provider: "wasi",
        // The approved template has no variables. See wasi.ts's header.
        personalised: false,
        send: (destination) => sendWasiTemplate(credentials, destination),
      },
    };
  }

  const credentials = evolutionCredentials();
  if (!credentials) {
    return {
      ok: false,
      reason:
        "Evolution Go is selected but not configured (needs EVOLUTION_API_URL and EVOLUTION_API_KEY).",
    };
  }
  return {
    ok: true,
    sender: {
      provider: "evolution",
      personalised: true,
      send: (destination, details) =>
        sendWhatsappText(
          credentials,
          destination,
          paymentConfirmationMessage(details.registrationId, details.name, details.amountPaise),
        ),
    },
  };
}

/* -------------------------------------------------------------- test phone -- */

/**
 * Every outgoing WhatsApp confirmation is redirected to this number instead of
 * the lead's own, when set. The safe way to test the whole payment → WhatsApp
 * path without messaging a real person.
 *
 * `EVOLUTION_TEST_PHONE` is still honoured so an existing deployment's
 * override does not silently stop working the moment the provider changes —
 * the safety net going quiet is the one failure this variable exists to
 * prevent. `WHATSAPP_TEST_PHONE` is the provider-neutral name to use from now
 * on, and wins when both are set.
 */
export function whatsappTestPhone(): string | null {
  return (
    process.env.WHATSAPP_TEST_PHONE?.trim() || process.env.EVOLUTION_TEST_PHONE?.trim() || null
  );
}

/* ------------------------------------------------------------------ errors -- */

/**
 * Strip anything that could be a header, a token, or a full payload before a
 * provider error reaches a log line or `whatsapp_error` — the same discipline
 * `lib/payments/registrations.ts`'s `logPaymentEvent` applies to Razorpay
 * errors. Neither provider's credential is ever in scope: it appears only in
 * the request header its own module sends, and in no response body.
 */
export function sanitizeWhatsappError(cause: unknown): string {
  const message = cause instanceof Error ? cause.message : String(cause);
  return message.length > 200 ? `${message.slice(0, 200)}…` : message;
}

/** The provider's own HTTP status, when the failure came from one — so a log
 *  line can tell "WASI said 400" apart from "the network died". */
export function whatsappErrorStatus(cause: unknown): number | null {
  if (cause instanceof WasiApiError || cause instanceof EvolutionApiError) return cause.status;
  return null;
}

/** WASI's machine-readable code (e.g. `session_window_closed`), when there is
 *  one. Evolution Go has no equivalent, so it is always null there. */
export function whatsappErrorCode(cause: unknown): string | null {
  return cause instanceof WasiApiError ? cause.code : null;
}
