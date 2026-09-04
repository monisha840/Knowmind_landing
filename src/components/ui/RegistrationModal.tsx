"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { onOpenRegistration } from "@/components/ui/registrationBus";
import { inr, programDetails, siteConfig } from "@/lib/config";
import { journeyForm } from "@/lib/content";
import { useCheckout } from "@/lib/payments/useCheckout";
import { emptyAnswers, validateAnswer } from "@/lib/validation";

/**
 * The registration dialog — the only way into checkout.
 *
 * It replaces `BeginJourneySection`, the six-question page every call to action
 * used to scroll to. The owner asked for three questions in a dialog instead:
 * name, email and WhatsApp number.
 *
 * ── What did not change ───────────────────────────────────────────────────
 *
 * The payment path underneath is byte-for-byte the one that was already here.
 * This component collects three answers and hands them to `useCheckout`, which
 * is the same state machine `JourneyForm` used:
 *
 *   start() → POST /api/register (server validates again, server decides the
 *   amount) → Razorpay Checkout → POST /api/razorpay/verify (signature, then
 *   the order and payment read back from Razorpay) → `paid`
 *
 * Nothing here can produce a success state on its own. `phase.kind === "paid"`
 * is set in `useCheckout` only after that verify call returns 200, which is why
 * Razorpay's own success callback moves this dialog to "confirming" and never
 * further (CLAUDE.md §0.4, §8).
 *
 * The three questions the modal no longer asks — gender, age, occupation — are
 * optional in `lib/validation` and are sent empty. They still exist in the
 * schema and in the order's notes, so putting the questions back is a change to
 * this file alone.
 *
 * ── Accessibility ─────────────────────────────────────────────────────────
 *
 * `role="dialog"` + `aria-modal`, labelled by its own heading. Escape closes,
 * the backdrop closes, focus moves in on open and back to the opener on close,
 * Tab is trapped inside, and the page behind it is scroll-locked. None of that
 * is available while money is in flight — see `dismissable`.
 */

/** The three the modal asks. The rest of `Answers` goes through empty. */
const FIELDS = [
  {
    key: "name" as const,
    label: "Your name",
    type: "text",
    autoComplete: "name",
    inputMode: undefined,
    placeholder: "Full name",
  },
  {
    key: "email" as const,
    label: "Email address",
    type: "email",
    autoComplete: "email",
    inputMode: "email" as const,
    placeholder: "you@example.com",
  },
  {
    key: "mobile" as const,
    label: "WhatsApp number",
    type: "tel",
    autoComplete: "tel",
    inputMode: "tel" as const,
    placeholder: "+91 98765 43210",
  },
];

type FieldKey = (typeof FIELDS)[number]["key"];
type Draft = Record<FieldKey, string>;

const EMPTY_DRAFT: Draft = { name: "", email: "", mobile: "" };

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export function RegistrationModal() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});

  const { phase, fieldErrors, start, reset } = useCheckout();

  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const headingId = useId();
  const descId = useId();

  /* Money in flight — closing would leave the visitor unsure whether they had
     paid. Every dismissal route checks this one flag. */
  const inFlight =
    phase.kind === "preparing" || phase.kind === "open" || phase.kind === "confirming";
  const dismissable = !inFlight;

  /* ---------------------------------------------------------- open/close -- */

  useEffect(
    () =>
      onOpenRegistration(() => {
        openerRef.current = document.activeElement as HTMLElement | null;
        setOpen(true);
      }),
    [],
  );

  const close = useCallback(() => {
    if (!dismissable) return;
    setOpen(false);
    /* A finished registration should not be sitting in the form when the dialog
       is opened again; an abandoned one should be, so the answers survive a
       mistaken close. */
    if (phase.kind === "paid") {
      setDraft(EMPTY_DRAFT);
      setTouched({});
      setErrors({});
    }
    reset();
    openerRef.current?.focus?.();
  }, [dismissable, phase.kind, reset]);

  /* Escape, and the Tab trap. One listener, because both are keydown. */
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const nodes = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((node) => node.offsetParent !== null);
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  /* Scroll lock, restoring whatever the page had rather than assuming "". */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  /* Focus into the panel once it exists. */
  useEffect(() => {
    if (!open) return;
    const node = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    node?.focus();
  }, [open]);

  /* ------------------------------------------------------------- the form -- */

  const setField = (key: FieldKey, value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (touched[key]) {
      setErrors((e) => ({ ...e, [key]: validateAnswer(key, value) ?? undefined }));
    }
  };

  const blurField = (key: FieldKey) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors((e) => ({ ...e, [key]: validateAnswer(key, draft[key]) ?? undefined }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (inFlight) return;

    const next: Partial<Record<FieldKey, string>> = {};
    for (const field of FIELDS) {
      const error = validateAnswer(field.key, draft[field.key]);
      if (error) next[field.key] = error;
    }
    setErrors(next);
    setTouched({ name: true, email: true, mobile: true });

    if (Object.keys(next).length > 0) {
      /* Focus the first thing that is wrong, rather than leaving somebody to
         hunt for it (CLAUDE.md §9.1). */
      const firstBad = FIELDS.find((f) => next[f.key]);
      if (firstBad) panelRef.current?.querySelector<HTMLElement>(`#${cssId(firstBad.key)}`)?.focus();
      return;
    }

    /* The three optional answers go through empty; the server accepts them
       that way and keeps the notes' shape. `useCheckout` guards against a
       second order from a repeated click. */
    start({ ...emptyAnswers, ...draft });
  };

  const cssId = (key: string) => `reg-${key}`;

  if (!open) return null;

  const paid = phase.kind === "paid";
  const busyLabel =
    phase.kind === "preparing"
      ? journeyForm.payment.preparing
      : phase.kind === "open"
        ? journeyForm.payment.open
        : phase.kind === "confirming"
          ? journeyForm.payment.confirming
          : null;

  return (
    <div
      className="reg-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={panelRef}
        className="reg-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descId}
      >
        <button
          type="button"
          className="reg-close"
          onClick={close}
          disabled={!dismissable}
          aria-label="Close"
        >
          <span aria-hidden>×</span>
        </button>

        {paid ? (
          /* ---------------------------------------------------- success -- */
          <div className="reg-success" role="status" aria-live="polite">
            <span className="reg-tick" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="m7.5 12.4 3 2.9 6-6.6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>

            <h2 className="reg-title" id={headingId}>
              Payment Successful
            </h2>
            <p className="reg-lead" id={descId}>
              {inr(programDetails.price)} received and confirmed. You are registered for{" "}
              {programDetails.dateLabel}.
            </p>

            {/* Only what the server actually verified. Nothing here is the
                browser's own word for what happened (CLAUDE.md §0.4). */}
            <dl className="reg-receipt">
              <div>
                <dt>Name</dt>
                <dd>{draft.name}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{draft.email}</dd>
              </div>
              <div>
                <dt>WhatsApp</dt>
                <dd>{draft.mobile}</dd>
              </div>
              <div>
                <dt>Amount paid</dt>
                <dd>{inr(phase.receipt.amountPaise / 100)}</dd>
              </div>
              <div>
                <dt>Payment ID</dt>
                <dd className="reg-mono">{phase.receipt.razorpayPaymentId}</dd>
              </div>
              <div>
                <dt>Order ID</dt>
                <dd className="reg-mono">{phase.receipt.razorpayOrderId}</dd>
              </div>
              <div>
                <dt>Confirmed</dt>
                <dd>
                  {new Date(phase.receipt.confirmedAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </dd>
              </div>
            </dl>

            <button type="button" className="reg-submit" onClick={close}>
              Done
            </button>
          </div>
        ) : (
          /* ------------------------------------------------------- form -- */
          <form className="reg-form" onSubmit={submit} noValidate>
            <h2 className="reg-title" id={headingId}>
              {journeyForm.heading}
            </h2>
            <p className="reg-lead" id={descId}>
              {journeyForm.lead}
            </p>

            {FIELDS.map((field) => {
              const id = cssId(field.key);
              const serverError = fieldErrors?.[field.key];
              const error = errors[field.key] ?? serverError;
              return (
                <div className="reg-field" key={field.key}>
                  <label htmlFor={id}>{field.label}</label>
                  <input
                    id={id}
                    name={field.key}
                    type={field.type}
                    inputMode={field.inputMode}
                    autoComplete={field.autoComplete}
                    placeholder={field.placeholder}
                    value={draft[field.key]}
                    disabled={inFlight}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${id}-error` : undefined}
                    onChange={(e) => setField(field.key, e.target.value)}
                    onBlur={() => blurField(field.key)}
                  />
                  {error && (
                    <p className="reg-error" id={`${id}-error`}>
                      {error}
                    </p>
                  )}
                </div>
              );
            })}

            {/* Every non-idle outcome says what is true and what happens next
                (CLAUDE.md §9.2). None of them claims a payment. */}
            <div className="reg-status" role="status" aria-live="polite">
              {busyLabel && <p className="reg-busy">{busyLabel}</p>}
              {phase.kind === "error" && (
                <p className="reg-fail">
                  <strong>{journeyForm.payment.failed.heading}</strong> {phase.message}
                </p>
              )}
              {phase.kind === "unconfirmed" && (
                <p className="reg-warn">
                  <strong>{journeyForm.payment.unconfirmed.heading}</strong> {phase.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="reg-submit"
              disabled={inFlight}
              aria-busy={inFlight}
              data-payment-phase={phase.kind}
            >
              {inFlight
                ? journeyForm.payment.preparing
                : phase.kind === "error"
                  ? journeyForm.payment.failed.retry
                  : `${journeyForm.ready.cta} ${inr(programDetails.price)}`}
            </button>

            <p className="reg-fine">
              Secure payment via Razorpay. Questions? {siteConfig.contact.phone}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
