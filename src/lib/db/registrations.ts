/**
 * The registration store: writes from the payment flow, reads for the admin
 * dashboard.
 *
 * ---------------------------------------------------------------------------
 * What this module is, and what it is not
 * ---------------------------------------------------------------------------
 * It is the lead list — the durable, queryable record of who registered, which
 * the Razorpay dashboard cannot give us in a form anyone can search, filter or
 * export.
 *
 * It is NOT the authority on money. Nothing here decides that a payment
 * happened. `PAID` arrives already decided, from the two callers that were
 * always allowed to decide it — `/api/razorpay/verify` after a signature check
 * plus a read-back of both the order and the payment, and the signed webhook.
 * This module writes down what they concluded.
 *
 * Two rules are enforced here in SQL as well as in code, because a bug in the
 * calling layer must not be able to undo a payment:
 *
 *   1. PAID is terminal. The upsert refuses to move a PAID row to any other
 *      status, mirroring `markFailed`'s refusal to downgrade a paid order.
 *   2. PAID requires a payment id. The `paid_has_payment_id` constraint makes a
 *      payment-less PAID row unrepresentable.
 *
 * Every write is fail-open: a database that is unreachable, unconfigured or
 * rejecting is logged and swallowed, never propagated into the payment path.
 * The Razorpay order's notes still carry the complete record, so a gap is a
 * bookkeeping gap and the reconciliation route closes it.
 */

import {
  type Row,
  db,
  int,
  iso,
  isDatabaseConfigured,
  logDbEvent,
  text,
  textOrNull,
} from "@/lib/db/client";
import {
  ABANDONED_AFTER_MS,
  DEFAULT_PAGE_SIZE,
  type KeyMode,
  type Lead,
  type LeadPageData,
  type LeadQuery,
  type LeadStats,
  type LeadStatus,
  MAX_PAGE_SIZE,
  type WhatsappStatus,
} from "@/lib/admin/types";
import type { PaymentStatus, Registration } from "@/lib/payments/types";

if (typeof window !== "undefined") {
  throw new Error(
    "lib/db/registrations is server-only and must never be imported by a client component.",
  );
}

/* ------------------------------------------------------------- vocabulary -- */

/**
 * The payment layer's three states, in the dashboard's vocabulary.
 *
 * Only the name of the failure state differs. The notes written into a Razorpay
 * order keep saying FAILED — changing an on-the-wire contract that a working
 * payment flow depends on, for a cosmetic reason, is exactly the kind of change
 * CLAUDE.md §0.3 exists to prevent.
 */
export function toLeadStatus(status: PaymentStatus): LeadStatus {
  return status === "FAILED" ? "PAYMENT_FAILED" : status;
}

/**
 * Which key pair produced a row.
 *
 * Razorpay live key ids are prefixed `rzp_live_`; test ones are not. Anything
 * else is treated as test, because the only way to reach this line without a
 * live key is a test environment or a misconfigured one, and mislabelling a
 * real registration as test is far less damaging than the reverse.
 */
export function currentKeyMode(): KeyMode {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() ?? "";
  return keyId.startsWith("rzp_live_") ? "live" : "test";
}

/* ----------------------------------------------------------------- writes -- */

export type LeadUpsert = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  gender: string | null;
  age: string | null;
  occupation: string | null;
  status: LeadStatus;
  amountPaise: number;
  currency: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  keyMode: KeyMode;
  createdAtMs: number;
  paidAtMs: number | null;
};

/**
 * Insert or update one registration.
 *
 * The ON CONFLICT clause is where the two invariants live:
 *
 *   status  — a row already PAID stays PAID, whatever this write claims.
 *   paid_at — likewise preserved, so a replayed webhook cannot restamp the
 *             moment somebody paid.
 *
 * `razorpay_payment_id` is COALESCEd rather than overwritten, so a later write
 * that happens not to carry it (a reconciliation pass over an order whose notes
 * were never updated) cannot erase a payment id we already proved — and on a
 * row that is already PAID it is frozen outright, because a `payment.failed`
 * webhook for an abandoned *earlier* attempt arrives carrying its own payment
 * id, and COALESCE alone would let that id displace the one that actually paid.
 *
 * Returns true when the row was written, false when it was skipped — never
 * throws. The caller is on the payment path and must not care.
 */
export async function upsertLead(lead: LeadUpsert): Promise<boolean> {
  const sql = db();
  if (!sql) {
    logDbEvent("write_skipped_no_database", { registrationId: lead.id, status: lead.status });
    return false;
  }

  /* Defence in depth for the constraint below. Reaching the database with an
     unprovable PAID would be an error, not a row worth having. */
  if (lead.status === "PAID" && !lead.razorpayPaymentId) {
    logDbEvent("write_refused_paid_without_payment_id", { registrationId: lead.id });
    return false;
  }

  try {
    await sql.query(
      `INSERT INTO registrations (
         id, name, email, mobile, gender, age, occupation,
         status, amount_paise, currency,
         razorpay_order_id, razorpay_payment_id, key_mode,
         created_at, paid_at, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7,
         $8, $9, $10,
         $11, $12, $13,
         to_timestamp($14::bigint / 1000.0),
         CASE WHEN $15::bigint IS NULL THEN NULL ELSE to_timestamp($15::bigint / 1000.0) END,
         now()
       )
       ON CONFLICT (id) DO UPDATE SET
         name       = EXCLUDED.name,
         email      = EXCLUDED.email,
         mobile     = EXCLUDED.mobile,
         gender     = COALESCE(EXCLUDED.gender, registrations.gender),
         age        = COALESCE(EXCLUDED.age, registrations.age),
         occupation = COALESCE(EXCLUDED.occupation, registrations.occupation),
         status     = CASE WHEN registrations.status = 'PAID'
                           THEN 'PAID' ELSE EXCLUDED.status END,
         amount_paise = EXCLUDED.amount_paise,
         currency     = EXCLUDED.currency,
         razorpay_order_id   = COALESCE(EXCLUDED.razorpay_order_id, registrations.razorpay_order_id),
         razorpay_payment_id = CASE WHEN registrations.status = 'PAID'
                                    THEN registrations.razorpay_payment_id
                                    ELSE COALESCE(EXCLUDED.razorpay_payment_id,
                                                  registrations.razorpay_payment_id) END,
         key_mode   = EXCLUDED.key_mode,
         paid_at    = CASE WHEN registrations.status = 'PAID'
                           THEN registrations.paid_at
                           ELSE COALESCE(EXCLUDED.paid_at, registrations.paid_at) END,
         updated_at = now()`,
      [
        lead.id,
        lead.name,
        lead.email,
        lead.mobile,
        lead.gender,
        lead.age,
        lead.occupation,
        lead.status,
        lead.amountPaise,
        lead.currency,
        lead.razorpayOrderId,
        lead.razorpayPaymentId,
        lead.keyMode,
        lead.createdAtMs,
        lead.paidAtMs,
      ],
    );
    return true;
  } catch (cause) {
    /* Swallowed on purpose. This is called from inside the registration and
       verification paths, and a bookkeeping failure must never turn into a
       person being told their payment did not work. */
    logDbEvent("write_failed", {
      registrationId: lead.id,
      status: lead.status,
      reason: (cause as Error).message,
    });
    return false;
  }
}

/** The payment layer's `Registration`, written down. Never throws. */
export async function recordRegistration(registration: Registration): Promise<boolean> {
  const answers = registration.answers;
  return upsertLead({
    id: registration.id,
    name: answers.name,
    email: answers.email,
    mobile: answers.mobile,
    gender: answers.gender || null,
    age: answers.age || null,
    occupation: answers.occupation || null,
    status: toLeadStatus(registration.status),
    amountPaise: registration.amount,
    currency: registration.currency,
    razorpayOrderId: registration.razorpayOrderId,
    razorpayPaymentId: registration.razorpayPaymentId,
    keyMode: currentKeyMode(),
    createdAtMs: registration.createdAt,
    paidAtMs: registration.paidAt,
  });
}

/* ------------------------------------------------------------------ reads -- */

const LEAD_COLUMNS = [
  "id",
  "name",
  "email",
  "mobile",
  "gender",
  "age",
  "occupation",
  "status",
  "amount_paise",
  "currency",
  "razorpay_order_id",
  "razorpay_payment_id",
  "key_mode",
  `${iso("created_at")} AS created_at`,
  `${iso("paid_at")} AS paid_at`,
  `${iso("updated_at")} AS updated_at`,
  "whatsapp_status",
  "whatsapp_attempts",
  `${iso("whatsapp_sent_at")} AS whatsapp_sent_at`,
  "whatsapp_message_id",
  "whatsapp_error",
].join(", ");

function toWhatsappStatus(value: unknown): WhatsappStatus {
  const status = text(value);
  return status === "PENDING" || status === "SENT" || status === "FAILED"
    ? status
    : "NOT_SENT";
}

function toLead(row: Row): Lead {
  const status = text(row.status);
  const mode = text(row.key_mode);
  return {
    id: text(row.id),
    name: text(row.name),
    email: text(row.email),
    mobile: text(row.mobile),
    gender: textOrNull(row.gender),
    age: textOrNull(row.age),
    occupation: textOrNull(row.occupation),
    status: status === "PAID" || status === "PAYMENT_FAILED" ? status : "PENDING",
    amountPaise: int(row.amount_paise),
    currency: text(row.currency) || "INR",
    razorpayOrderId: textOrNull(row.razorpay_order_id),
    razorpayPaymentId: textOrNull(row.razorpay_payment_id),
    keyMode: mode === "live" ? "live" : "test",
    createdAt: text(row.created_at),
    paidAt: textOrNull(row.paid_at),
    updatedAt: text(row.updated_at),
    whatsappStatus: toWhatsappStatus(row.whatsapp_status),
    whatsappAttempts: int(row.whatsapp_attempts),
    whatsappSentAt: textOrNull(row.whatsapp_sent_at),
    whatsappMessageId: textOrNull(row.whatsapp_message_id),
    whatsappError: textOrNull(row.whatsapp_error),
  };
}

/**
 * ILIKE takes `%` and `_` as wildcards, so somebody searching for a literal
 * underscore would otherwise get a single-character wildcard. Escaped rather
 * than stripped — their search term is their business.
 */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

type Filters = { clauses: string[]; params: unknown[] };

function searchFilter(search: string): Filters {
  const params: unknown[] = [];
  const clauses: string[] = [];
  const term = search.trim();

  if (term) {
    params.push(`%${escapeLike(term)}%`);
    const p = `$${params.length}`;
    clauses.push(
      `(name ILIKE ${p} OR email ILIKE ${p} OR mobile ILIKE ${p} OR id ILIKE ${p}` +
        ` OR razorpay_order_id ILIKE ${p} OR razorpay_payment_id ILIKE ${p})`,
    );
  }

  return { clauses, params };
}

const whereOf = (clauses: string[]) => (clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "");

/** The cutoff a PENDING row has to predate to read as abandoned. */
const abandonedCutoff = () => new Date(Date.now() - ABANDONED_AFTER_MS).toISOString();

const emptyStats = (): LeadStats => ({ total: 0, paid: 0, pending: 0, failed: 0, abandoned: 0 });

/** Everything the browser sends, clamped to something this module will run. */
export function normaliseQuery(query: Partial<LeadQuery>): LeadQuery {
  const { status, mode } = query;
  return {
    search: (query.search ?? "").slice(0, 120),
    status:
      status === "PAID" ||
      status === "PENDING" ||
      status === "PAYMENT_FAILED" ||
      status === "ABANDONED"
        ? status
        : "ALL",
    mode: mode === "test" || mode === "live" ? mode : "all",
    sort: query.sort === "oldest" ? "oldest" : "newest",
    page: Math.max(1, Math.trunc(Number(query.page) || 1)),
    pageSize: Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Math.trunc(Number(query.pageSize) || DEFAULT_PAGE_SIZE)),
    ),
  };
}

/** The mode and status clauses, appended to a filter already holding the search. */
function applyFacets(query: LeadQuery, filter: Filters, cutoff: string): void {
  if (query.mode !== "all") {
    filter.params.push(query.mode);
    filter.clauses.push(`key_mode = $${filter.params.length}`);
  }

  if (query.status === "ABANDONED") {
    filter.params.push(cutoff);
    filter.clauses.push(`status = 'PENDING' AND created_at < $${filter.params.length}::timestamptz`);
  } else if (query.status !== "ALL") {
    filter.params.push(query.status);
    filter.clauses.push(`status = $${filter.params.length}`);
  }
}

/**
 * One page of leads, plus the counts the dashboard's tiles show.
 *
 * Two round trips, not more. The status breakdown deliberately ignores the
 * status filter — the tiles are how you *choose* a status, so they have to keep
 * showing all four while one of them is active. The mode totals ignore the mode
 * filter for the same reason.
 */
export async function listLeads(input: Partial<LeadQuery>): Promise<LeadPageData> {
  const query = normaliseQuery(input);
  const configured = isDatabaseConfigured();
  const sql = db();

  if (!sql) {
    return {
      rows: [],
      total: 0,
      page: query.page,
      pageSize: query.pageSize,
      pageCount: 0,
      stats: emptyStats(),
      modeTotals: { test: 0, live: 0 },
      databaseConfigured: configured,
    };
  }

  const cutoff = abandonedCutoff();

  /* ---- counts: search only, so the tiles and mode labels stay stable ---- */

  const counted = searchFilter(query.search);
  counted.params.push(cutoff);
  const stalePlaceholder = `$${counted.params.length}`;

  const countRows = (await sql.query(
    `SELECT status, key_mode, COUNT(*)::int AS n,` +
      ` COUNT(*) FILTER (WHERE created_at < ${stalePlaceholder}::timestamptz)::int AS stale` +
      ` FROM registrations${whereOf(counted.clauses)}` +
      ` GROUP BY status, key_mode`,
    counted.params,
  )) as Row[];

  const stats = emptyStats();
  const modeTotals: Record<KeyMode, number> = { test: 0, live: 0 };

  for (const row of countRows) {
    const status = text(row.status);
    const mode: KeyMode = text(row.key_mode) === "live" ? "live" : "test";
    const n = int(row.n);

    modeTotals[mode] += n;
    if (query.mode !== "all" && query.mode !== mode) continue;

    stats.total += n;
    if (status === "PAID") stats.paid += n;
    else if (status === "PAYMENT_FAILED") stats.failed += n;
    else {
      stats.pending += n;
      stats.abandoned += int(row.stale);
    }
  }

  /* ---- the page itself ---- */

  const filter = searchFilter(query.search);
  applyFacets(query, filter, cutoff);

  const direction = query.sort === "oldest" ? "ASC" : "DESC";

  filter.params.push(query.pageSize);
  const limitPlaceholder = `$${filter.params.length}`;
  filter.params.push((query.page - 1) * query.pageSize);
  const offsetPlaceholder = `$${filter.params.length}`;

  const rows = (await sql.query(
    `SELECT ${LEAD_COLUMNS}, (COUNT(*) OVER ())::int AS total_rows` +
      ` FROM registrations${whereOf(filter.clauses)}` +
      ` ORDER BY created_at ${direction}, id ${direction}` +
      ` LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    filter.params,
  )) as Row[];

  const total = rows.length > 0 ? int(rows[0].total_rows) : 0;

  return {
    rows: rows.map(toLead),
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
    stats,
    modeTotals,
    databaseConfigured: configured,
  };
}

/** One lead by id, or null when it is not there (or there is no database). */
export async function getLead(id: string): Promise<Lead | null> {
  const sql = db();
  if (!sql) return null;

  const rows = (await sql.query(
    `SELECT ${LEAD_COLUMNS} FROM registrations WHERE id = $1 LIMIT 1`,
    [id],
  )) as Row[];

  return rows.length > 0 ? toLead(rows[0]) : null;
}

/**
 * Every row matching the current filters, for the CSV.
 *
 * Capped rather than unbounded: a runaway export would hold a serverless
 * function open and hand the browser a file nobody asked for. Twenty thousand
 * is far beyond any plausible cohort and still a bounded response.
 */
const EXPORT_LIMIT = 20_000;

export async function leadsForExport(input: Partial<LeadQuery>): Promise<Lead[]> {
  const sql = db();
  if (!sql) return [];

  const query = normaliseQuery(input);
  const filter = searchFilter(query.search);
  applyFacets(query, filter, abandonedCutoff());

  const direction = query.sort === "oldest" ? "ASC" : "DESC";
  filter.params.push(EXPORT_LIMIT);

  const rows = (await sql.query(
    `SELECT ${LEAD_COLUMNS} FROM registrations${whereOf(filter.clauses)}` +
      ` ORDER BY created_at ${direction}, id ${direction}` +
      ` LIMIT $${filter.params.length}`,
    filter.params,
  )) as Row[];

  return rows.map(toLead);
}

/* ------------------------------------------------------- WhatsApp delivery -- */

/**
 * How many times a PAID row's WhatsApp confirmation is attempted before it is
 * left FAILED for a human to notice in the dashboard, and how long to wait
 * between attempts. Index 0 is the wait before the *second* attempt (the
 * first always runs immediately, from the payment route itself); the sweep
 * that walks this schedule is `GET /api/whatsapp/retry`.
 *
 * A fixed staircase rather than true exponential backoff — five attempts over
 * eight-odd hours is already generous for a message that, once Evolution Go
 * is reachable at all, either sends in milliseconds or fails for a reason a
 * retry cannot fix (a malformed number, a revoked token).
 */
export const RETRY_BACKOFF_MINUTES = [5, 30, 120, 360] as const;
export const WHATSAPP_MAX_ATTEMPTS = RETRY_BACKOFF_MINUTES.length + 1;

/**
 * Claim the right to send this registration's WhatsApp confirmation.
 *
 * The whole idempotency guarantee lives in this one `UPDATE ... WHERE`: it
 * flips `whatsapp_status` to PENDING only when the row is PAID and currently
 * NOT_SENT or FAILED, and only one of two concurrent callers — a verify
 * request and a webhook confirming the same payment, or the retry sweep
 * racing either — can match that WHERE clause. Postgres's row lock decides
 * the winner; the loser's statement simply returns zero rows. No separate
 * lock, no KV, needed.
 *
 * Returns `false` — meaning "do not send" — for a genuinely absent database
 * too. Sending without this claim would mean sending without the one
 * mechanism that guarantees exactly once, which is a worse failure than not
 * sending; see `lib/whatsapp/notify.ts` for how that is surfaced.
 */
export async function claimWhatsappSend(id: string): Promise<boolean> {
  const sql = db();
  if (!sql) {
    logDbEvent("whatsapp_claim_skipped_no_database", { registrationId: id });
    return false;
  }

  try {
    const rows = (await sql.query(
      `UPDATE registrations
         SET whatsapp_status = 'PENDING',
             whatsapp_attempts = whatsapp_attempts + 1,
             whatsapp_last_attempt_at = now(),
             updated_at = now()
       WHERE id = $1
         AND status = 'PAID'
         AND whatsapp_status IN ('NOT_SENT', 'FAILED')
       RETURNING id`,
      [id],
    )) as Row[];
    return rows.length === 1;
  } catch (cause) {
    logDbEvent("whatsapp_claim_failed", { registrationId: id, reason: (cause as Error).message });
    return false;
  }
}

/** The claim succeeded and Evolution Go accepted the message. Terminal. */
export async function markWhatsappSent(id: string, messageId: string | null): Promise<void> {
  const sql = db();
  if (!sql) return;

  try {
    await sql.query(
      `UPDATE registrations
         SET whatsapp_status = 'SENT',
             whatsapp_sent_at = now(),
             whatsapp_message_id = $2,
             whatsapp_error = NULL,
             updated_at = now()
       WHERE id = $1 AND whatsapp_status = 'PENDING'`,
      [id, messageId],
    );
  } catch (cause) {
    logDbEvent("whatsapp_mark_sent_failed", { registrationId: id, reason: (cause as Error).message });
  }
}

/**
 * The claim succeeded but the send failed. Not terminal — leaves the row
 * eligible for the retry sweep to reclaim, up to `WHATSAPP_MAX_ATTEMPTS`.
 */
export async function markWhatsappFailed(id: string, error: string): Promise<void> {
  const sql = db();
  if (!sql) return;

  try {
    await sql.query(
      `UPDATE registrations
         SET whatsapp_status = 'FAILED',
             whatsapp_error = $2,
             updated_at = now()
       WHERE id = $1 AND whatsapp_status = 'PENDING'`,
      [id, error],
    );
  } catch (cause) {
    logDbEvent("whatsapp_mark_failed_failed", { registrationId: id, reason: (cause as Error).message });
  }
}

/**
 * PAID rows whose WhatsApp confirmation is outstanding and due for another
 * attempt, oldest first.
 *
 * The backoff itself is applied here in TypeScript rather than as SQL
 * interval arithmetic — `applyFacets` above keeps the same kind of policy out
 * of raw SQL for the same reason: a staircase indexed by attempt count reads
 * far more plainly as an array lookup than as a `CASE` on `whatsapp_attempts`.
 * The query does the one thing SQL is genuinely better at: filtering out rows
 * that are not due at all (wrong status, or already at the attempt ceiling).
 */
export async function listWhatsappRetryCandidates(limit: number): Promise<Lead[]> {
  const sql = db();
  if (!sql) return [];

  const rows = (await sql.query(
    `SELECT ${LEAD_COLUMNS}, ${iso("whatsapp_last_attempt_at")} AS whatsapp_last_attempt_at
       FROM registrations
      WHERE status = 'PAID'
        AND whatsapp_status IN ('NOT_SENT', 'FAILED')
        AND whatsapp_attempts < $1
      ORDER BY created_at ASC
      LIMIT $2`,
    [WHATSAPP_MAX_ATTEMPTS, Math.max(1, Math.min(100, limit))],
  )) as Row[];

  const now = Date.now();
  return rows
    .filter((row) => {
      const attempts = int(row.whatsapp_attempts);
      if (attempts === 0) return true; // never attempted — not a retry, always due
      const waitMinutes = RETRY_BACKOFF_MINUTES[attempts - 1];
      if (waitMinutes === undefined) return false; // at the ceiling
      const last = textOrNull(row.whatsapp_last_attempt_at);
      const lastMs = last ? new Date(last).getTime() : 0;
      return now - lastMs >= waitMinutes * 60_000;
    })
    .map(toLead);
}
