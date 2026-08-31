"use client";

/**
 * The browser half of registration.
 *
 * Runs the whole sequence — create the order on our server, open Razorpay
 * Checkout against it, hand the result back to our server to be verified — and
 * exposes it as one state machine so the form can render each stage honestly.
 *
 * The one rule the shape of this file exists to enforce: **`paid` is only ever
 * reached from a 200 on `/api/razorpay/verify`.** Razorpay's `handler` firing
 * is not success, it is a claim of success, and the state it moves to is
 * `confirming`.
 *
 * Imports nothing from `razorpay.ts` or `registrations.ts` — those throw in a
 * browser by design. Only the request/response types cross over, and `import
 * type` erases at compile time.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  ApiErrorResponse,
  CheckoutResult,
  CreateOrderResponse,
  VerifyResponse,
} from "@/lib/payments/types";
import { siteConfig } from "@/lib/config";
import { journeyForm } from "@/lib/content";
import type { AnswerKey, Answers } from "@/lib/validation";

/* ------------------------------------------------------- the global script -- */

type CheckoutOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  prefill: { name: string; email: string; contact: string };
  notes: Record<string, string>;
  theme: { color: string };
  modal: { ondismiss: () => void; escape: boolean; confirm_close: boolean };
  handler: (response: CheckoutResult) => void;
};

type RazorpayInstance = {
  open: () => void;
  close: () => void;
  on: (event: "payment.failed", handler: (response: unknown) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: CheckoutOptions) => RazorpayInstance;
  }
}

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/** Long enough for a slow phone on 3G, short enough to still feel like an answer. */
const SCRIPT_TIMEOUT_MS = 15_000;
/** Order creation is our own server plus one Razorpay call. */
const ORDER_TIMEOUT_MS = 20_000;
/** Verification is retried, so each attempt can be tighter. */
const VERIFY_TIMEOUT_MS = 12_000;

/**
 * Loaded on demand, once, and only when somebody has actually finished the
 * questions — never on page load.
 *
 * This page's whole performance argument is that nothing third-party blocks
 * first paint (CLAUDE.md §15), and Checkout is ~100kB that all but the visitors
 * who register would download for nothing. The promise is cached at module
 * scope so a retry after a dismissed modal reuses the loaded script.
 */
let scriptPromise: Promise<void> | null = null;

function loadCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    /* Any tag already in the document belongs to an attempt that never
       finished — `window.Razorpay` is unset, so its load or error event has
       been and gone. Listeners attached to it now would wait for something
       that can never fire again, which is a permanent hang. Start clean. */
    document.querySelectorAll(`script[src="${CHECKOUT_SRC}"]`).forEach((tag) => tag.remove());

    const script = document.createElement("script");
    let timer = 0;

    const finish = (error?: Error) => {
      window.clearTimeout(timer);
      if (!error) {
        resolve();
        return;
      }
      // Never cache a failure — the next attempt deserves a fresh try.
      scriptPromise = null;
      script.remove();
      reject(error);
    };

    script.addEventListener(
      "load",
      () => finish(window.Razorpay ? undefined : new Error("checkout global missing")),
      { once: true },
    );
    script.addEventListener("error", () => finish(new Error("checkout script failed")), {
      once: true,
    });

    /* A CDN that stalls rather than fails emits neither event, and would leave
       the button reading "Preparing payment…" for as long as the tab is open.
       Every async surface needs an exit (CLAUDE.md §9.2). */
    timer = window.setTimeout(
      () => finish(new Error("checkout script timed out")),
      SCRIPT_TIMEOUT_MS,
    );

    script.src = CHECKOUT_SRC;
    script.async = true;
    document.body.appendChild(script);
  });

  return scriptPromise;
}

/* ------------------------------------------------------------------ state -- */

export type CheckoutPhase =
  /** Nothing in flight. The pay button is live. */
  | { kind: "idle" }
  /** Our server is creating the order. The button is disabled. */
  | { kind: "preparing" }
  /** Razorpay's modal is open; the page behind it is just waiting. */
  | { kind: "open" }
  /** Money moved. Our server is checking the signature. Never "success" yet. */
  | { kind: "confirming" }
  /** Verified server-side. The only honest success. */
  | { kind: "paid" }
  /** Nothing was charged, or the attempt failed. Retry is offered. */
  | { kind: "error"; message: string }
  /**
   * Paid, but we could not get confirmation back.
   *
   * A real and distinct outcome — the network dropped between Razorpay's
   * success and our verify call. Showing "failed" would be a lie and showing
   * "registered" would be unverified, so it gets its own state, and the webhook
   * settles the record server-side regardless of what this browser sees.
   */
  | { kind: "unconfirmed"; message: string };

export type UseCheckout = {
  phase: CheckoutPhase;
  /** Field errors from the server's own validation pass, if it disagreed. */
  fieldErrors: Partial<Record<AnswerKey, string>> | null;
  start: (answers: Answers) => void;
  reset: () => void;
};

/* ------------------------------------------------------------------ fetch -- */

const GENERIC = "Something went wrong on our side. Please try again.";

/** Reads our own error envelope; falls back to a plain sentence, never to raw text. */
async function readError(response: Response): Promise<ApiErrorResponse> {
  try {
    const body = (await response.json()) as Partial<ApiErrorResponse>;
    return {
      error: typeof body.error === "string" ? body.error : "error",
      message: typeof body.message === "string" ? body.message : GENERIC,
      fields: body.fields,
    };
  } catch {
    return { error: "error", message: GENERIC };
  }
}

/**
 * Verification, retried.
 *
 * Only worth retrying when the answer was inconclusive — a dropped connection
 * or a 5xx. A 4xx is a decision (bad signature, wrong amount, incomplete
 * payment) and hammering it would just delay telling the person the truth.
 */
async function verifyWithRetry(
  result: CheckoutResult,
  attempts = 3,
): Promise<{ ok: true; body: VerifyResponse } | { ok: false; body: ApiErrorResponse; hard: boolean }> {
  let last: { body: ApiErrorResponse; hard: boolean } = {
    body: { error: "unreachable", message: GENERIC },
    hard: false,
  };

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
    }
    try {
      const response = await fetch("/api/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
        /* A stalled confirmation is the worst place to hang: the money has
           already moved. Time out, retry, and failing that fall through to the
           "received, we're still confirming" state rather than a spinner. */
        signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      });

      if (response.ok) return { ok: true, body: (await response.json()) as VerifyResponse };

      const body = await readError(response);
      const hard = response.status >= 400 && response.status < 500;
      last = { body, hard };
      if (hard) break;
    } catch {
      last = { body: { error: "network", message: GENERIC }, hard: false };
    }
  }

  return { ok: false, ...last };
}

/* ------------------------------------------------------------------- hook -- */

export function useCheckout(): UseCheckout {
  const [phase, setPhase] = useState<CheckoutPhase>({ kind: "idle" });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<AnswerKey, string>> | null>(null);

  /** Guards against a double-click opening two orders (task: LOADING STATES). */
  const busy = useRef(false);
  const alive = useRef(true);
  const instance = useRef<RazorpayInstance | null>(null);

  /**
   * The order from a previous attempt, keyed by the answers it was created for.
   *
   * Reused when somebody dismisses Checkout and tries again, so a person who
   * hesitates twice does not leave three abandoned orders behind. Razorpay
   * allows repeated attempts against one order until it is paid, and keying by
   * the answers means editing a detail correctly starts a fresh one.
   */
  const cachedOrder = useRef<{ key: string; order: CreateOrderResponse } | null>(null);

  /**
   * `alive` must be re-armed in the effect body, not just cleared in the
   * cleanup.
   *
   * `reactStrictMode` is on, so in development React mounts, runs effects, runs
   * the cleanups, and mounts again. An effect written as `() => () => {...}`
   * only ever *clears* the flag — after that second pass `alive.current` stays
   * false for the whole life of the component, every `settle` becomes a no-op
   * and the guard after order creation returns early. The button reaches
   * "Preparing payment…", the order is genuinely created, and Checkout then
   * never opens. Setting it true here is what makes a remount a remount.
   */
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      // Leaving the page with the modal open should not leave it orphaned.
      instance.current?.close();
    };
  }, []);

  const settle = useCallback((next: CheckoutPhase) => {
    busy.current = false;
    if (alive.current) setPhase(next);
  }, []);

  const reset = useCallback(() => {
    busy.current = false;
    setFieldErrors(null);
    setPhase({ kind: "idle" });
  }, []);

  const start = useCallback(
    (answers: Answers) => {
      if (busy.current) return;
      busy.current = true;
      setFieldErrors(null);
      setPhase({ kind: "preparing" });

      void (async () => {
        /* ---- 1. Order (ours) + script (Razorpay's), together ---- */

        const key = JSON.stringify(answers);
        let order: CreateOrderResponse;

        try {
          const cached = cachedOrder.current;
          const [created] = await Promise.all([
            cached?.key === key
              ? Promise.resolve(cached.order)
              : (async () => {
                  const response = await fetch("/api/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    // Only the answers. The amount is the server's to decide.
                    body: JSON.stringify({ answers }),
                    signal: AbortSignal.timeout(ORDER_TIMEOUT_MS),
                  });
                  if (!response.ok) throw await readError(response);
                  return (await response.json()) as CreateOrderResponse;
                })(),
            loadCheckoutScript(),
          ]);
          order = created;
          cachedOrder.current = { key, order };
        } catch (cause) {
          const envelope = cause as Partial<ApiErrorResponse>;
          if (envelope?.fields) setFieldErrors(envelope.fields);
          settle({
            kind: "error",
            message:
              typeof envelope?.message === "string"
                ? envelope.message
                : "We couldn't reach the payment page. Please check your connection and try again.",
          });
          return;
        }

        if (!alive.current) return;

        const Checkout = window.Razorpay;
        if (!Checkout) {
          settle({ kind: "error", message: "We couldn't open the payment window. Please try again." });
          return;
        }

        /* ---- 2. Checkout ---- */

        /*
         * Three different reasons Checkout can go away, and they must not be
         * confused with one another:
         *
         *   paid    — `handler` fired; verification is now driving the state.
         *   failed  — Razorpay reported a failed attempt. It keeps its own
         *             modal open so another method can be tried, so this only
         *             matters if the person then gives up and closes it.
         *   neither — they simply closed it. Nothing was charged, and that is
         *             not an error worth shouting about.
         */
        let paid = false;
        let failed = false;

        const checkout = new Checkout({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amount,
          currency: order.currency,
          name: siteConfig.name,
          description: `${siteConfig.program} — ${siteConfig.batch}`,
          image: `${window.location.origin}/icons/icon-192.png`,
          prefill: order.prefill,
          notes: { registration_id: order.registrationId },
          // Wine, so Checkout reads as a continuation of the page it opened from.
          theme: { color: "#5A2348" },
          modal: {
            escape: true,
            confirm_close: true,
            ondismiss: () => {
              if (paid) return;
              /* Closed without paying. Nothing was charged, the registration
                 stays PENDING and the answers are untouched — so a plain
                 cancellation is a quiet return to the button, while an attempt
                 that actually failed says so and offers the retry. */
              settle(
                failed
                  ? { kind: "error", message: journeyForm.payment.failed.line }
                  : { kind: "idle" },
              );
            },
          },
          handler: (result) => {
            paid = true;
            if (!alive.current) return;
            setPhase({ kind: "confirming" });

            void (async () => {
              const verified = await verifyWithRetry(result);
              if (!alive.current) return;

              if (verified.ok) {
                settle({ kind: "paid" });
                return;
              }

              /* A hard 4xx is a real refusal — say so and let them retry.
                 Anything else means the payment stands but our confirmation
                 did not arrive, which is a different sentence entirely. */
              settle(
                verified.hard && verified.body.error === "payment_incomplete"
                  ? { kind: "error", message: verified.body.message }
                  : { kind: "unconfirmed", message: verified.body.message },
              );
            })();
          },
        });

        checkout.on("payment.failed", () => {
          /* Not settled here: Razorpay is still showing its own modal with the
             failure and another method to try. Closing the page's state behind
             it would leave the two contradicting each other. `ondismiss` reads
             this if and when they give up. */
          failed = true;
        });

        instance.current = checkout;
        setPhase({ kind: "open" });
        checkout.open();
      })();
    },
    [settle],
  );

  return { phase, fieldErrors, start, reset };
}
