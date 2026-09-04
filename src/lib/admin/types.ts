/**
 * The contract between the admin dashboard's browser half and its API routes.
 *
 * Client-safe on purpose: no `node:` imports, nothing that reads `process.env`,
 * nothing that touches the database. `AdminDashboard` imports these types into
 * the client bundle, and `import type` erases at compile time — the same
 * discipline `lib/payments/types.ts` follows for the checkout contract.
 */

/**
 * Where a registration stands, as the dashboard stores it.
 *
 * PENDING        — answers captured, a Razorpay order exists, nothing paid.
 * PAID           — a real payment, verified server-side. Terminal: nothing
 *                  downgrades it, in code or in SQL.
 * PAYMENT_FAILED — Razorpay reported an attempt as failed, or verification
 *                  found the payment uncaptured. Not terminal; a person may
 *                  simply try again, and a later success overwrites it.
 *
 * There is deliberately no CANCELLED. Closing the Checkout window is a fact
 * only the browser knows, and the browser is not allowed to write status here.
 * A long-untouched PENDING is *displayed* as "Abandoned" — see `ABANDONED_AFTER_MS`
 * — but its stored status stays PENDING, because that is what we actually know.
 */
export type LeadStatus = "PENDING" | "PAID" | "PAYMENT_FAILED";

export const LEAD_STATUSES: readonly LeadStatus[] = ["PENDING", "PAID", "PAYMENT_FAILED"];

/** Which set of Razorpay keys produced a row. Test rows are never counted as real. */
export type KeyMode = "test" | "live";

/**
 * Where a PAID row's WhatsApp confirmation stands.
 *
 * NOT_SENT — the default. Either not yet PAID, or PAID and not yet attempted.
 * PENDING  — a send is claimed and in flight, or the last attempt is awaiting
 *            a scheduled retry. See `RETRY_BACKOFF_MINUTES` in
 *            `lib/db/registrations.ts` for what "awaiting" means here.
 * SENT     — Evolution Go accepted the message. Terminal: nothing retries a
 *            SENT row, so the one-message rule never depends on read-your-
 *            writes timing after this point.
 * FAILED   — every attempt failed, or the number could not be normalised.
 *            Not terminal below `WHATSAPP_MAX_ATTEMPTS` — the retry sweep can
 *            still pick it back up.
 */
export type WhatsappStatus = "NOT_SENT" | "PENDING" | "SENT" | "FAILED";

export const WHATSAPP_STATUSES: readonly WhatsappStatus[] = [
  "NOT_SENT",
  "PENDING",
  "SENT",
  "FAILED",
];

/**
 * A PENDING registration older than this is shown as "Abandoned".
 *
 * A display rule and nothing more. Twenty-four hours is well past any genuine
 * "I got distracted mid-payment" window, and short enough that yesterday's
 * drop-offs are visible today.
 */
export const ABANDONED_AFTER_MS = 24 * 60 * 60 * 1000;

/** One registration, as the admin API returns it. Timestamps are ISO 8601 UTC. */
export type Lead = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  gender: string | null;
  age: string | null;
  occupation: string | null;
  status: LeadStatus;
  /** Paise, as this order was actually created. Never a current constant. */
  amountPaise: number;
  currency: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  keyMode: KeyMode;
  createdAt: string;
  paidAt: string | null;
  updatedAt: string;
  whatsappStatus: WhatsappStatus;
  whatsappAttempts: number;
  whatsappSentAt: string | null;
  whatsappMessageId: string | null;
  /** Sanitised — see `sanitizeWhatsappError` in `lib/whatsapp/evolution.ts`. */
  whatsappError: string | null;
};

/** Counts for the current search + mode, broken down by status. */
export type LeadStats = {
  total: number;
  paid: number;
  pending: number;
  failed: number;
  /** Subset of `pending`, by age. A view, not a stored state. */
  abandoned: number;
};

export type LeadSort = "newest" | "oldest";
export type StatusFilter = LeadStatus | "ALL" | "ABANDONED";
export type ModeFilter = KeyMode | "all";

export type LeadQuery = {
  search: string;
  status: StatusFilter;
  mode: ModeFilter;
  sort: LeadSort;
  page: number;
  pageSize: number;
};

/**
 * What the query layer produces: rows and counts, and nothing it cannot know
 * from the database alone.
 */
export type LeadPageData = {
  rows: Lead[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  /** For the selected mode, before the status filter is applied. */
  stats: LeadStats;
  /** Per-mode totals for the current search, so the selector can be labelled. */
  modeTotals: Record<KeyMode, number>;
  /**
   * False when `DATABASE_URL` is unset. The dashboard says so plainly instead
   * of rendering an empty table that looks like "nobody registered".
   */
  databaseConfigured: boolean;
};

/**
 * GET /api/admin/registrations — 200.
 *
 * The page data, plus the deployment facts the route can answer and the query
 * layer cannot.
 */
export type LeadPage = LeadPageData & {
  /**
   * False when `RAZORPAY_WEBHOOK_SECRET` is unset.
   *
   * Surfaced rather than merely documented because its absence is invisible
   * until it costs somebody a registration: without the webhook, a payment
   * whose browser never came back is confirmed by nothing, and no row here will
   * ever say PAID. The dashboard is the one place the owner would notice.
   */
  webhookConfigured: boolean;
};

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
