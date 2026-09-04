/**
 * POST /api/admin/reconcile
 *
 * Rebuild registration rows from the Razorpay orders that are their durable
 * home. This is the migration for everything that registered before the
 * database existed, and the repair for anything the fail-open write policy let
 * through afterwards.
 *
 * It is a *tool*, not the dashboard's data path. The dashboard reads Postgres.
 * This runs when a human asks it to, from behind the same session gate as
 * everything else under `/api/admin`.
 *
 * ---------------------------------------------------------------------------
 * Three properties it has to have
 * ---------------------------------------------------------------------------
 * 1. **Idempotent.** Every write goes through `upsertLead`, keyed by the
 *    registration id, and that upsert refuses to move a PAID row or restamp
 *    when it was paid. Running this twice, or ten times, converges.
 *
 * 2. **Faithful to the original amount.** `order.amount` is written as it
 *    stands. Orders created before the price changed are ₹999 and stay ₹999 —
 *    substituting today's constant would be inventing a fact about a past
 *    transaction (CLAUDE.md §1.1).
 *
 * 3. **Razorpay's word on payment beats ours.** Status is taken from
 *    `order.status`, not from the `payment_status` note. The note is what we
 *    last managed to write; the order is what actually happened. They disagree
 *    on at least one historical order, and the order is right.
 */

import type { NextRequest } from "next/server";

import { isAuthenticatedRequest, unauthorized } from "@/lib/admin/auth";
import type { LeadStatus } from "@/lib/admin/types";
import { currentKeyMode, upsertLead } from "@/lib/db/registrations";
import { isDatabaseConfigured } from "@/lib/db/client";
import {
  type RazorpayCredentials,
  type RazorpayOrder,
  fetchOrderPayments,
  listOrders,
  razorpayCredentials,
} from "@/lib/payments/razorpay";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/** Razorpay's page size ceiling. */
const PAGE = 100;
/** A ceiling on one invocation, so this cannot run past the platform's timeout. */
const MAX_PAGES = 10;
const DEADLINE_MS = 20_000;

const note = (order: RazorpayOrder, key: string): string =>
  typeof order.notes?.[key] === "string" ? order.notes[key] : "";

const noteNumber = (order: RazorpayOrder, key: string): number | null => {
  const value = Number(note(order, key));
  return Number.isFinite(value) && value > 0 ? value : null;
};

/**
 * When an order was paid, and by which payment.
 *
 * Only consulted for a paid order whose notes are missing one or the other —
 * an order paid before `markPaid` wrote those keys, or one whose notes write
 * failed after the money moved. One extra API call, for a handful of rows, in
 * exchange for a real timestamp instead of a blank.
 */
async function capturedPayment(
  credentials: RazorpayCredentials,
  orderId: string,
): Promise<{ id: string; paidAtMs: number } | null> {
  try {
    const payments = await fetchOrderPayments(credentials, orderId);
    const captured = payments.items.find((payment) => payment.status === "captured");
    return captured ? { id: captured.id, paidAtMs: captured.created_at * 1000 } : null;
  } catch {
    // A missing timestamp is a gap in the display, not a reason to abandon the
    // whole reconciliation.
    return null;
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) return unauthorized();

  if (!isDatabaseConfigured()) {
    return Response.json(
      {
        error: "database_unavailable",
        message: "No database is configured, so there is nowhere to reconcile into.",
      },
      { status: 503, headers: noStore },
    );
  }

  const credentials = razorpayCredentials();
  if (!credentials) {
    return Response.json(
      {
        error: "payments_unavailable",
        message: "Razorpay credentials are not configured on this deployment.",
      },
      { status: 503, headers: noStore },
    );
  }

  /* Orders come from the key pair this deployment is configured with, so the
     mode of every row this pass writes is that pair's mode. There is no way for
     a test order to arrive through live credentials or the reverse. */
  const keyMode = currentKeyMode();

  const startedAt = Date.now();
  let scanned = 0;
  let written = 0;
  let skipped = 0;
  let paid = 0;
  let hasMore = false;

  try {
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const batch = await listOrders(credentials, { count: PAGE, skip: page * PAGE });
      const orders = batch.items ?? [];
      if (orders.length === 0) break;

      for (const order of orders) {
        scanned += 1;

        const id = note(order, "registration_id") || order.receipt || "";
        const name = note(order, "name");
        const email = note(order, "email");

        /* An order from this Razorpay account that this application did not
           create. Importing it would invent a registration. */
        if (!id || (!name && !email)) {
          skipped += 1;
          continue;
        }

        const storedStatus = note(order, "payment_status");
        let status: LeadStatus =
          order.status === "paid"
            ? "PAID"
            : storedStatus === "FAILED"
              ? "PAYMENT_FAILED"
              : "PENDING";

        let paymentId = note(order, "razorpay_payment_id") || null;
        let paidAtMs = noteNumber(order, "paid_at");

        if (status === "PAID" && (!paymentId || !paidAtMs)) {
          const captured = await capturedPayment(credentials, order.id);
          paymentId = paymentId ?? captured?.id ?? null;
          paidAtMs = paidAtMs ?? captured?.paidAtMs ?? null;
        }

        /* PAID without the payment id that proves it is unrepresentable, by
           constraint. Recording it as PENDING would be worse than saying so, so
           the row is skipped and the count reports it. */
        if (status === "PAID" && !paymentId) {
          skipped += 1;
          continue;
        }

        const ok = await upsertLead({
          id,
          name,
          email,
          mobile: note(order, "mobile"),
          gender: note(order, "gender") || null,
          age: note(order, "age") || null,
          occupation: note(order, "occupation") || null,
          status,
          // The original amount, whatever today's price happens to be.
          amountPaise: order.amount,
          currency: order.currency || "INR",
          razorpayOrderId: order.id,
          razorpayPaymentId: paymentId,
          keyMode,
          createdAtMs: noteNumber(order, "created_at") ?? order.created_at * 1000,
          paidAtMs,
        });

        if (ok) {
          written += 1;
          if (status === "PAID") paid += 1;
        } else {
          skipped += 1;
        }
      }

      if (orders.length < PAGE) break;

      if (Date.now() - startedAt > DEADLINE_MS) {
        // Safe to stop: the pass is idempotent, so running it again picks up
        // where this one left off without duplicating anything.
        hasMore = true;
        break;
      }
    }

    console.info("[admin-db] reconciled", { scanned, written, skipped, paid, keyMode, hasMore });

    return Response.json(
      { scanned, written, skipped, paid, keyMode, hasMore },
      { status: 200, headers: noStore },
    );
  } catch (cause) {
    console.info("[admin-db] reconcile_failed", {
      scanned,
      written,
      reason: (cause as Error).message,
    });
    return Response.json(
      {
        error: "reconcile_failed",
        message: `Reconciliation stopped after ${written} of ${scanned} orders. It is safe to run again.`,
      },
      { status: 502, headers: noStore },
    );
  }
}
