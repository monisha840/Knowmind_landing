/**
 * Admin authentication: password verification and the session cookie.
 *
 * ---------------------------------------------------------------------------
 * The rules this file exists to enforce
 * ---------------------------------------------------------------------------
 *   · The password is never in source, never in a comment, never in a log,
 *     never in a response, and never in the client bundle. Only a scrypt hash
 *     of it reaches this process, from `ADMIN_PASSWORD_HASH`, and nothing here
 *     returns or logs even that.
 *   · The client is never the security boundary. The browser gets an opaque
 *     signed cookie and nothing else; every decision is made on the server, by
 *     `requireAdmin`, in each route independently.
 *   · No session store. The cookie carries its own expiry and an HMAC over it,
 *     so a tampered or expired cookie fails verification without a lookup —
 *     which is what makes this work on serverless with no shared state.
 *
 * No new dependency: `node:crypto` has scrypt, HMAC and a constant-time
 * comparison, so `bcrypt`, `jose` and `iron-session` all earn nothing here
 * (CLAUDE.md §2.2).
 */

import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

if (typeof window !== "undefined") {
  throw new Error("lib/admin/auth is server-only and must never be imported by a client component.");
}

export const SESSION_COOKIE = "km_admin";

/** Eight hours: a working day, then log in again. */
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

/* ------------------------------------------------------------- scrypt ----- */

/**
 * scrypt parameters.
 *
 * N=16384, r=8, p=1 is the interactive-login profile: ~16 MB of memory and
 * roughly 50–100 ms per attempt on the platforms this runs on. Slow enough that
 * offline guessing is expensive, fast enough that a person logging in does not
 * notice. The values are stored *in* the hash string, so raising them later
 * does not invalidate an existing hash.
 */
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 32;
const SCRYPT_SALT_BYTES = 16;

/** `scrypt` is callback-based; this is the whole reason for the wrapper. */
function scrypt(password: string, salt: Buffer, N: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password.normalize("NFKC"),
      salt,
      SCRYPT_KEYLEN,
      // 128 * N * r bytes are needed; the default 32 MB ceiling is too tight
      // the moment anyone raises N, so the budget is stated rather than assumed.
      { N, r, p, maxmem: 256 * N * r },
      (error, derived) => (error ? reject(error) : resolve(derived)),
    );
  });
}

/**
 * `scrypt$<N>$<r>$<p>$<salt base64>$<hash base64>`.
 *
 * Self-describing, so verification never has to guess which parameters produced
 * a stored hash. Written by `npm run admin:password`; read here and nowhere
 * else.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SCRYPT_SALT_BYTES);
  const derived = await scrypt(password, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P);
  return [
    "scrypt",
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString("base64"),
    derived.toString("base64"),
  ].join("$");
}

/**
 * Constant-time comparison of a candidate password against a stored hash.
 *
 * Every failure path returns false rather than throwing, so a malformed
 * `ADMIN_PASSWORD_HASH` locks the door instead of opening it.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  // A hostile hash string could otherwise ask for terabytes of memory.
  if (N < 1024 || N > 1_048_576 || r < 1 || r > 32 || p < 1 || p > 16) return false;

  try {
    const salt = Buffer.from(parts[4], "base64");
    const expected = Buffer.from(parts[5], "base64");
    if (salt.length === 0 || expected.length === 0) return false;

    const derived = await scrypt(password, salt, N, r, p);
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/* ------------------------------------------------------- configuration ---- */

function adminPasswordHash(): string | null {
  return process.env.ADMIN_PASSWORD_HASH?.trim() || null;
}

function sessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  // A short secret is a weak HMAC key. Refusing it is safer than accepting it.
  return secret && secret.length >= 32 ? secret : null;
}

/**
 * Whether logging in is possible at all.
 *
 * False means the deployment is missing `ADMIN_PASSWORD_HASH` or
 * `ADMIN_SESSION_SECRET`. The login page says so plainly — an honest closed
 * door, the same pattern `/api/register` uses for absent Razorpay credentials
 * (CLAUDE.md §0.4). It never says *which* one is missing to an unauthenticated
 * visitor; that detail goes to the server log.
 */
export function isAdminConfigured(): boolean {
  return adminPasswordHash() !== null && sessionSecret() !== null;
}

/** Check a submitted password. False whenever the admin is not configured. */
export async function checkPassword(password: string): Promise<boolean> {
  const stored = adminPasswordHash();
  if (!stored || !sessionSecret()) {
    console.info("[admin-auth] login_attempt_while_unconfigured", {
      hasHash: stored !== null,
      hasSecret: sessionSecret() !== null,
    });
    return false;
  }
  return verifyPassword(password, stored);
}

/* -------------------------------------------------------------- session --- */

/**
 * `v1.<expiry ms>.<nonce>.<hmac>`
 *
 * The HMAC covers the expiry and the nonce, keyed by `ADMIN_SESSION_SECRET`, so
 * a browser cannot extend its own session or mint one. The nonce makes two
 * cookies issued in the same millisecond distinct, and rotating the secret
 * invalidates every cookie in existence — which is the revocation story for a
 * design that deliberately has no session table.
 */
function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createSessionToken(): string | null {
  const secret = sessionSecret();
  if (!secret) return null;

  const expiry = Date.now() + SESSION_TTL_MS;
  const nonce = randomBytes(12).toString("hex");
  const payload = `${expiry}.${nonce}`;
  return `v1.${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token: string | null | undefined): boolean {
  const secret = sessionSecret();
  if (!secret || !token) return false;

  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return false;

  const [, expiryRaw, nonce, signature] = parts;
  const expiry = Number(expiryRaw);
  if (!Number.isFinite(expiry) || expiry <= Date.now()) return false;

  const expected = sign(`${expiryRaw}.${nonce}`, secret);
  if (expected.length !== signature.length) return false;

  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    // Non-hex input: a malformed or forged cookie.
    return false;
  }
}

/**
 * Cookie attributes, in one place so the login and logout routes cannot drift.
 *
 * HttpOnly     — script can neither read it nor write it, so an injected script
 *                cannot exfiltrate the session.
 * Secure       — production only, because localhost is not HTTPS and a Secure
 *                cookie would simply never be set there.
 * SameSite=Lax — the dashboard is reached by typing or bookmarking a URL, which
 *                Lax allows and Strict would break on the first navigation. No
 *                cross-site form can trigger a state change with it.
 * Path=/       — the API routes live under /api/admin, not under /admin, so a
 *                narrower path would leave every API call unauthenticated.
 */
export function sessionCookie(value: string, maxAgeSeconds: number) {
  return {
    name: SESSION_COOKIE,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/* ---------------------------------------------------------- enforcement --- */

/**
 * The gate, for a Route Handler.
 *
 * Called as the first statement of every `/api/admin/*` handler. Deliberately
 * per-route rather than in middleware: middleware is a convenience layer that
 * has been bypassable before (CVE-2025-29927), and an endpoint that serves
 * personal data must not depend on something in front of it having run.
 */
export function isAuthenticatedRequest(request: NextRequest): boolean {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

/** The same gate, for a Server Component. `cookies()` is async in Next 16. */
export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/**
 * The single 401 shape.
 *
 * No detail: not whether the cookie was missing, expired, forged, or whether
 * the admin is configured at all. An unauthenticated caller learns only that it
 * is not authenticated.
 */
export function unauthorized(): Response {
  return Response.json(
    { error: "unauthorized", message: "Please sign in." },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}
