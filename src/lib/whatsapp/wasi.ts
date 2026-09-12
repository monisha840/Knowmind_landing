/**
 * WASI — the "Hub API" — over its REST API, from the server only.
 *
 * ---------------------------------------------------------------------------
 * Where this contract came from
 * ---------------------------------------------------------------------------
 * WASI ships no public API reference (`@wasi/mcp-server`, named in the
 * dashboard's own MCP snippet, is not published to npm). The contract below
 * was established by reading the dashboard bundle at
 * `{WASI_API_BASE_URL}/app.js` and then confirming every part of it against
 * the live deployment this project talks to. Confirmed, not assumed:
 *
 *   - `GET /api/v1/account` answers `{ client_id, connected, status,
 *     display_name, phone_number_id, quality_rating, verified_at }`. That
 *     `phone_number_id` is what makes this an **official Meta WhatsApp
 *     Business Platform** account rather than a Baileys-family bridge like
 *     Evolution Go.
 *   - `POST /api/v1/messages` with `Authorization: Bearer <key>` and a body of
 *     `{ client_id, to, type, ... }`, where `type` is
 *     `text` | `template` | `interactive` — read verbatim off the API's own
 *     enum validation error. `text` additionally requires `body`; `template`
 *     additionally requires `template`, **a string** (the template's name),
 *     not an object.
 *   - A successful send answers `{ id, chat_id, direction, sent_at,
 *     meta_message_id, status, error_reason, meta_error_code, ... }`, where
 *     `meta_message_id` is the `wamid...` WhatsApp assigns.
 *
 * ---------------------------------------------------------------------------
 * Why this sends a template and never free text
 * ---------------------------------------------------------------------------
 * Because it is an official WABA account, a business-initiated message is only
 * allowed as an approved template. This is not a precaution — it was measured.
 * A `text` send to a number that had not messaged the business number inside
 * 24 hours was refused outright:
 *
 *     {"error":{"code":"session_window_closed","message":"This chat is outside
 *      the 24-hour customer service window - send a template message instead."}}
 *
 * A payment confirmation goes to somebody who has just paid on a web page and
 * has, by definition, never messaged this number. It is therefore **always**
 * outside that window, and a free-text send would fail every single time. That
 * is why this module does not expose one at all: an unusable code path that
 * looks usable is exactly the trap CLAUDE.md §0.4 exists to prevent.
 *
 * The consequence, stated plainly because it is a real regression against the
 * Evolution Go path this replaces: an approved template's body is fixed text.
 * The one approved template on this account (`confirmtion_message`) declares
 * no variables at all (`body_param_examples: {}`), so the confirmation carries
 * **no lead name, no amount paid and no registration id** — all three of which
 * `paymentConfirmationMessage` in `lib/whatsapp/message.ts` puts in the
 * Evolution Go version. Restoring them needs a *new* template carrying
 * `{{1}}`-style placeholders, submitted to Meta and approved; once one exists,
 * `WASI_TEMPLATE_NAME` points at it and `sendWasiTemplate` grows a body-params
 * argument. Nothing here should pretend to personalise until that template is
 * actually approved.
 *
 * Everything else mirrors `lib/whatsapp/evolution.ts`: no SDK (a REST call
 * over `fetch` earns nothing from one — CLAUDE.md §2.2), the token is read
 * here and only here, and the module refuses to load in a browser.
 */

if (typeof window !== "undefined") {
  throw new Error(
    "lib/whatsapp/wasi is server-only and must never be imported by a client component.",
  );
}

/* ------------------------------------------------------------ credentials -- */

export type WasiCredentials = {
  baseUrl: string;
  apiKey: string;
  clientId: string;
  templateName: string;
};

/**
 * The template this account already has approved. Overridable by
 * `WASI_TEMPLATE_NAME` so swapping in a newly approved template — in
 * particular a personalised one — is a deployment change and not a code
 * change, matching the owner's standing instruction that the confirmation's
 * wording stay configurable.
 *
 * The misspelling is deliberate: it is the template's real registered name on
 * the account (`GET /api/v1/templates`), and Meta matches on that exact
 * string. "Correcting" it here would simply stop it resolving.
 */
const DEFAULT_TEMPLATE_NAME = "confirmtion_message";

/**
 * Null rather than a throw when unconfigured — the same honest-boundary
 * pattern as `evolutionCredentials()` and `razorpayCredentials()`. A missing
 * WhatsApp integration must never fail a payment.
 *
 * `clientId` is required in every send body. It is an env var rather than a
 * lookup through `GET /api/v1/account` on each send, because a per-send round
 * trip would add a second network failure mode to a path whose entire job is
 * to be incapable of disturbing a payment. Read it once from that endpoint
 * when setting the deployment up.
 */
export function wasiCredentials(): WasiCredentials | null {
  const baseUrl = process.env.WASI_API_BASE_URL?.trim().replace(/\/+$/, "");
  const apiKey = process.env.WASI_API_KEY?.trim();
  const clientId = process.env.WASI_CLIENT_ID?.trim();
  if (!baseUrl || !apiKey || !clientId) return null;
  return {
    baseUrl,
    apiKey,
    clientId,
    templateName: process.env.WASI_TEMPLATE_NAME?.trim() || DEFAULT_TEMPLATE_NAME,
  };
}

/* ----------------------------------------------------------------- errors -- */

/** Raised for any non-2xx or network failure. Never surfaced to a lead. */
export class WasiApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** WASI's own machine-readable code, e.g. `session_window_closed`. */
    readonly code: string | null = null,
  ) {
    super(message);
    this.name = "WasiApiError";
  }
}

/* ---------------------------------------------------------------- request -- */

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

/**
 * Prefer the `wamid...` WhatsApp itself assigned over WASI's own row id: it is
 * the id that can be matched against a delivery webhook or looked up in Meta's
 * own tooling, which WASI's internal uuid cannot. Falls back to the row id,
 * then to null — `whatsapp_message_id` staying empty never blocks anything
 * (see `lib/db/registrations.ts`).
 */
function extractMessageId(body: unknown): string | null {
  if (!isRecord(body)) return null;
  const wamid = body.meta_message_id;
  if (typeof wamid === "string" && wamid) return wamid;
  const rowId = body.id;
  if (typeof rowId === "string" && rowId) return rowId;
  return null;
}

/** `{"error":{"code":..,"message":..,"details":[..]}}` is the versioned API's
 *  shape; a plain-string `error` is what the older unversioned routes answer
 *  with, and costs one line to keep understanding. */
function readError(raw: unknown): { message: string; code: string | null } {
  if (isRecord(raw) && isRecord(raw.error)) {
    const { code, message, details } = raw.error;
    const detail = Array.isArray(details) && details.length ? ` (${details.join("; ")})` : "";
    return {
      message: `${typeof message === "string" ? message : "Request failed"}${detail}`,
      code: typeof code === "string" ? code : null,
    };
  }
  if (isRecord(raw) && typeof raw.error === "string") return { message: raw.error, code: null };
  return { message: "Request failed", code: null };
}

/**
 * POST /api/v1/messages, as an approved template.
 *
 * A stuck provider must not hold a serverless invocation open indefinitely —
 * the same reasoning as `lib/payments/razorpay.ts`'s request timeout, and the
 * same 12s as the Evolution Go client, since nothing downstream is waiting on
 * this call (it runs inside `after()`, off the payment response's critical
 * path).
 */
export async function sendWasiTemplate(
  credentials: WasiCredentials,
  number: string,
): Promise<{ messageId: string | null }> {
  const signal = AbortSignal.timeout(12_000);

  let response: Response;
  try {
    response = await fetch(`${credentials.baseUrl}/api/v1/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: credentials.clientId,
        to: number,
        type: "template",
        template: credentials.templateName,
      }),
      signal,
      cache: "no-store",
    });
  } catch (cause) {
    throw new WasiApiError(0, `Could not reach WASI: ${(cause as Error).name}`);
  }

  const raw: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const { message, code } = readError(raw);
    throw new WasiApiError(response.status, message, code);
  }

  // A 2xx still carries a per-message status. WASI reports a send that Meta
  // refused as `status: "failed"` with a reason, rather than as an HTTP error
  // — treating that as success would record a confirmation that never left
  // the building.
  if (isRecord(raw) && raw.status === "failed") {
    const reason = typeof raw.error_reason === "string" ? raw.error_reason : "unknown reason";
    const metaCode = raw.meta_error_code == null ? null : String(raw.meta_error_code);
    throw new WasiApiError(response.status, `WhatsApp rejected the message: ${reason}`, metaCode);
  }

  return { messageId: extractMessageId(raw) };
}
