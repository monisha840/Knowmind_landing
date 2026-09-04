/**
 * Evolution Go, over its REST API, from the server only.
 *
 * ---------------------------------------------------------------------------
 * Where this contract came from
 * ---------------------------------------------------------------------------
 * Evolution Go ships no public API reference. The contract below was read out
 * of the manager web app's own compiled JavaScript at the deployment this
 * project talks to (`{EVOLUTION_API_URL}/manager`, bundle
 * `assets/index-*.js`) — the same requests that app's own "Send Message"
 * dialog makes, not a guess and not carried over from the unrelated Node.js
 * "Evolution API" project (whose endpoints are shaped differently, e.g.
 * `/message/sendText/:instance` and no per-instance apikey-only auth).
 *
 * Confirmed from that bundle:
 *   - `POST {baseURL}/send/text` with header `apikey: <token>` and JSON body
 *     `{ number, text }`. No instance name in the URL or body — the token
 *     itself is a **per-instance** credential (the manager stores it as
 *     `instance.apikey` and reuses it for every call scoped to that
 *     instance), which is exactly the shape of the token this project was
 *     given (one token, one instance name, for reference only).
 *   - The client-side schema requires only non-empty strings for `number` and
 *     `text` — no format is enforced before the request leaves the browser,
 *     so the wire format of `number` could not be read from the bundle.
 *   - Confirmed live: `GET {baseURL}/instance/all` with this token returns
 *     401 `{"error":"not authorized"}` — a real route, on a real deployment,
 *     that this token legitimately cannot call (consistent with an
 *     instance-scoped token rather than a global admin key). No message-
 *     sending endpoint was called during this inspection.
 *
 * `number`'s exact digit shape (country code, no `+`, no `@s.whatsapp.net`
 * suffix) is therefore this module's one real assumption, not a read fact —
 * see `toWhatsappDestination` in `lib/whatsapp/message.ts` for the reasoning
 * and CLAUDE.md's final report for how to confirm it with one real send.
 *
 * Everything else in this file mirrors `lib/payments/razorpay.ts`: no SDK (a
 * REST call over `fetch` earns nothing from one — CLAUDE.md §2.2), the token
 * is read here and only here, and the module refuses to load in a browser.
 */

if (typeof window !== "undefined") {
  throw new Error(
    "lib/whatsapp/evolution is server-only and must never be imported by a client component.",
  );
}

/* ------------------------------------------------------------ credentials -- */

export type EvolutionCredentials = { baseUrl: string; apiKey: string; instance: string | null };

/**
 * Null rather than a throw when unconfigured — the same honest-boundary
 * pattern as `razorpayCredentials()`. A missing WhatsApp integration must
 * never fail a payment; the caller logs and moves on.
 */
export function evolutionCredentials(): EvolutionCredentials | null {
  const baseUrl = process.env.EVOLUTION_API_URL?.trim().replace(/\/+$/, "");
  const apiKey = process.env.EVOLUTION_API_KEY?.trim();
  if (!baseUrl || !apiKey) return null;
  return { baseUrl, apiKey, instance: process.env.EVOLUTION_INSTANCE?.trim() || null };
}

/**
 * Every outgoing WhatsApp confirmation is redirected to this number instead
 * of the lead's own, when set. The safe way to test the whole payment →
 * WhatsApp path locally without messaging a real person — CLAUDE.md's local-
 * and live-testing sections both require this before any real send.
 */
export function evolutionTestPhone(): string | null {
  return process.env.EVOLUTION_TEST_PHONE?.trim() || null;
}

/* ----------------------------------------------------------------- errors -- */

/** Raised for any non-2xx or network failure. Never surfaced to a lead. */
export class EvolutionApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "EvolutionApiError";
  }
}

/* ---------------------------------------------------------------- request -- */

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

/**
 * Dig a message id out of whatever shape the response turns out to have.
 *
 * The manager bundle never reads a field off this response — it only checks
 * success/failure — so the id's location is unconfirmed. `id`, `messageId`
 * and Baileys' own `key.id` are the three shapes every WhatsApp-API-family
 * product uses somewhere; checked in that order, and `null` (not a guess) if
 * none match. `whatsapp_message_id` staying empty never blocks anything —
 * see `lib/db/registrations.ts`.
 */
function extractMessageId(body: unknown): string | null {
  if (!isRecord(body)) return null;
  const direct = body.id ?? body.messageId;
  if (typeof direct === "string" && direct) return direct;

  const data = isRecord(body.data) ? body.data : body;
  const nested = isRecord(data) ? (data.id ?? data.messageId) : undefined;
  if (typeof nested === "string" && nested) return nested;

  const key = isRecord(data) && isRecord(data.key) ? data.key : null;
  if (key && typeof key.id === "string" && key.id) return key.id;

  return null;
}

/**
 * POST /send/text.
 *
 * A stuck WhatsApp provider must not hold a serverless invocation open
 * indefinitely — same reasoning as `lib/payments/razorpay.ts`'s request
 * timeout, shorter here because nothing downstream is waiting on this call
 * (it runs inside `after()`, off the payment response's critical path).
 */
export async function sendWhatsappText(
  credentials: EvolutionCredentials,
  number: string,
  text: string,
): Promise<{ messageId: string | null }> {
  const signal = AbortSignal.timeout(12_000);

  let response: Response;
  try {
    response = await fetch(`${credentials.baseUrl}/send/text`, {
      method: "POST",
      headers: {
        apikey: credentials.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ number, text }),
      signal,
      cache: "no-store",
    });
  } catch (cause) {
    throw new EvolutionApiError(0, `Could not reach Evolution Go: ${(cause as Error).name}`);
  }

  const raw: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      isRecord(raw) && typeof raw.error === "string"
        ? raw.error
        : isRecord(raw) && typeof raw.message === "string"
          ? raw.message
          : `HTTP ${response.status}`;
    throw new EvolutionApiError(response.status, message);
  }

  return { messageId: extractMessageId(raw) };
}

/**
 * Strip anything that could be a header, a token, or a full payload before an
 * Evolution Go error reaches a log line or `whatsapp_error` — the same
 * discipline `lib/payments/registrations.ts`'s `logPaymentEvent` applies to
 * Razorpay errors. The API key itself is never in scope for this function: it
 * never appears in a response body or a caught error, only in the request
 * header this module sends and nowhere else reads.
 */
export function sanitizeWhatsappError(cause: unknown): string {
  const message = cause instanceof Error ? cause.message : String(cause);
  return message.length > 200 ? `${message.slice(0, 200)}…` : message;
}
