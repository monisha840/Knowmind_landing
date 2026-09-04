/**
 * Where a registration lives, and how it changes state.
 *
 * ---------------------------------------------------------------------------
 * The design decision worth knowing before changing anything here
 * ---------------------------------------------------------------------------
 * This project has no database (CLAUDE.md §2), and inventing one — a JSON file
 * on a read-only serverless filesystem, or a module-level Map that a second
 * Vercel instance cannot see — would be a fake implementation of persistence
 * (§0.4). The kind that passes a local test and loses a paying customer.
 *
 * So the durable record of a registration is **the Razorpay order itself**.
 * Every answer is written into the order's `notes` at creation time, which
 * means the record is:
 *
 *   - durable without provisioning anything, because Razorpay stores it;
 *   - readable by a human in the Razorpay dashboard next to the payment;
 *   - reachable from `razorpay_order_id`, which is exactly the handle both
 *     the verify route and the webhook are given.
 *
 * Verification therefore never depends on local storage: `loadFromOrder`
 * rebuilds the whole registration from Razorpay, on any instance, at any time.
 * That is what makes the flow correct on Vercel and idempotent under retries.
 *
 * The Redis mirror below is an *optimisation and an ops convenience*, never the
 * source of truth. When `KV_REST_API_URL` is unset it silently does nothing and
 * the flow is unaffected — which is the honest way for an optional dependency
 * to be absent.
 */

import { programDetails, siteConfig } from "@/lib/config";
import type { Answers } from "@/lib/validation";
import type { PaymentStatus, Registration } from "@/lib/payments/types";
import {
  type RazorpayCredentials,
  type RazorpayOrder,
  fetchOrder,
  updateOrderNotes,
} from "@/lib/payments/razorpay";
import { recordRegistration } from "@/lib/db/registrations";

if (typeof window !== "undefined") {
  throw new Error(
    "lib/payments/registrations is server-only and must never be imported by a client component.",
  );
}

/**
 * The price, in paise, decided here and only here.
 *
 * Derived from `programDetails.price` so it cannot drift from the ₹699 the page
 * renders (CLAUDE.md §1.1, §7.5). Razorpay works in the smallest currency unit,
 * so ₹699 is 69900 — passing 699 would charge six rupees and ninety-nine paise.
 *
 * Nothing in the browser contributes to this value. A request body that tries
 * to carry an amount is ignored, not validated.
 */
export const REGISTRATION_AMOUNT_PAISE = programDetails.price * 100;
export const REGISTRATION_CURRENCY = "INR" as const;

/* ------------------------------------------------------------ identifiers -- */

/**
 * A registration id that doubles as the Razorpay receipt.
 *
 * Razorpay caps `receipt` at 40 characters, so this stays well inside it:
 * `km_` + base36 milliseconds + 8 random base36 characters, ~24 in total. The
 * timestamp makes it sortable and the random tail makes a collision between two
 * people registering in the same millisecond a non-event.
 */
export function newRegistrationId(): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10).padEnd(8, "0");
  return `km_${time}${random}`;
}

/* ------------------------------------------------- the record, as notes ---- */

/**
 * Razorpay allows 15 notes keys with values up to 256 characters. Eleven are
 * used, all comfortably short — validation already caps name at 60, occupation
 * at 80 and email at 254.
 */
function toNotes(registration: Registration): Record<string, string> {
  const { answers } = registration;
  return {
    registration_id: registration.id,
    payment_status: registration.status,
    name: answers.name,
    gender: answers.gender,
    age: answers.age,
    occupation: answers.occupation,
    mobile: answers.mobile,
    email: answers.email,
    program: siteConfig.program,
    batch: siteConfig.batch,
    created_at: String(registration.createdAt),
  };
}

const note = (order: RazorpayOrder, key: string): string =>
  typeof order.notes?.[key] === "string" ? order.notes[key] : "";

function answersFromOrder(order: RazorpayOrder): Answers {
  return {
    name: note(order, "name"),
    gender: note(order, "gender"),
    age: note(order, "age"),
    occupation: note(order, "occupation"),
    mobile: note(order, "mobile"),
    email: note(order, "email"),
  };
}

/**
 * Rebuild a registration from its order.
 *
 * Status is derived from Razorpay's own view first and the stored note second.
 * The note is what we last wrote; `order.status === "paid"` is what actually
 * happened. When they disagree — a notes write that failed after the money
 * moved — Razorpay wins, because the money is the fact.
 */
export function registrationFromOrder(order: RazorpayOrder): Registration {
  const stored = note(order, "payment_status");
  const storedStatus: PaymentStatus =
    stored === "PAID" || stored === "FAILED" || stored === "PENDING" ? stored : "PENDING";

  const status: PaymentStatus = order.status === "paid" ? "PAID" : storedStatus;

  const createdAt = Number(note(order, "created_at")) || order.created_at * 1000;
  const paidAtNote = Number(note(order, "paid_at"));

  return {
    id: note(order, "registration_id") || order.receipt || order.id,
    answers: answersFromOrder(order),
    status,
    amount: order.amount,
    currency: REGISTRATION_CURRENCY,
    razorpayOrderId: order.id,
    razorpayPaymentId: note(order, "razorpay_payment_id") || null,
    createdAt,
    paidAt: status === "PAID" ? paidAtNote || null : null,
  };
}

/** Read a registration back from Razorpay. Works on any instance, any time. */
export async function loadFromOrder(
  credentials: RazorpayCredentials,
  orderId: string,
): Promise<{ order: RazorpayOrder; registration: Registration }> {
  const order = await fetchOrder(credentials, orderId);
  return { order, registration: registrationFromOrder(order) };
}

/* -------------------------------------------------------------- mutations -- */

/** Build the PENDING record that a Razorpay order is then created from. */
export function pendingRegistration(id: string, answers: Answers): Registration {
  return {
    id,
    answers,
    status: "PENDING",
    amount: REGISTRATION_AMOUNT_PAISE,
    currency: REGISTRATION_CURRENCY,
    razorpayOrderId: null,
    razorpayPaymentId: null,
    createdAt: Date.now(),
    paidAt: null,
  };
}

export function initialNotes(registration: Registration): Record<string, string> {
  return toNotes(registration);
}

/**
 * Mark a registration PAID.
 *
 * Idempotent by construction: it writes the same three notes whatever the
 * previous state, so a webhook arriving after the browser already confirmed —
 * or a verify request replayed twice — converges on the same record instead of
 * creating a second one. There is one order per registration and one capture
 * per order, so "duplicate PAID registrations" has no way to occur.
 *
 * A failure to write the notes is logged and swallowed: the money has moved and
 * `order.status` already says `paid`, so `registrationFromOrder` still reports
 * PAID. Refusing to confirm a genuinely paid registration because a bookkeeping
 * write failed would be the worse outcome.
 */
export async function markPaid(
  credentials: RazorpayCredentials,
  orderId: string,
  paymentId: string,
): Promise<void> {
  try {
    await updateOrderNotes(credentials, orderId, {
      payment_status: "PAID",
      razorpay_payment_id: paymentId,
      paid_at: String(Date.now()),
    });
  } catch (cause) {
    logPaymentEvent("notes_write_failed", {
      orderId,
      paymentId,
      reason: (cause as Error).message,
    });
  }
}

/**
 * Record a failed attempt.
 *
 * Never downgrades a PAID record: a `payment.failed` webhook for an earlier
 * abandoned attempt can arrive after a later successful one, and letting it
 * overwrite the success would un-register someone who paid.
 */
export async function markFailed(
  credentials: RazorpayCredentials,
  orderId: string,
  paymentId: string | null,
): Promise<void> {
  try {
    const order = await fetchOrder(credentials, orderId);
    if (order.status === "paid" || note(order, "payment_status") === "PAID") return;

    await updateOrderNotes(credentials, orderId, {
      payment_status: "FAILED",
      ...(paymentId ? { last_failed_payment_id: paymentId } : {}),
    });
  } catch (cause) {
    logPaymentEvent("notes_write_failed", { orderId, reason: (cause as Error).message });
  }
}

/* ------------------------------------------------------- the Redis mirror -- */

type KvConfig = { url: string; token: string };

function kvConfig(): KvConfig | null {
  const url = process.env.KV_REST_API_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

/**
 * One Redis command over the REST API — no npm client.
 *
 * Vercel KV and Upstash both accept a JSON array command on the root path, so
 * this is the whole adapter. Every failure resolves to `null`: the mirror is
 * never allowed to break a payment (CLAUDE.md §9.3 — a failure in a
 * non-essential subsystem must not break the path to registration).
 */
async function kv(...command: (string | number)[]): Promise<unknown> {
  const config = kvConfig();
  if (!config) return null;

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    return typeof body === "object" && body !== null && "result" in body
      ? (body as { result: unknown }).result
      : null;
  } catch {
    return null;
  }
}

/** Ninety days: long enough to answer "did this person register?" after the batch. */
const MIRROR_TTL_SECONDS = 90 * 24 * 60 * 60;

/**
 * Best-effort mirror, indexed by both registration id and order id.
 *
 * Never downgrades a PAID entry — the same rule `markFailed` applies to the
 * order notes, extended here: a `payment.failed` webhook for an abandoned
 * first attempt can still arrive after a successful second one, and this is
 * the only write path to the mirror that does not already re-check Razorpay
 * before writing (unlike `markPaid`/`markFailed`, which own the order).
 */
export async function mirror(registration: Registration): Promise<void> {
  if (!kvConfig()) return;

  if (registration.status !== "PAID") {
    const existingRaw = await kv("GET", `knowmind:registration:${registration.id}`);
    if (typeof existingRaw === "string") {
      try {
        if ((JSON.parse(existingRaw) as Registration).status === "PAID") return;
      } catch {
        // Malformed mirror entry — fall through and overwrite it below.
      }
    }
  }

  const payload = JSON.stringify(registration);
  await kv("SET", `knowmind:registration:${registration.id}`, payload, "EX", MIRROR_TTL_SECONDS);
  if (registration.razorpayOrderId) {
    await kv(
      "SET",
      `knowmind:order:${registration.razorpayOrderId}`,
      registration.id,
      "EX",
      MIRROR_TTL_SECONDS,
    );
  }
}

/**
 * A short cross-instance lock, so two concurrent confirmations of the same
 * order do not both run the capture-and-write path.
 *
 * Returns true when the caller holds the lock, and — importantly — also true
 * when no mirror is configured. Without a lock the work is still idempotent;
 * it just may happen twice, which costs a redundant API call and nothing else.
 */
export async function acquireConfirmLock(orderId: string): Promise<boolean> {
  if (!kvConfig()) return true;
  const result = await kv("SET", `knowmind:lock:${orderId}`, "1", "NX", "EX", 30);
  return result === "OK" || result === null;
}

/* ------------------------------------------------------------------- logs -- */

/**
 * Server-side diagnostics.
 *
 * Ids, states and reasons — never a key, never a signature, never a full set of
 * personal details (CLAUDE.md §9.3, §18). Enough to reconstruct what happened
 * from the Razorpay dashboard, and nothing that would hurt in a log aggregator.
 */
export function logPaymentEvent(event: string, fields: Record<string, unknown> = {}): void {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    safe[key] = typeof value === "string" && value.length > 200 ? `${value.slice(0, 200)}…` : value;
  }
  console.info(`[payments] ${event}`, safe);
}

/* -------------------------------------------------- the registration store -- */

/**
 * Write a registration down everywhere it belongs.
 *
 * Replaces the bare `mirror()` call at the three points a registration changes
 * — order created, payment verified, webhook confirmed — so those three routes
 * gained a lead store without gaining a single line of new payment logic.
 *
 * Order matters only in that neither step may break the other, and neither may
 * break the caller: `mirror` already swallows everything, `recordRegistration`
 * returns false rather than throwing, and both are awaited so a serverless
 * function is not killed mid-write.
 *
 * This is the fail-open policy in one place. A database that is unconfigured,
 * unreachable or rejecting produces a log line and nothing else — never a
 * failed registration, and never a person told their payment did not work
 * because a bookkeeping row could not be written (CLAUDE.md §9.3). What is lost
 * in that case is only the *row*: the Razorpay order's notes still hold the
 * complete record, and `/api/admin/reconcile` rebuilds it from there.
 */
export async function saveRegistration(registration: Registration): Promise<void> {
  await mirror(registration);

  const written = await recordRegistration(registration);
  if (!written) {
    logPaymentEvent("registration_not_stored", {
      registrationId: registration.id,
      orderId: registration.razorpayOrderId,
      status: registration.status,
    });
  }
}
