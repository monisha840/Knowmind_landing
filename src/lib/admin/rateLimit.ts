/**
 * Login rate limiting.
 *
 * Counted in Postgres rather than in memory, because a per-instance counter on
 * a serverless platform limits nothing: every cold start begins at zero, and a
 * caller who spreads attempts across instances gets a fresh allowance each
 * time. The `admin_login_attempts` table is shared by every instance, which is
 * what makes the limit real.
 *
 * The in-memory fallback below is not a substitute — it exists so that a
 * deployment without `DATABASE_URL` still has *some* brake rather than none.
 * It is per-instance and honest about it.
 */

import { db, logDbEvent } from "@/lib/db/client";
import type { NextRequest } from "next/server";

if (typeof window !== "undefined") {
  throw new Error(
    "lib/admin/rateLimit is server-only and must never be imported by a client component.",
  );
}

/** Five wrong passwords in fifteen minutes is a person; more is a script. */
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

/** Attempts older than this are noise; pruned opportunistically on write. */
const RETENTION_MS = 24 * 60 * 60 * 1000;

export type RateLimitVerdict = { limited: boolean; retryAfterSeconds: number };

const allowed: RateLimitVerdict = { limited: false, retryAfterSeconds: 0 };

/**
 * The caller's address.
 *
 * Vercel sets `x-forwarded-for`; the left-most entry is the client and the rest
 * are proxies. Falls back to a constant so an unidentifiable caller is still
 * counted — against everyone else, which is deliberately strict: an environment
 * where the header is missing is one where we cannot tell attackers apart.
 */
export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return (first || request.headers.get("x-real-ip")?.trim() || "unknown").slice(0, 64);
}

/* ------------------------------------------------------ in-memory fallback -- */

const memory = new Map<string, number[]>();

function memoryVerdict(ip: string): RateLimitVerdict {
  const now = Date.now();
  const recent = (memory.get(ip) ?? []).filter((at) => now - at < WINDOW_MS);
  if (recent.length === 0) {
    memory.delete(ip);
    return allowed;
  }
  memory.set(ip, recent);
  if (recent.length < MAX_FAILURES) return allowed;
  return {
    limited: true,
    retryAfterSeconds: Math.ceil((WINDOW_MS - (now - recent[0])) / 1000),
  };
}

function memoryRecord(ip: string, succeeded: boolean): void {
  if (succeeded) {
    memory.delete(ip);
    return;
  }
  const now = Date.now();
  const recent = (memory.get(ip) ?? []).filter((at) => now - at < WINDOW_MS);
  recent.push(now);
  memory.set(ip, recent);

  /* Unbounded growth would be a memory leak on a long-lived instance. */
  if (memory.size > 5000) {
    for (const [key, times] of memory) {
      if (times.every((at) => now - at >= WINDOW_MS)) memory.delete(key);
    }
  }
}

/* ------------------------------------------------------------------ public -- */

/**
 * Is this address locked out?
 *
 * A database failure returns "not limited" rather than "limited": the password
 * check still has to pass, so the cost of failing open here is a slower brute
 * force, whereas failing closed would lock the owner out of their own dashboard
 * whenever Neon hiccups.
 */
export async function checkRateLimit(ip: string): Promise<RateLimitVerdict> {
  const sql = db();
  if (!sql) return memoryVerdict(ip);

  try {
    const rows = (await sql.query(
      `SELECT COUNT(*)::int AS failures,
              EXTRACT(EPOCH FROM (MIN(attempted_at) + $2::interval - now()))::int AS retry_after
         FROM admin_login_attempts
        WHERE ip = $1
          AND succeeded = false
          AND attempted_at > now() - $2::interval`,
      [ip, `${Math.round(WINDOW_MS / 1000)} seconds`],
    )) as Record<string, unknown>[];

    const failures = Number(rows[0]?.failures ?? 0);
    if (failures < MAX_FAILURES) return allowed;

    const retryAfter = Number(rows[0]?.retry_after ?? 0);
    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.min(Math.round(WINDOW_MS / 1000), retryAfter)),
    };
  } catch (cause) {
    logDbEvent("rate_limit_read_failed", { reason: (cause as Error).message });
    return memoryVerdict(ip);
  }
}

/**
 * Record the outcome of an attempt.
 *
 * A success clears the address's failures, so somebody who mistypes four times
 * and then gets it right is not still one mistake from a lockout.
 */
export async function recordAttempt(ip: string, succeeded: boolean): Promise<void> {
  memoryRecord(ip, succeeded);

  const sql = db();
  if (!sql) return;

  try {
    if (succeeded) {
      await sql.query("DELETE FROM admin_login_attempts WHERE ip = $1", [ip]);
      return;
    }

    await sql.query("INSERT INTO admin_login_attempts (ip, succeeded) VALUES ($1, false)", [ip]);

    /* Opportunistic pruning, roughly one write in twenty. Cheaper than a cron
       job for a table that gains a handful of rows a week. */
    if (Math.random() < 0.05) {
      await sql.query(
        `DELETE FROM admin_login_attempts WHERE attempted_at < now() - $1::interval`,
        [`${Math.round(RETENTION_MS / 1000)} seconds`],
      );
    }
  } catch (cause) {
    logDbEvent("rate_limit_write_failed", { reason: (cause as Error).message });
  }
}

/**
 * A fixed floor on how long a login attempt takes.
 *
 * scrypt already dominates the timing, but "wrong password" and "rate limited"
 * and "admin not configured" should not be distinguishable by a stopwatch
 * either. Applied to every response from the login route, successful or not.
 */
export async function loginFloor(startedAt: number): Promise<void> {
  const elapsed = Date.now() - startedAt;
  const floor = 250;
  if (elapsed < floor) await new Promise((resolve) => setTimeout(resolve, floor - elapsed));
}
