/**
 * GET /api/admin/export
 *
 * The current view, as a CSV. Same filters as the table, so what downloads is
 * what is on screen.
 *
 * Authenticated in its own right — this is the single request in the whole
 * application that hands over every lead's personal details at once, so it is
 * also the one that gets logged as an event (who exported, when, how many
 * rows). No personal data goes into that log line.
 */

import type { NextRequest } from "next/server";

import { isAuthenticatedRequest, unauthorized } from "@/lib/admin/auth";
import type { Lead, LeadQuery } from "@/lib/admin/types";
import { leadsForExport } from "@/lib/db/registrations";

export const dynamic = "force-dynamic";

/**
 * A CSV field, quoted and escaped.
 *
 * The leading apostrophe is not decoration. A field beginning `=`, `+`, `-` or
 * `@` is executed as a formula when the file is opened in Excel or Sheets, so a
 * name typed as `=HYPERLINK(...)` becomes a live formula in the owner's
 * spreadsheet. Prefixing neutralises it while leaving the value readable.
 */
function field(value: string | number | null): string {
  const raw = value === null ? "" : String(value);
  const guarded = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${guarded.replace(/"/g, '""')}"`;
}

const HEADERS = [
  "Registration ID",
  "Name",
  "Email",
  "WhatsApp",
  "Status",
  "Amount (INR)",
  "Currency",
  "Razorpay Order ID",
  "Razorpay Payment ID",
  "Registered At (UTC)",
  "Paid At (UTC)",
  "Mode",
];

function row(lead: Lead): string {
  return [
    field(lead.id),
    field(lead.name),
    field(lead.email),
    // The stored shape is ten local digits; the +91 makes it dialable straight
    // out of the spreadsheet.
    field(lead.mobile ? `+91${lead.mobile}` : ""),
    field(lead.status),
    field((lead.amountPaise / 100).toFixed(2)),
    field(lead.currency),
    field(lead.razorpayOrderId),
    field(lead.razorpayPaymentId),
    field(lead.createdAt),
    field(lead.paidAt),
    // Condition 8: a test registration must never be mistaken for a real one,
    // including once the data has left the dashboard.
    field(lead.keyMode.toUpperCase()),
  ].join(",");
}

export async function GET(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) return unauthorized();

  const params = request.nextUrl.searchParams;
  const query: Partial<LeadQuery> = {
    search: params.get("q") ?? "",
    status: (params.get("status") ?? "ALL") as LeadQuery["status"],
    mode: (params.get("mode") ?? "all") as LeadQuery["mode"],
    sort: (params.get("sort") ?? "newest") as LeadQuery["sort"],
  };

  try {
    const leads = await leadsForExport(query);

    console.info("[admin-db] export", {
      rows: leads.length,
      mode: query.mode,
      status: query.status,
      searched: Boolean(query.search),
    });

    /* CRLF line endings and a UTF-8 BOM, both for Excel: without the BOM it
       reads the file as the system codepage and mangles any non-ASCII name. */
    const csv = `\uFEFF${[HEADERS.join(","), ...leads.map(row)].join("\r\n")}\r\n`;
    const stamp = new Date().toISOString().slice(0, 10);
    const mode = query.mode && query.mode !== "all" ? `-${query.mode}` : "";

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="registrations${mode}-${stamp}.csv"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (cause) {
    console.info("[admin-db] export_failed", { reason: (cause as Error).message });
    return Response.json(
      { error: "database_unavailable", message: "Could not build the export." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
