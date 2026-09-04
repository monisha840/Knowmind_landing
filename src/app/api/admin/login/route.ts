/**
 * POST /api/admin/login
 *
 * The only place a password is ever checked, and it is checked here on the
 * server. The browser sends a string and receives a cookie or a refusal; it is
 * never told whether the password was wrong, whether the address is locked out,
 * or whether an admin password is configured at all.
 *
 * Nothing about the password is logged. Not the value, not its length, not a
 * prefix — a login route is precisely where such a thing would end up in a log
 * aggregator (CLAUDE.md §18).
 */

import { NextResponse, type NextRequest } from "next/server";

import { checkPassword, createSessionToken, isAdminConfigured, sessionCookie, SESSION_TTL_MS } from "@/lib/admin/auth";
import { checkRateLimit, clientIp, loginFloor, recordAttempt } from "@/lib/admin/rateLimit";

/** One sentence for every failure, so nothing is distinguishable by its wording. */
const REFUSED = "That password was not accepted.";

/* NextResponse rather than Response: only the former carries the `cookies`
   helper this route needs to set the session. */
const json = (body: unknown, status: number, headers: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const ip = clientIp(request);

  const limit = await checkRateLimit(ip);
  if (limit.limited) {
    await loginFloor(startedAt);
    return json(
      {
        error: "rate_limited",
        message: `Too many attempts. Try again in about ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
      },
      429,
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  let password = "";
  try {
    const body: unknown = await request.json();
    const value =
      typeof body === "object" && body !== null && "password" in body
        ? (body as { password: unknown }).password
        : null;
    // Capped before it reaches scrypt: a megabyte of "password" is a denial of
    // service, not a login attempt.
    if (typeof value === "string") password = value.slice(0, 200);
  } catch {
    password = "";
  }

  if (!isAdminConfigured()) {
    /* Loud in the log, because in production this is a misconfiguration rather
       than a user error — and silent to the caller, who gets the same sentence
       as a wrong password. */
    console.info("[admin-auth] login_refused_unconfigured");
    await recordAttempt(ip, false);
    await loginFloor(startedAt);
    return json({ error: "invalid_credentials", message: REFUSED }, 401);
  }

  const ok = password.length > 0 && (await checkPassword(password));
  await recordAttempt(ip, ok);

  if (!ok) {
    console.info("[admin-auth] login_failed", { ip });
    await loginFloor(startedAt);
    return json({ error: "invalid_credentials", message: REFUSED }, 401);
  }

  const token = createSessionToken();
  if (!token) {
    console.info("[admin-auth] session_secret_missing");
    await loginFloor(startedAt);
    return json({ error: "invalid_credentials", message: REFUSED }, 401);
  }

  console.info("[admin-auth] login_succeeded", { ip });
  await loginFloor(startedAt);

  const response = json({ ok: true }, 200);
  response.cookies.set(sessionCookie(token, Math.floor(SESSION_TTL_MS / 1000)));
  return response;
}
