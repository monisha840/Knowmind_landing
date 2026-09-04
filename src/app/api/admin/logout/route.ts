/**
 * POST /api/admin/logout
 *
 * Clears the session cookie. POST rather than GET so a prefetch, an image tag
 * or a link in an email cannot sign somebody out.
 *
 * Deliberately unauthenticated: a caller with no valid session asking to have
 * no session is not an error, and returning 401 here would leave a browser
 * holding an expired cookie it could not clear.
 */

import { NextResponse } from "next/server";

import { sessionCookie } from "@/lib/admin/auth";

export function POST() {
  const response = NextResponse.json(
    { ok: true },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
  /* Same name, path and attributes, empty value, zero age — the browser only
     replaces a cookie when all of those match, which is why this goes through
     the same helper that set it. */
  response.cookies.set(sessionCookie("", 0));
  return response;
}
