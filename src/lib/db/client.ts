/**
 * Neon Postgres, over HTTP, from the server only.
 *
 * ---------------------------------------------------------------------------
 * Why HTTP and not a pooled TCP client
 * ---------------------------------------------------------------------------
 * Every request to a serverless function is potentially a cold start, and a
 * cold start that opens a Postgres socket will exhaust `max_connections` under
 * any burst. Neon's driver sends each query as a single `fetch` to an HTTP
 * endpoint instead, so there is no pool to size and no pooler to operate. It is
 * also the same shape the rest of this codebase already uses to talk to
 * Razorpay and to KV — one `fetch`, one timeout, one failure mode.
 *
 * ---------------------------------------------------------------------------
 * Why an absent database is not an error
 * ---------------------------------------------------------------------------
 * `db()` returns `null` when `DATABASE_URL` is unset, and every caller in
 * `lib/db/registrations.ts` treats that as "skip, and say so in the log". That
 * is the fail-open policy the owner approved: a database outage must never
 * block a registration or a verified payment. The Razorpay order's `notes`
 * still hold the complete record either way, so nothing is lost — it is
 * recoverable through the reconciliation route.
 *
 * The one place that absence is surfaced rather than swallowed is the admin
 * dashboard, which says "database not configured" instead of showing an empty
 * table that reads as "nobody registered" (CLAUDE.md 0.4, 9.2).
 */

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * A hard stop rather than a convention, matching `lib/payments/razorpay.ts`.
 * A connection string is a credential; if this module is ever pulled into a
 * client component it fails loudly instead of quietly shipping one.
 */
if (typeof window !== "undefined") {
  throw new Error("lib/db/client is server-only and must never be imported by a client component.");
}

export type Sql = NeonQueryFunction<false, false>;

/** A row as the driver hands it back, before we narrow it. */
export type Row = Record<string, unknown>;

function databaseUrl(): string | null {
  return process.env.DATABASE_URL?.trim() || null;
}

export function isDatabaseConfigured(): boolean {
  return databaseUrl() !== null;
}

/**
 * Keyed by the URL rather than a plain module-level singleton, so a changed
 * environment variable during `next dev` is picked up on the next call instead
 * of being cached for the life of the process.
 */
let cached: { url: string; sql: Sql } | null = null;

/** The query function, or `null` when no database is configured. */
export function db(): Sql | null {
  const url = databaseUrl();
  if (!url) return null;
  if (cached?.url !== url) cached = { url, sql: neon(url) };
  return cached.sql;
}

/**
 * Server-side diagnostics for the registration store.
 *
 * Ids, counts and reasons — never a connection string, never a full set of
 * personal details (CLAUDE.md 9.3, 18). Deliberately separate from
 * `logPaymentEvent` so this module never has to import the payments layer,
 * which imports this one.
 */
export function logDbEvent(event: string, fields: Record<string, unknown> = {}): void {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    safe[key] = typeof value === "string" && value.length > 200 ? value.slice(0, 200) + "…" : value;
  }
  console.info("[admin-db] " + event, safe);
}

/**
 * TIMESTAMPTZ as an unambiguous ISO 8601 string.
 *
 * Postgres drivers differ on whether a timestamp arrives as a Date, a local
 * string or an epoch, and int8 famously arrives as a string. Formatting in SQL
 * removes the guesswork: what comes back is text, in UTC, in the one shape
 * `new Date(...)` parses identically everywhere.
 */
export function iso(column: string): string {
  return "to_char(" + column + " AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"')";
}

/* ------------------------------------------------------------ narrowing --- */

export const text = (value: unknown): string => (typeof value === "string" ? value : "");

export const textOrNull = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

/** count(*) and bigint columns can arrive as either a number or a string. */
export const int = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};
