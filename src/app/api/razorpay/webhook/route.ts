/**
 * POST /api/razorpay/webhook
 *
 * Razorpay's own account of what happened, independent of the browser.
 *
 * It exists because the browser is not a reliable narrator of the last step: a
 * phone loses signal in the second between paying and returning, an app kills
 * the tab, somebody closes the window on the bank's confirmation screen. In all
 * of those the money moved and `/api/razorpay/verify` was never called. This
 * endpoint closes that gap — it is the difference between a demo and a payment
 * flow you can leave running.
 *
 * Configure at Dashboard → Settings → Webhooks:
 *   URL     https://<your-domain>/api/razorpay/webhook
 *   Events  payment.captured, payment.failed, order.paid
 *   Secret  a value you choose → RAZORPAY_WEBHOOK_SECRET
 *
 * That secret is NOT the API key secret. While it is unset this endpoint
 * refuses every delivery: an unverified webhook is an unauthenticated stranger
 * asking us to mark a registration paid, and there is no safe way to guess.
 */

import type { NextRequest } from "next/server";

import {
  acquireConfirmLock,
  loadFromOrder,
  logPaymentEvent,
  markFailed,
  markPaid,
  mirror,
  REGISTRATION_AMOUNT_PAISE,
  REGISTRATION_CURRENCY,
} from "@/lib/payments/registrations";
import {
  isValidWebhookSignature,
  razorpayCredentials,
  razorpayWebhookSecret,
} from "@/lib/payments/razorpay";

/** The events this endpoint acts on. Anything else is acknowledged and ignored. */
const HANDLED = new Set(["payment.captured", "payment.failed", "order.paid"]);

type WebhookPayment = {
  id?: unknown;
  order_id?: unknown;
  amount?: unknown;
  currency?: unknown;
  status?: unknown;
  error_code?: unknown;
};

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 && value.length <= 64 ? value : null;

/** Dig `payload.payment.entity` out of a delivery without trusting any of it. */
function readPayment(body: unknown): WebhookPayment | null {
  if (typeof body !== "object" || body === null) return null;
  const payload = (body as { payload?: unknown }).payload;
  if (typeof payload !== "object" || payload === null) return null;
  const payment = (payload as { payment?: unknown }).payment;
  if (typeof payment !== "object" || payment === null) return null;
  const entity = (payment as { entity?: unknown }).entity;
  return typeof entity === "object" && entity !== null ? (entity as WebhookPayment) : null;
}

/** `order.paid` carries the order rather than the payment. */
function readOrderId(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const payload = (body as { payload?: unknown }).payload;
  if (typeof payload !== "object" || payload === null) return null;
  const order = (payload as { order?: unknown }).order;
  if (typeof order !== "object" || order === null) return null;
  const entity = (order as { entity?: unknown }).entity;
  if (typeof entity !== "object" || entity === null) return null;
  return asString((entity as { id?: unknown }).id);
}

export async function POST(request: NextRequest) {
  const secret = razorpayWebhookSecret();
  if (!secret) {
    logPaymentEvent("webhook_secret_missing");
    return Response.json(
      { error: "webhook_not_configured", message: "Webhook is not configured." },
      { status: 503 },
    );
  }

  /* The raw body, read exactly once and never re-serialised: the signature is
     an HMAC over these bytes, and `JSON.parse` → `JSON.stringify` would reorder
     keys and drop whitespace, so the digest could never match. */
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !isValidWebhookSignature(secret, raw, signature)) {
    logPaymentEvent("webhook_signature_invalid");
    // 400, not 401: nothing here is retryable by re-sending the same body.
    return Response.json({ error: "invalid_signature" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const event = asString((body as { event?: unknown }).event);
  if (!event || !HANDLED.has(event)) {
    // 200 on purpose: a non-2xx makes Razorpay retry an event we do not want.
    return Response.json({ received: true, handled: false }, { status: 200 });
  }

  const credentials = razorpayCredentials();
  if (!credentials) {
    logPaymentEvent("credentials_missing", { at: "webhook" });
    // 503 so Razorpay retries once the deployment is configured.
    return Response.json({ error: "unavailable" }, { status: 503 });
  }

  const payment = readPayment(body);
  const paymentId = payment ? asString(payment.id) : null;
  const orderId = (payment ? asString(payment.order_id) : null) ?? readOrderId(body);

  if (!orderId) {
    logPaymentEvent("webhook_no_order", { event });
    return Response.json({ received: true, handled: false }, { status: 200 });
  }

  try {
    const { order, registration } = await loadFromOrder(credentials, orderId);

    /* An order that is not ours, or not for ₹699, is acknowledged and dropped.
       The same server-side constant guards this path as guards verification —
       a webhook is not a way around the price. */
    if (order.amount !== REGISTRATION_AMOUNT_PAISE || order.currency !== REGISTRATION_CURRENCY) {
      logPaymentEvent("webhook_amount_mismatch", { orderId, amount: order.amount });
      return Response.json({ received: true, handled: false }, { status: 200 });
    }

    if (event === "payment.failed") {
      /* `markFailed` refuses to downgrade a PAID record — a failed first
         attempt can be delivered after a successful second one. */
      await markFailed(credentials, orderId, paymentId);
      logPaymentEvent("webhook_payment_failed", { orderId, paymentId });
      return Response.json({ received: true, handled: true }, { status: 200 });
    }

    // payment.captured / order.paid
    if (registration.status === "PAID" && registration.razorpayPaymentId) {
      logPaymentEvent("webhook_already_paid", { orderId, registrationId: registration.id });
      return Response.json({ received: true, handled: true, changed: false }, { status: 200 });
    }

    /* Razorpay's word that the order is paid is not quite enough on its own for
       `payment.captured`: confirm the amount on the payment too, so a capture
       for some other sum can never land here as a full registration. */
    if (
      payment &&
      typeof payment.amount === "number" &&
      payment.amount !== REGISTRATION_AMOUNT_PAISE
    ) {
      logPaymentEvent("webhook_payment_amount_mismatch", { orderId, paymentId });
      return Response.json({ received: true, handled: false }, { status: 200 });
    }

    // Loses the race to a concurrent verify request; that one is doing the work.
    if (!(await acquireConfirmLock(orderId))) {
      return Response.json({ received: true, handled: true, changed: false }, { status: 200 });
    }

    const confirmedPaymentId = paymentId ?? registration.razorpayPaymentId;
    if (!confirmedPaymentId) {
      logPaymentEvent("webhook_no_payment_id", { orderId, event });
      return Response.json({ received: true, handled: false }, { status: 200 });
    }

    await markPaid(credentials, orderId, confirmedPaymentId);
    await mirror({
      ...registration,
      status: "PAID",
      razorpayPaymentId: confirmedPaymentId,
      paidAt: Date.now(),
    });

    logPaymentEvent("webhook_registration_paid", {
      registrationId: registration.id,
      orderId,
      paymentId: confirmedPaymentId,
      event,
    });

    return Response.json({ received: true, handled: true, changed: true }, { status: 200 });
  } catch (cause) {
    logPaymentEvent("webhook_failed", { orderId, event, reason: (cause as Error).message });
    // 500 asks Razorpay to retry — its redelivery schedule is the recovery path.
    return Response.json({ error: "processing_failed" }, { status: 500 });
  }
}
