/**
 * GET /api/admin/registrations/[id]
 *
 * One lead in full, for the detail panel. Authenticated in its own right.
 *
 * In Next 16 a dynamic segment's `params` is a Promise — awaiting it is not
 * optional (`node_modules/next/dist/docs/.../route-handlers`).
 */

import type { NextRequest } from "next/server";

import { isAuthenticatedRequest, unauthorized } from "@/lib/admin/auth";
import { getLead } from "@/lib/db/registrations";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isAuthenticatedRequest(request)) return unauthorized();

  const { id } = await context.params;
  if (!id || id.length > 64) {
    return Response.json({ error: "bad_request" }, { status: 400, headers: noStore });
  }

  try {
    const lead = await getLead(id);
    if (!lead) {
      return Response.json(
        { error: "not_found", message: "That registration is not in the database." },
        { status: 404, headers: noStore },
      );
    }
    return Response.json(lead, { status: 200, headers: noStore });
  } catch (cause) {
    console.info("[admin-db] detail_route_failed", { reason: (cause as Error).message });
    return Response.json(
      { error: "database_unavailable", message: "Could not read that registration." },
      { status: 503, headers: noStore },
    );
  }
}
