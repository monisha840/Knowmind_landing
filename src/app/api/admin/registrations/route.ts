/**
 * GET /api/admin/registrations
 *
 * One page of leads, with the counts the dashboard's tiles show.
 *
 * Authenticated independently of every other route and of the page itself: an
 * endpoint that serves names, email addresses and phone numbers must not depend
 * on something in front of it having run (CLAUDE.md §18, and the owner's
 * condition 12).
 */

import type { NextRequest } from "next/server";

import { isAuthenticatedRequest, unauthorized } from "@/lib/admin/auth";
import type { LeadQuery } from "@/lib/admin/types";
import { listLeads } from "@/lib/db/registrations";
import { razorpayWebhookSecret } from "@/lib/payments/razorpay";

/** Cookie-dependent, so it must never be prerendered or cached. */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) return unauthorized();

  const params = request.nextUrl.searchParams;
  const query: Partial<LeadQuery> = {
    search: params.get("q") ?? "",
    // Every value is re-validated by `normaliseQuery`; these casts only get it
    // past the type system, they are not trust.
    status: (params.get("status") ?? "ALL") as LeadQuery["status"],
    mode: (params.get("mode") ?? "all") as LeadQuery["mode"],
    sort: (params.get("sort") ?? "newest") as LeadQuery["sort"],
    page: Number(params.get("page") ?? 1),
    pageSize: Number(params.get("pageSize") ?? 25),
  };

  try {
    const page = await listLeads(query);
    /* A deployment fact rather than a stored one, so it is answered here rather
       than by the query layer. */
    const body = { ...page, webhookConfigured: razorpayWebhookSecret() !== null };
    return Response.json(body, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    /* The provider's wording can name internal state; it goes to the log and a
       plain sentence goes to the dashboard (CLAUDE.md §9.3). */
    console.info("[admin-db] list_route_failed", { reason: (cause as Error).message });
    return Response.json(
      {
        error: "database_unavailable",
        message: "Could not read the registrations just now. Please try again.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
