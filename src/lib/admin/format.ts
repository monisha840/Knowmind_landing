/**
 * Display helpers for the admin dashboard.
 *
 * Client-safe: no `node:` imports, no `process.env`, no database. Shared by the
 * table, the cards and the detail panel so a status can never be styled one way
 * in one place and another way somewhere else.
 */

import { ABANDONED_AFTER_MS, type Lead, type LeadStatus, type WhatsappStatus } from "@/lib/admin/types";
import { inr } from "@/lib/config";

/** Paise as the page writes money, through the one formatting helper. */
export function formatAmount(paise: number): string {
  return inr(paise / 100);
}

/**
 * A timestamp in the timezone the programme actually runs in.
 *
 * The rows are stored and transported in UTC; nobody administering a 5:30 AM
 * IST cohort wants to read UTC. Rendered only in client components, after data
 * arrives, so there is no server/client formatting mismatch to hydrate around
 * (CLAUDE.md §20.4).
 */
export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** The same instant, short, for a narrow table column. */
export function formatDateShort(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** Ten stored digits, shown the way somebody would dial them. */
export function formatMobile(mobile: string): string {
  if (!mobile) return "—";
  return mobile.length === 10 ? `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}` : mobile;
}

/**
 * Is this a PENDING row old enough to read as abandoned?
 *
 * A display question and nothing more. The stored status stays PENDING: the
 * browser closing is not something the server witnessed, and inventing a
 * CANCELLED state from it would be recording a guess as a fact (owner's
 * condition 3).
 */
export function isAbandoned(lead: Lead): boolean {
  if (lead.status !== "PENDING") return false;
  const created = new Date(lead.createdAt).getTime();
  return Number.isFinite(created) && Date.now() - created > ABANDONED_AFTER_MS;
}

export type StatusStyle = { label: string; className: string };

const STATUS_STYLES: Record<LeadStatus, StatusStyle> = {
  PAID: {
    label: "Paid",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  PENDING: {
    label: "Pending",
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  PAYMENT_FAILED: {
    label: "Payment failed",
    className: "border-rose-200 bg-rose-50 text-rose-800",
  },
};

/**
 * How a row's status should read.
 *
 * "Abandoned" is a label on a PENDING row, never a fourth status — which is why
 * it comes out of the same function rather than out of the data.
 */
export function statusStyle(lead: Lead): StatusStyle {
  if (isAbandoned(lead)) {
    return { label: "Abandoned", className: "border-slate-300 bg-slate-100 text-slate-600" };
  }
  return STATUS_STYLES[lead.status];
}

/**
 * How the WhatsApp confirmation column reads.
 *
 * NOT_SENT is shown as "—" rather than a badge for any row that is not yet
 * PAID — a pending or failed *payment* has no WhatsApp story to tell, and a
 * grey "Not sent" badge next to every unpaid row would read as a second,
 * confusing status column.
 */
const WHATSAPP_STYLES: Record<WhatsappStatus, StatusStyle> = {
  SENT: { label: "Sent", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  PENDING: { label: "Sending…", className: "border-amber-200 bg-amber-50 text-amber-900" },
  FAILED: { label: "Failed", className: "border-rose-200 bg-rose-50 text-rose-800" },
  NOT_SENT: { label: "Not sent", className: "border-slate-300 bg-slate-100 text-slate-600" },
};

export function whatsappStatusStyle(lead: Lead): StatusStyle | null {
  if (lead.status !== "PAID" && lead.whatsappStatus === "NOT_SENT") return null;
  return WHATSAPP_STYLES[lead.whatsappStatus];
}
