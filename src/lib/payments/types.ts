/**
 * The contract between the browser and the two payment routes.
 *
 * Deliberately free of `node:` imports and of anything that reads
 * `process.env`, because `JourneyForm` imports it into the client bundle. The
 * server-only halves live in `razorpay.ts` and `registrations.ts`, both of
 * which refuse to load in a browser at all.
 */

import type { Answers } from "@/lib/validation";

/**
 * Where a registration stands.
 *
 * PENDING  — answers captured, a Razorpay order exists, nothing has been paid.
 * PAID     — a real payment was verified *on the server*. The only transition
 *            into this state runs through a signature check plus a read-back
 *            from Razorpay's own API.
 * FAILED   — a payment attempt was made and Razorpay reported it as failed.
 *            Not a terminal state: the person may simply try again.
 */
export type PaymentStatus = "PENDING" | "PAID" | "FAILED";

/** One registration. The Razorpay order's `notes` is its durable home. */
export type Registration = {
  id: string;
  answers: Answers;
  status: PaymentStatus;
  /** Paise. Fixed by the server; see `REGISTRATION_AMOUNT_PAISE`. */
  amount: number;
  currency: "INR";
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: number;
  paidAt: number | null;
};

/** POST /api/register — 200. */
export type CreateOrderResponse = {
  registrationId: string;
  /** Public by design: Razorpay Checkout needs it in the browser. */
  keyId: string;
  orderId: string;
  /** Paise, echoed back only so Checkout can render it. Never an input. */
  amount: number;
  currency: "INR";
  /** Prefill, so nobody types their details a second time inside Checkout. */
  prefill: { name: string; email: string; contact: string };
};

/** What Razorpay Checkout hands the browser on success. All three untrusted. */
export type CheckoutResult = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

/** POST /api/razorpay/verify — 200. Nothing here is taken on trust. */
export type VerifyResponse = {
  registrationId: string;
  status: Extract<PaymentStatus, "PAID">;
  /** True when this call is what flipped it, false when it already was. */
  firstConfirmation: boolean;
};

/**
 * Every non-2xx body from both routes.
 *
 * `message` is written to be shown to a person as-is. Provider text, stack
 * traces, database errors and environment values never reach it (CLAUDE.md
 * §9.3, §18) — those go to the server log via `logPaymentEvent`.
 */
export type ApiErrorResponse = {
  error: string;
  message: string;
  /** Per-question errors, so the form can send someone back to the right one. */
  fields?: Partial<Record<keyof Answers, string>>;
};
