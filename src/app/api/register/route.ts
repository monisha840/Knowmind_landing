/**
 * POST /api/register
 *
 * Step one of registration: validate the six answers, write them down as a
 * PENDING registration, and create the ₹999 Razorpay order that Checkout will
 * be opened against.
 *
 * No `runtime` export — Node is the default in Next 16 and the Edge runtime is
 * deprecated (`node_modules/next/dist/docs/.../route-segment-config/runtime.md`).
 * Node is what `node:crypto` needs anyway. POST handlers are never cached, so
 * no cache configuration is required either.
 */

import type { NextRequest } from "next/server";

import type { ApiErrorResponse, CreateOrderResponse } from "@/lib/payments/types";
import {
  REGISTRATION_AMOUNT_PAISE,
  REGISTRATION_CURRENCY,
  initialNotes,
  logPaymentEvent,
  mirror,
  newRegistrationId,
  pendingRegistration,
} from "@/lib/payments/registrations";
import { RazorpayApiError, createOrder, razorpayCredentials } from "@/lib/payments/razorpay";
import { siteConfig } from "@/lib/config";
import {
  type AnswerKey,
  type Answers,
  emptyAnswers,
  localMobileDigits,
  validateAnswers,
} from "@/lib/validation";

const fail = (status: number, error: string, message: string) =>
  Response.json({ error, message } satisfies ApiErrorResponse, { status });

/** "Something went wrong" is useless; every message here names the next move. */
const CONTACT = `If it keeps happening, call or WhatsApp ${siteConfig.contact.phone}.`;

/**
 * Pull the six answers out of an untrusted body.
 *
 * Only the six known keys are read, each coerced to a string and length-capped
 * before validation ever sees it — so a body carrying an `amount`, an extra
 * field, a nested object or a megabyte of text is narrowed to nothing that
 * matters rather than rejected with a lecture (CLAUDE.md §18).
 */
function readAnswers(body: unknown): Answers {
  const source =
    typeof body === "object" && body !== null && "answers" in body
      ? (body as { answers: unknown }).answers
      : null;

  if (typeof source !== "object" || source === null) return { ...emptyAnswers };

  const record = source as Record<string, unknown>;
  const answers = { ...emptyAnswers };
  for (const key of Object.keys(emptyAnswers) as AnswerKey[]) {
    const value = record[key];
    if (typeof value === "string") answers[key] = value.slice(0, 300).trim();
  }
  return answers;
}

export async function POST(request: NextRequest) {
  /* ---- 1. The answers, validated again, authoritatively ---- */

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "bad_request", "We could not read your details. Please try again.");
  }

  const answers = readAnswers(body);
  const errors = validateAnswers(answers);

  if (Object.keys(errors).length > 0) {
    /* The client runs the identical rules from `lib/validation`, so reaching
       here means either a tampered request or a genuine bug. Field errors are
       returned so the form can point at the right question either way. */
    logPaymentEvent("validation_rejected", { fields: Object.keys(errors) });
    return Response.json(
      {
        error: "invalid_details",
        message: "Please check the details you entered and try again.",
        fields: errors,
      },
      { status: 422 },
    );
  }

  /* ---- 2. Credentials, or an honest closed door ---- */

  const credentials = razorpayCredentials();
  if (!credentials) {
    /* The established pattern for a missing integration is a graceful boundary,
       not a crash or a fake success (CLAUDE.md §0.4). Logged loudly because in
       production this is a misconfiguration, not a user error. */
    logPaymentEvent("credentials_missing");
    return fail(
      503,
      "payments_unavailable",
      `Online payment isn't available right now. ${CONTACT}`,
    );
  }

  /* ---- 3. PENDING registration ---- */

  const registration = pendingRegistration(newRegistrationId(), {
    ...answers,
    // Store the number in the one shape everything downstream expects.
    mobile: localMobileDigits(answers.mobile),
  });

  /* ---- 4. The order — amount decided here, never by the caller ---- */

  try {
    const order = await createOrder(credentials, {
      amount: REGISTRATION_AMOUNT_PAISE,
      currency: REGISTRATION_CURRENCY,
      // The registration id doubles as the receipt: unique, and the handle that
      // ties a dashboard row back to a person.
      receipt: registration.id,
      notes: initialNotes(registration),
    });

    registration.razorpayOrderId = order.id;
    await mirror(registration);

    logPaymentEvent("order_created", {
      registrationId: registration.id,
      orderId: order.id,
      amount: order.amount,
    });

    const response: CreateOrderResponse = {
      registrationId: registration.id,
      // Public by design. The *secret* never leaves the server.
      keyId: credentials.keyId,
      orderId: order.id,
      amount: order.amount,
      currency: REGISTRATION_CURRENCY,
      prefill: {
        name: registration.answers.name,
        email: registration.answers.email,
        contact: `+91${registration.answers.mobile}`,
      },
    };

    return Response.json(response, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (cause) {
    /* Razorpay's own wording can name internal fields and account state, so it
       goes to the log and a plain sentence goes to the person. */
    const isProvider = cause instanceof RazorpayApiError;
    logPaymentEvent("order_creation_failed", {
      registrationId: registration.id,
      providerStatus: isProvider ? cause.status : null,
      providerCode: isProvider ? cause.providerCode : null,
      reason: (cause as Error).message,
    });

    if (isProvider && cause.status === 401) {
      return fail(503, "payments_unavailable", `Online payment isn't available right now. ${CONTACT}`);
    }

    return fail(
      502,
      "order_failed",
      `We couldn't start the payment just now. Please try again. ${CONTACT}`,
    );
  }
}
