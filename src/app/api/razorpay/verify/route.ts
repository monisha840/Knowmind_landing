/**
 * POST /api/razorpay/verify
 *
 * The only door into PAID.
 *
 * Checkout hands the browser three values and the browser forwards them here.
 * None of them is believed. The signature proves they came from Razorpay; a
 * read-back from Razorpay's own API proves the payment is real, belongs to this
 * order, and is for ₹999 in INR. A frontend that simply POSTs
 * `{status:"PAID"}` gets a 400, which is the requirement the whole route exists
 * to satisfy.
 *
 * Safe to call twice. Safe to call after the webhook already confirmed. Safe to
 * call after a refresh. See `markPaid` for why.
 */

import type { NextRequest } from "next/server";

import type { ApiErrorResponse, VerifyResponse } from "@/lib/payments/types";
import {
  REGISTRATION_AMOUNT_PAISE,
  REGISTRATION_CURRENCY,
  acquireConfirmLock,
  loadFromOrder,
  logPaymentEvent,
  markPaid,
  mirror,
} from "@/lib/payments/registrations";
import {
  RazorpayApiError,
  capturePayment,
  fetchPayment,
  isValidCheckoutSignature,
  razorpayCredentials,
} from "@/lib/payments/razorpay";
import { siteConfig } from "@/lib/config";

const fail = (status: number, error: string, message: string) =>
  Response.json({ error, message } satisfies ApiErrorResponse, { status });

const CONTACT = `If money has left your account, send a message to ${siteConfig.contact.phone} and it will be sorted out.`;

/** Razorpay ids and signatures are short, opaque and predictable in shape. */
const looksLikeId = (value: unknown, prefix: string): value is string =>
  typeof value === "string" &&
  value.startsWith(prefix) &&
  value.length > prefix.length &&
  value.length <= 64;

const looksLikeSignature = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);

export async function POST(request: NextRequest) {
  /* ---- 1. Shape ---- */

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "bad_request", "We could not read that payment. Please contact us.");
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const orderId = payload.razorpay_order_id;
  const paymentId = payload.razorpay_payment_id;
  const signature = payload.razorpay_signature;

  if (
    !looksLikeId(orderId, "order_") ||
    !looksLikeId(paymentId, "pay_") ||
    !looksLikeSignature(signature)
  ) {
    logPaymentEvent("verify_malformed");
    return fail(400, "bad_request", `We could not confirm that payment. ${CONTACT}`);
  }

  const credentials = razorpayCredentials();
  if (!credentials) {
    logPaymentEvent("credentials_missing", { at: "verify" });
    return fail(503, "payments_unavailable", `We could not confirm that payment. ${CONTACT}`);
  }

  /* ---- 2. The signature ---- */

  if (!isValidCheckoutSignature(credentials.keySecret, orderId, paymentId, signature)) {
    /* Either tampering or a genuine mismatch. Either way this is the line that
       stops a browser talking itself into a registration. The signature itself
       is never logged. */
    logPaymentEvent("signature_invalid", { orderId, paymentId });
    return fail(400, "invalid_signature", `We could not confirm that payment. ${CONTACT}`);
  }

  try {
    /* ---- 3. Razorpay's own view of the order ---- */

    const { order, registration } = await loadFromOrder(credentials, orderId);

    /* Amount and currency are checked against the server's constant, not
       against anything the request carried. This is what makes a client-forged
       ₹1 order impossible to pass off as a registration. */
    if (order.amount !== REGISTRATION_AMOUNT_PAISE || order.currency !== REGISTRATION_CURRENCY) {
      logPaymentEvent("order_amount_mismatch", {
        orderId,
        amount: order.amount,
        currency: order.currency,
        expected: REGISTRATION_AMOUNT_PAISE,
      });
      return fail(409, "amount_mismatch", `We could not confirm that payment. ${CONTACT}`);
    }

    /* ---- 4. Already done? ---- */

    if (registration.status === "PAID" && registration.razorpayPaymentId) {
      /* A replayed verify, a webhook that got here first, or a double-click.
         The record is untouched and the same answer is returned — idempotency
         is the point, not an edge case. */
      logPaymentEvent("verify_replayed", { orderId, registrationId: registration.id });
      return Response.json(
        {
          registrationId: registration.id,
          status: "PAID",
          firstConfirmation: false,
        } satisfies VerifyResponse,
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    /* ---- 5. The payment itself ---- */

    let payment = await fetchPayment(credentials, paymentId);

    if (
      payment.order_id !== order.id ||
      payment.amount !== REGISTRATION_AMOUNT_PAISE ||
      payment.currency !== REGISTRATION_CURRENCY
    ) {
      /* A validly signed payment that belongs to a *different* order, or is for
         a different amount. The signature alone would have accepted it. */
      logPaymentEvent("payment_order_mismatch", {
        orderId,
        paymentId,
        paymentOrderId: payment.order_id,
        amount: payment.amount,
      });
      return fail(409, "payment_mismatch", `We could not confirm that payment. ${CONTACT}`);
    }

    /* ---- 6. Authorised but not captured ---- */

    if (payment.status === "authorized") {
      // Only one caller does this, so a retry cannot double-capture.
      const holdsLock = await acquireConfirmLock(order.id);
      if (holdsLock) {
        try {
          payment = await capturePayment(
            credentials,
            paymentId,
            REGISTRATION_AMOUNT_PAISE,
            REGISTRATION_CURRENCY,
          );
        } catch (cause) {
          const already =
            cause instanceof RazorpayApiError && cause.status === 400;
          // "already captured" races with the webhook; re-read rather than fail.
          if (!already) throw cause;
          payment = await fetchPayment(credentials, paymentId);
        }
      } else {
        payment = await fetchPayment(credentials, paymentId);
      }
    }

    /* ---- 7. Only `captured` is money we actually hold ---- */

    if (payment.status !== "captured") {
      logPaymentEvent("payment_not_captured", {
        orderId,
        paymentId,
        status: payment.status,
        errorCode: payment.error_code ?? null,
      });
      return fail(
        402,
        "payment_incomplete",
        "That payment didn't go through. You can try again — nothing has been charged.",
      );
    }

    /* ---- 8. PAID ---- */

    await markPaid(credentials, order.id, paymentId);
    await mirror({
      ...registration,
      status: "PAID",
      razorpayPaymentId: paymentId,
      paidAt: Date.now(),
    });

    logPaymentEvent("registration_paid", {
      registrationId: registration.id,
      orderId: order.id,
      paymentId,
    });

    return Response.json(
      {
        registrationId: registration.id,
        status: "PAID",
        firstConfirmation: true,
      } satisfies VerifyResponse,
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (cause) {
    const isProvider = cause instanceof RazorpayApiError;
    logPaymentEvent("verify_failed", {
      orderId,
      paymentId,
      providerStatus: isProvider ? cause.status : null,
      providerCode: isProvider ? cause.providerCode : null,
      reason: (cause as Error).message,
    });

    /*
     * Two very different failures, and they must not share a sentence.
     *
     * A 4xx from Razorpay means it does not recognise these ids — so there is
     * no payment to speak of, and claiming "your payment went through" would be
     * a lie told to someone who was never charged.
     *
     * Anything else — a timeout, a 5xx, a dropped connection — is genuinely
     * inconclusive. The signature was valid, so a payment almost certainly did
     * happen and we simply could not finish checking it. Telling *that* person
     * their payment failed would be the opposite lie. The webhook settles the
     * record either way; the client shows "received, confirming".
     */
    if (isProvider && cause.status >= 400 && cause.status < 500) {
      return fail(409, "payment_mismatch", `We could not confirm that payment. ${CONTACT}`);
    }

    return fail(
      503,
      "verification_unavailable",
      `Your payment went through, but we couldn't confirm it here just yet. ${CONTACT}`,
    );
  }
}
