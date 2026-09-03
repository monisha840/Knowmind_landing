"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { inr, programDetails, siteConfig } from "@/lib/config";
import { journeyForm, journeySteps } from "@/lib/content";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { useCheckout } from "@/lib/payments/useCheckout";
import {
  type Answers,
  type AnswerKey,
  emptyAnswers,
  localMobileDigits,
  validateAnswer,
  validateAnswers,
} from "@/lib/validation";

/**
 * The six questions, asked one at a time, then payment.
 *
 * The answers live in this component for the length of the visit. At the end
 * they are POSTed to `/api/register`, which validates them again with the same
 * rules from `lib/validation` — authoritatively, because front-end validation
 * is UX and not security — and creates the ₹699 Razorpay order that Checkout
 * opens against.
 *
 * The state below is deliberately split in two. `done` is *this form's*
 * progress: all six answered, sitting on the review step. `phase`, from
 * `useCheckout`, is the *payment's* progress, and it is the only thing that can
 * put "Registration successful" on the screen — reached solely from a 200 on
 * `/api/razorpay/verify` (CLAUDE.md §0.4: Razorpay's own success callback is a
 * claim, not a confirmation).
 */

const TOTAL = journeySteps.length;
const pad = (n: number) => String(n).padStart(2, "0");

/** Shared by the question label and the readback, so they cannot drift. */
const answerLabel = (key: AnswerKey, answers: Answers) => {
  const step = journeySteps.find((s) => s.key === key);
  if (!step) return answers[key];
  if (step.field.kind === "choice") {
    return step.field.options.find((o) => o.value === answers[key])?.label ?? "–";
  }
  if (step.field.kind === "tel") return `${step.field.prefix} ${answers[key]}`;
  return answers[key];
};

export function JourneyForm() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const reduced = usePrefersReducedMotion();
  const { phase, fieldErrors, start, reset } = useCheckout();

  // Both text fields and the gender radios are inputs, so one ref serves both.
  const fieldRef = useRef<HTMLInputElement>(null);
  const focusOnMount = useRef(false);
  const advanceTimer = useRef<number | null>(null);
  const uid = useId().replace(/:/g, "");

  const current = journeySteps[step];
  const value = answers[current.key];
  const fieldId = `${uid}-${current.key}`;
  const labelId = `${fieldId}-label`;
  const errorId = `${fieldId}-error`;

  /**
   * Focus lands via the ref callback, not an effect.
   *
   * `AnimatePresence mode="wait"` mounts the next question only once the
   * previous one has finished leaving, so an effect keyed on `step` runs while
   * the ref still holds the outgoing input — focus ends up on `<body>` and
   * typing goes nowhere. Attaching is the only moment the new control is
   * certain to exist.
   *
   * `focusOnMount` gates it deliberately: moving between questions should take
   * focus with it, but the first render must not, or arriving at the page would
   * pull the caret into a form most of the way down it.
   */
  const attachField = useCallback((node: HTMLInputElement | null) => {
    fieldRef.current = node;
    if (node && focusOnMount.current) {
      focusOnMount.current = false;
      node.focus({ preventScroll: true });
    }
  }, []);

  /** Every move between questions carries focus to the new one. */
  const goTo = useCallback((next: number) => {
    focusOnMount.current = true;
    setStep(next);
  }, []);

  useEffect(
    () => () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    },
    [],
  );

  /**
   * The server disagreed about a field.
   *
   * It runs the same rules, so this should be unreachable — but if the two ever
   * drift, the person is sent back to the question at fault with its message,
   * rather than left on a review screen whose button quietly refuses to work.
   */
  useEffect(() => {
    if (!fieldErrors) return;
    const firstBad = journeySteps.findIndex((s) => fieldErrors[s.key]);
    if (firstBad === -1) return;
    setDone(false);
    goTo(firstBad);
    setError(fieldErrors[journeySteps[firstBad].key] ?? null);
  }, [fieldErrors, goTo]);

  const set = (key: AnswerKey, next: string) => {
    setAnswers((prev) => ({ ...prev, [key]: next }));
    // Clear the error as soon as they start fixing it, not on the next submit.
    if (error) setError(null);
  };

  const advance = (from = step, withAnswers = answers) => {
    const key = journeySteps[from].key;
    const message = validateAnswer(key, withAnswers[key]);
    if (message) {
      setError(message);
      fieldRef.current?.focus({ preventScroll: true });
      return;
    }
    setError(null);

    if (from < TOTAL - 1) {
      goTo(from + 1);
      return;
    }

    /* Last question: re-check the whole set before the hand-off, and return to
       the first thing actually wrong rather than to a dead end. */
    const errors = validateAnswers(withAnswers);
    const firstBad = journeySteps.findIndex((s) => errors[s.key]);
    if (firstBad !== -1) {
      goTo(firstBad);
      setError(errors[journeySteps[firstBad].key] ?? null);
      return;
    }
    setDone(true);
  };

  const back = () => {
    setError(null);
    if (done) {
      setDone(false);
      goTo(TOTAL - 1);
      return;
    }
    goTo(Math.max(0, step - 1));
  };

  /** Choosing an option answers the question, so it moves on by itself. */
  const choose = (key: AnswerKey, optionValue: string) => {
    const next = { ...answers, [key]: optionValue };
    setAnswers(next);
    setError(null);
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    // A beat, so the selected state is seen before the question changes.
    advanceTimer.current = window.setTimeout(() => advance(step, next), reduced ? 0 : 260);
  };

  const motionProps = reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
      }
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -14 },
        transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const },
      };

  const questionClass =
    "block text-[clamp(1.75rem,1.15rem+2.4vw,3rem)] leading-[1.08] font-semibold tracking-[-0.02em] text-balance text-ink";

  /* -------------------------------------------------------------- success -- */

  /**
   * The one place a registration is called successful.
   *
   * Guarded on `phase.kind === "paid"`, which `useCheckout` only sets after
   * `/api/razorpay/verify` returns 200 — i.e. after the server checked the
   * signature and read the payment back from Razorpay. It is rendered before
   * the review panel so that nothing else can be on screen at the same time.
   */
  if (phase.kind === "paid") {
    const { success } = journeyForm.payment;
    return (
      <motion.div {...motionProps} key="paid" role="status" aria-live="polite">
        <span className="inline-flex items-center gap-3 text-eyebrow font-semibold tracking-[0.18em] text-amber-ink uppercase">
          <svg aria-hidden viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.4" />
            <path
              d="m8 12.3 2.8 2.7L16 9.8"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {inr(programDetails.price)} {success.receivedSuffix}
        </span>

        <h3 className="mt-6 font-serif text-[clamp(2.25rem,1.4rem+3.4vw,3.75rem)] leading-[1.05] text-ink italic">
          {success.heading}
        </h3>

        {/* Skipped entirely when there are no lines, so an empty list leaves
            no orphaned top margin above the details block. */}
        {success.lines.length > 0 && (
          <div className="mt-6 flex flex-col gap-1.5">
            {success.lines.map((line) => (
              <p key={line} className="text-lead text-ink-muted">
                {line}
              </p>
            ))}
          </div>
        )}

        {/* Their details, once more — the receipt for what they just signed up
            for. Razorpay's own ids are not shown: they mean nothing to a
            reader, and Razorpay emails them separately. */}
        <dl className="mt-10 grid gap-x-8 gap-y-4 border-t border-ink/10 pt-8 sm:grid-cols-2">
          {journeySteps.map((s) => (
            <div key={s.key}>
              <dt className="text-eyebrow font-semibold tracking-[0.14em] text-ink-muted uppercase">
                {s.key === "occupation" ? "Work" : s.key}
              </dt>
              <dd className="mt-1.5 text-body break-words text-ink">{answerLabel(s.key, answers)}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-8 text-sm text-ink-muted">
          Anything at all –{" "}
          <a href={siteConfig.contact.phoneHref} className="link-underline font-medium text-amber-ink">
            {siteConfig.contact.phone}
          </a>
        </p>
      </motion.div>
    );
  }

  /* ---------------------------------------------------- paid, unconfirmed -- */

  if (phase.kind === "unconfirmed") {
    const { unconfirmed } = journeyForm.payment;
    return (
      <motion.div {...motionProps} key="unconfirmed" role="status" aria-live="polite">
        <h3 className="font-serif text-[clamp(2rem,1.3rem+2.8vw,3.25rem)] leading-[1.06] text-ink italic">
          {unconfirmed.heading}
        </h3>
        <p className="mt-5 text-lead text-ink-muted">{unconfirmed.line}</p>
        <p className="mt-7 text-body text-ink">
          <a href={siteConfig.contact.phoneHref} className="link-underline font-medium text-amber-ink">
            {siteConfig.contact.phone}
          </a>
        </p>
      </motion.div>
    );
  }

  /* ------------------------------------------------------- review and pay -- */

  if (done) {
    const busy = phase.kind === "preparing" || phase.kind === "open" || phase.kind === "confirming";

    /* One line under the button that always says what is happening — the
       disabled button on its own would just look broken (CLAUDE.md §9.2). */
    const status =
      phase.kind === "preparing"
        ? journeyForm.payment.preparing
        : phase.kind === "open"
          ? journeyForm.payment.open
          : phase.kind === "confirming"
            ? journeyForm.payment.confirming
            : null;

    return (
      <motion.div {...motionProps} key="ready">
        <p className="text-eyebrow font-semibold tracking-[0.18em] text-amber-ink tabular-nums uppercase">
          {pad(TOTAL)} / {pad(TOTAL)}
        </p>

        <h3 className="mt-6 font-serif text-[clamp(2.25rem,1.4rem+3.4vw,3.75rem)] leading-[1.05] text-ink italic">
          {journeyForm.ready.heading}
        </h3>

        <div className="mt-6 flex flex-col gap-1.5">
          {journeyForm.ready.lines.map((line) => (
            <p key={line} className="text-lead text-ink-muted">
              {line}
            </p>
          ))}
        </div>

        {/* Read back plainly — it is their information, and seeing it is how
            they know nothing was mistyped before they go to pay. */}
        <dl className="mt-10 grid gap-x-8 gap-y-4 border-t border-ink/10 pt-8 sm:grid-cols-2">
          {journeySteps.map((s) => (
            <div key={s.key}>
              <dt className="text-eyebrow font-semibold tracking-[0.14em] text-ink-muted uppercase">
                {s.key === "occupation" ? "Work" : s.key}
              </dt>
              <dd className="mt-1.5 text-body break-words text-ink">{answerLabel(s.key, answers)}</dd>
            </div>
          ))}
        </dl>

        {/* Nothing was charged — say so where the money is about to be asked
            for, not in a banner somewhere else. */}
        {phase.kind === "error" && (
          <div
            role="alert"
            className="mt-10 rounded-card border border-wine/25 bg-wine/[0.04] p-5 sm:p-6"
          >
            <p className="text-body font-semibold text-ink">{journeyForm.payment.failed.heading}</p>
            <p className="mt-2 text-sm text-ink-muted">{phase.message}</p>
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
          {/*
            A real <button>, not the page's `CTAButton`.

            `CTAButton` renders an `<a>` — correct for every other call to
            action on the page, all of which navigate. This one spends money and
            can be disabled, so it needs button semantics: `disabled` that
            actually prevents activation, and `aria-busy` while it works. It
            borrows CTAButton's exact honey pill so the two read as one family
            (CLAUDE.md §6 — no second button *style*, and this is not one).
          */}
          <button
            type="button"
            id="journey-pay"
            disabled={busy}
            aria-busy={busy}
            data-payment-phase={phase.kind}
            onClick={() => start(answers)}
            className="group relative inline-flex min-h-[3.25rem] items-center justify-center gap-2.5 rounded-full bg-honey px-8 py-4 text-base font-semibold tracking-tight whitespace-nowrap text-wine-950 transition-colors duration-300 hover:bg-honey-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-ink disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-honey sm:px-10 sm:py-[1.125rem] sm:text-lg"
          >
            {busy ? (
              <>
                {/* Held still under reduced motion — a spinner is an infinite
                    animation, which §11.1 rules out. The words carry it. */}
                <span
                  aria-hidden
                  className={`h-4 w-4 shrink-0 rounded-full border-2 border-wine-950/25 border-t-wine-950 ${
                    reduced ? "" : "animate-spin"
                  }`}
                />
                <span>{status}</span>
              </>
            ) : (
              <>
                <span>
                  {phase.kind === "error"
                    ? journeyForm.payment.failed.retry
                    : `${journeyForm.ready.cta} ${inr(programDetails.price)}`}
                </span>
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-[1.1em] w-[1.1em] shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1"
                >
                  <path
                    d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </>
            )}
          </button>

          {/* Editing mid-payment would change details the open order was built
              from, so it waits until the attempt has settled. */}
          {!busy && (
            <button
              type="button"
              onClick={() => {
                reset();
                back();
              }}
              className="min-h-11 text-sm font-medium text-ink-muted underline-offset-4 transition-colors hover:text-amber-ink hover:underline"
            >
              Change something
            </button>
          )}
        </div>

        <p className="mt-6 text-sm text-ink-muted">
          Secure payment via Razorpay. Zoom link within 24 hours.
        </p>
      </motion.div>
    );
  }

  /* ------------------------------------------------------------- questions -- */

  const isChoice = current.field.kind === "choice";

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        advance();
      }}
    >
      {/* ---- Progress ---- */}
      <div className="flex items-center gap-4">
        <p className="text-eyebrow font-semibold tracking-[0.18em] text-amber-ink tabular-nums uppercase">
          <span className="sr-only">Question </span>
          {pad(step + 1)}
          <span className="text-ink-muted"> / {pad(TOTAL)}</span>
        </p>

        {/* Six ticks, not a filling bar: this is a path, not a download. */}
        <ol aria-hidden className="flex flex-1 items-center gap-1.5">
          {journeySteps.map((s, i) => (
            <li
              key={s.key}
              className={`h-px flex-1 transition-colors duration-500 ${
                i < step ? "bg-amber-ink/70" : i === step ? "bg-amber-ink" : "bg-ink/15"
              }`}
            />
          ))}
        </ol>
      </div>

      {/* Reserved so the controls below do not jump between question lengths. */}
      <div className="mt-10 min-h-[15.5rem] sm:min-h-[16.5rem]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={current.key} {...motionProps}>
            {isChoice ? (
              /* A fieldset of real radios: arrow keys, tab order and the
                 grouping are the platform's job, not ours. */
              <fieldset className="min-w-0 border-0 p-0">
                <legend id={labelId} className={questionClass}>
                  {current.question}
                </legend>

                {current.note && <p className="mt-3.5 text-body text-ink-muted">{current.note}</p>}

                <div className="mt-8 flex flex-wrap gap-2.5">
                  {current.field.kind === "choice" &&
                    current.field.options.map((option, i) => {
                      const selected = value === option.value;
                      return (
                        <label
                          key={option.value}
                          className={`min-h-11 cursor-pointer rounded-pill border px-6 py-3 text-body transition-colors duration-300 has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-amber-ink ${
                            selected
                              ? "border-amber-ink bg-amber-ink/10 font-medium text-ink"
                              : "border-ink/20 text-ink-muted hover:border-amber-ink/50 hover:text-ink"
                          }`}
                        >
                          <input
                            ref={i === 0 ? attachField : undefined}
                            type="radio"
                            name={current.key}
                            value={option.value}
                            checked={selected}
                            onChange={() => choose(current.key, option.value)}
                            aria-describedby={error ? errorId : undefined}
                            className="sr-only"
                          />
                          {option.label}
                        </label>
                      );
                    })}
                </div>
              </fieldset>
            ) : (
              <>
                <label htmlFor={fieldId} id={labelId} className={questionClass}>
                  {current.question}
                </label>

                {current.note && <p className="mt-3.5 text-body text-ink-muted">{current.note}</p>}

                <div className="mt-8 flex items-baseline gap-3 border-b border-ink/25 pb-3 transition-colors duration-300 focus-within:border-amber-ink">
                  {current.field.kind === "tel" && (
                    <span aria-hidden className="text-lead text-ink-muted tabular-nums">
                      {current.field.prefix}
                    </span>
                  )}

                  <input
                    ref={attachField}
                    id={fieldId}
                    name={current.key}
                    value={value}
                    onChange={(e) =>
                      set(
                        current.key,
                        /* Phone and age only ever hold digits, so non-digits go
                           as they are typed rather than being rejected later. */
                        current.field.kind === "tel"
                          ? localMobileDigits(e.target.value).slice(0, 10)
                          : current.field.kind === "number"
                            ? e.target.value.replace(/\D/g, "").slice(0, 3)
                            : e.target.value,
                      )
                    }
                    type={
                      current.field.kind === "email"
                        ? "email"
                        : current.field.kind === "tel"
                          ? "tel"
                          : "text"
                    }
                    inputMode={
                      current.field.kind === "number" || current.field.kind === "tel"
                        ? "numeric"
                        : current.field.kind === "email"
                          ? "email"
                          : "text"
                    }
                    autoComplete={
                      current.field.kind === "choice" ? undefined : current.field.autoComplete
                    }
                    placeholder={current.placeholder}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    enterKeyHint={step === TOTAL - 1 ? "done" : "next"}
                    className="w-full bg-transparent text-[clamp(1.125rem,1rem+0.9vw,1.625rem)] text-ink caret-amber-ink outline-none placeholder:text-ink-muted/45"
                  />
                </div>
              </>
            )}

            {/* One quiet line, in the flow — never a banner over the content. */}
            <p
              id={errorId}
              role="status"
              aria-live="polite"
              className={`mt-3.5 text-sm transition-opacity duration-200 ${
                error ? "text-wine opacity-100" : "opacity-0"
              }`}
            >
              {error ?? " "}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ---- Controls ---- */}
      <div className="mt-4 flex items-center gap-6">
        {step > 0 && (
          <button
            type="button"
            onClick={back}
            className="-ml-2 inline-flex min-h-11 items-center gap-2 px-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <svg aria-hidden viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </button>
        )}

        <div className="ml-auto flex items-center gap-4">
          <span aria-hidden className="hidden text-xs text-ink-muted/70 sm:block">
            Press Enter
          </span>
          <button
            type="submit"
            className="grid h-12 w-12 place-items-center rounded-full bg-ink text-paper transition-colors duration-300 hover:bg-wine focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-ink"
          >
            <span className="sr-only">
              {step === TOTAL - 1 ? "Finish" : `Continue to question ${pad(step + 2)}`}
            </span>
            <svg aria-hidden viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}
