/**
 * Razorpay, over its REST API, from the server only.
 *
 * No `razorpay` npm package. CLAUDE.md §2.2 makes the default answer to a new
 * dependency "no", and this one earns nothing: the Orders API is HTTP Basic
 * auth over `fetch`, and signature verification is a single HMAC out of
 * `node:crypto`. Both are already in the runtime. The SDK would add a
 * dependency tree to a serverless bundle in exchange for syntax.
 *
 * The key secret is read here and nowhere else. It is not NEXT_PUBLIC_, this
 * module throws if it is ever imported into a browser, and no function below
 * returns it, logs it or embeds it in a response.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * A hard stop rather than a convention.
 *
 * `server-only` is not a dependency of this project, so this stands in for it:
 * if this module is ever pulled into a client component by an unrelated
 * refactor, it fails loudly instead of quietly shipping the secret.
 */
if (typeof window !== "undefined") {
  throw new Error(
    "lib/payments/razorpay is server-only and must never be imported by a client component.",
  );
}

const API = "https://api.razorpay.com/v1";

/** Razorpay caps `receipt` at 40 characters. */
const RECEIPT_MAX = 40;

/* ------------------------------------------------------------ credentials -- */

export type RazorpayCredentials = { keyId: string; keySecret: string };

/**
 * Null rather than a throw when the keys are absent.
 *
 * The page's established pattern for a missing integration is an honest
 * boundary, not a crash (CLAUDE.md §0.4): the route turns this into a calm
 * "registration isn't open yet" and the form offers the phone number instead.
 */
export function razorpayCredentials(): RazorpayCredentials | null {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

/** Signing secret for webhook deliveries — a different value from the API key secret. */
export function razorpayWebhookSecret(): string | null {
  return process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || null;
}

/* -------------------------------------------------------- provider shapes -- */

export type RazorpayOrder = {
  id: string;
  entity: "order";
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string | null;
  status: "created" | "attempted" | "paid";
  notes: Record<string, string>;
  created_at: number;
};

export type RazorpayPaymentStatus =
  | "created"
  | "authorized"
  | "captured"
  | "refunded"
  | "failed";

export type RazorpayPayment = {
  id: string;
  entity: "payment";
  amount: number;
  currency: string;
  status: RazorpayPaymentStatus;
  order_id: string | null;
  method?: string;
  email?: string | null;
  contact?: string | null;
  error_code?: string | null;
  error_description?: string | null;
  created_at: number;
};

/** Raised for any non-2xx from Razorpay. Never surfaced to the browser as-is. */
export class RazorpayApiError extends Error {
  constructor(
    readonly status: number,
    readonly providerCode: string | null,
    message: string,
  ) {
    super(message);
    this.name = "RazorpayApiError";
  }
}

/* ---------------------------------------------------------------- request -- */

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

async function request<T>(
  credentials: RazorpayCredentials,
  path: string,
  init: { method: "GET" | "POST" | "PATCH"; body?: unknown } = { method: "GET" },
): Promise<T> {
  const auth = Buffer.from(`${credentials.keyId}:${credentials.keySecret}`).toString("base64");

  /* A stuck payment provider must not hold a serverless function open until the
     platform kills it — the person is left staring at a spinner either way, and
     a clean timeout gives them a retry instead. */
  const signal = AbortSignal.timeout(15_000);

  let response: Response;
  try {
    response = await fetch(`${API}${path}`, {
      method: init.method,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal,
      cache: "no-store",
    });
  } catch (cause) {
    // Network, DNS or timeout. Nothing was signed, so nothing is ambiguous.
    throw new RazorpayApiError(0, null, `Could not reach Razorpay: ${(cause as Error).name}`);
  }

  const raw: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = isRecord(raw) && isRecord(raw.error) ? raw.error : null;
    throw new RazorpayApiError(
      response.status,
      typeof error?.code === "string" ? error.code : null,
      typeof error?.description === "string" ? error.description : `HTTP ${response.status}`,
    );
  }

  return raw as T;
}

/* ----------------------------------------------------------------- orders -- */

/**
 * Create an order.
 *
 * `amount` is passed by the caller but is never caller-*supplied*: the route
 * hands it `REGISTRATION_AMOUNT_PAISE`, a server constant. The browser has no
 * way to influence it, which is the whole point.
 */
export function createOrder(
  credentials: RazorpayCredentials,
  input: {
    amount: number;
    currency: "INR";
    receipt: string;
    notes: Record<string, string>;
  },
): Promise<RazorpayOrder> {
  if (input.receipt.length > RECEIPT_MAX) {
    throw new Error(`Receipt exceeds the ${RECEIPT_MAX}-character limit Razorpay allows.`);
  }
  return request<RazorpayOrder>(credentials, "/orders", { method: "POST", body: input });
}

export function fetchOrder(credentials: RazorpayCredentials, orderId: string) {
  return request<RazorpayOrder>(credentials, `/orders/${encodeURIComponent(orderId)}`);
}

export function fetchPayment(credentials: RazorpayCredentials, paymentId: string) {
  return request<RazorpayPayment>(credentials, `/payments/${encodeURIComponent(paymentId)}`);
}

/**
 * Merge keys into an order's notes.
 *
 * Razorpay's update-order call *replaces* the whole notes object, so the
 * current one is read first. This is how a registration's status is written
 * back to its durable home — see `registrations.ts`.
 */
export async function updateOrderNotes(
  credentials: RazorpayCredentials,
  orderId: string,
  patch: Record<string, string>,
): Promise<RazorpayOrder> {
  const current = await fetchOrder(credentials, orderId);
  return request<RazorpayOrder>(credentials, `/orders/${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    body: { notes: { ...current.notes, ...patch } },
  });
}

/**
 * Capture an authorised payment.
 *
 * Razorpay accounts default to auto-capture, in which case a successful payment
 * arrives already `captured` and this is never called. An account set to manual
 * capture instead leaves the money merely *authorised* — real, held, but not
 * taken. Treating that as PAID would hand someone a seat for money we never
 * collected, so the server captures it first and only then confirms.
 */
export function capturePayment(
  credentials: RazorpayCredentials,
  paymentId: string,
  amount: number,
  currency: "INR",
): Promise<RazorpayPayment> {
  return request<RazorpayPayment>(
    credentials,
    `/payments/${encodeURIComponent(paymentId)}/capture`,
    { method: "POST", body: { amount, currency } },
  );
}

/* ------------------------------------------------------------- signatures -- */

/** Constant-time compare of two hex digests, safe on length mismatch. */
function hexEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    // Non-hex input: a malformed or forged signature.
    return false;
  }
}

/**
 * The Checkout handshake: HMAC-SHA256 of `order_id|payment_id`, keyed by the
 * API key secret. This is what proves the three values the browser just handed
 * us came from Razorpay rather than from a console.
 */
export function isValidCheckoutSignature(
  keySecret: string,
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return hexEquals(expected, signature);
}

/**
 * A webhook delivery: HMAC-SHA256 of the **raw** request body, keyed by the
 * webhook secret.
 *
 * Raw, not re-serialised — `JSON.parse` followed by `JSON.stringify` reorders
 * keys and drops whitespace, and the digest would never match.
 */
export function isValidWebhookSignature(
  webhookSecret: string,
  rawBody: string,
  signature: string,
): boolean {
  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return hexEquals(expected, signature);
}

/* --------------------------------------------------------- reconciliation -- */

/**
 * List orders, newest first.
 *
 * Read-only, and used from exactly one place: the authenticated reconciliation
 * route, which rebuilds registration rows from the orders that are their
 * durable home. It is a repair and migration tool — the dashboard itself reads
 * the database, never this.
 *
 * Razorpay caps `count` at 100 per page and pages with `skip`.
 */
export type RazorpayList<T> = { entity: "collection"; count: number; items: T[] };

export function listOrders(
  credentials: RazorpayCredentials,
  page: { count: number; skip: number },
): Promise<RazorpayList<RazorpayOrder>> {
  const query = new URLSearchParams({
    count: String(Math.min(100, Math.max(1, page.count))),
    skip: String(Math.max(0, page.skip)),
  });
  return request<RazorpayList<RazorpayOrder>>(credentials, `/orders?${query.toString()}`);
}

/**
 * The payments attempted against one order.
 *
 * Needed only for historical rows: an order paid before the notes carried
 * `paid_at` still knows when its capture happened, and this is where that
 * timestamp lives. Nothing on the live payment path calls it.
 */
export function fetchOrderPayments(
  credentials: RazorpayCredentials,
  orderId: string,
): Promise<RazorpayList<RazorpayPayment>> {
  return request<RazorpayList<RazorpayPayment>>(
    credentials,
    `/orders/${encodeURIComponent(orderId)}/payments`,
  );
}
