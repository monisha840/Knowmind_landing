/**
 * GET /api/whatsapp/retry
 *
 * The retry sweep for WhatsApp confirmations that failed (or were never
 * attempted because Evolution Go, or the database, was briefly unreachable).
 *
 * ---------------------------------------------------------------------------
 * Why a cron route, and not a queue
 * ---------------------------------------------------------------------------
 * This deployment has no background worker: a Vercel serverless function runs
 * only for the lifetime of one request (extended slightly by `after()`, never
 * indefinitely), and this project already carries the same constraint for the
 * Razorpay webhook's own retry story — it relies on *Razorpay's* redelivery,
 * not on anything running here. Inventing an in-process queue would be a fake
 * implementation of one (CLAUDE.md §0.4): it would not survive a redeploy, a
 * cold start, or two serverless instances existing at once.
 *
 * Vercel Cron is the real, already-supported primitive for exactly this: a
 * scheduled HTTP GET against a route in this same deployment, configured in
 * `vercel.json`. Nothing new to run, nothing new to depend on.
 *
 * **Plan-dependent limitation, stated rather than hidden:** this deployment's
 * `VERCEL_OIDC_TOKEN` identifies it as a Hobby-plan project, and Hobby crons
 * run at most once a day — Vercel silently coerces anything more frequent.
 * `vercel.json` therefore requests `30 3 * * *` (03:30 UTC / 09:00 IST, once
 * daily), not hourly. A failed send can sit for up to a day before this sweep
 * retries it; Pro allows sub-daily schedules if that gap ever matters more
 * than the plan's cost. Nothing here depends on the schedule being exact:
 * every attempt still goes through the same atomic claim as the payment
 * routes, so a sweep that runs late, or twice, still cannot send a row's
 * confirmation more than once.
 *
 * ---------------------------------------------------------------------------
 * Auth
 * ---------------------------------------------------------------------------
 * Vercel signs its own cron requests with `Authorization: Bearer
 * $CRON_SECRET` when that variable is set — this route checks it and nothing
 * else. It deliberately does not accept the admin session cookie: a cron
 * invocation carries no browser cookie at all.
 */

import type { NextRequest } from "next/server";

import { listWhatsappRetryCandidates } from "@/lib/db/registrations";
import { retryWhatsappConfirmation } from "@/lib/whatsapp/notify";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/** One sweep's ceiling, so this cannot run past the platform's timeout. */
const BATCH_SIZE = 25;
const DEADLINE_MS = 20_000;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  // No secret configured means this route is not wired up for cron yet — an
  // honest closed door, the same pattern every other missing-integration
  // boundary in this codebase follows, rather than an endpoint anyone could
  // call to trigger sends.
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  }

  const startedAt = Date.now();
  const candidates = await listWhatsappRetryCandidates(BATCH_SIZE);

  let attempted = 0;
  for (const lead of candidates) {
    if (Date.now() - startedAt > DEADLINE_MS) break;
    attempted += 1;
    // Sequential, not parallel: this is a low-volume retry sweep, not a
    // broadcast, and there is no reason to open dozens of concurrent
    // connections to Evolution Go for a batch this small.
    await retryWhatsappConfirmation(lead);
  }

  console.info("[whatsapp] retry_swept", { candidates: candidates.length, attempted });

  return Response.json(
    { candidates: candidates.length, attempted },
    { status: 200, headers: noStore },
  );
}
