"use client";

/**
 * One registration, in full.
 *
 * A dialog rather than a route, because the table is the place you work from
 * and losing your filters to look at a row would be the wrong trade.
 *
 * Accessibility follows the pattern already established by `RegistrationModal`:
 * `role="dialog"` + `aria-modal`, labelled by its own heading, Escape closes,
 * the backdrop closes, focus moves in on open and back to the opener on close,
 * Tab is trapped inside, and the page behind it is scroll-locked.
 */

import { useCallback, useEffect, useId, useRef } from "react";

import type { Lead } from "@/lib/admin/types";
import {
  formatAmount,
  formatDateTime,
  formatMobile,
  statusStyle,
  whatsappStatusStyle,
} from "@/lib/admin/format";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-0.5 border-b border-slate-100 py-2.5 last:border-b-0 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase sm:text-sm sm:normal-case sm:tracking-normal">
        {label}
      </dt>
      {/* select-all so an order id can be picked up with one click for support. */}
      <dd
        className={`text-sm break-words text-slate-900 ${mono ? "font-mono text-xs select-all sm:text-sm" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

export function LeadDetail({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const headingId = useId();
  const status = statusStyle(lead);

  /* Captured on mount rather than passed in: whatever had focus when this
     opened is what should get it back. */
  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null;
    return () => openerRef.current?.focus?.();
  }, []);

  const close = useCallback(() => onClose(), [onClose]);

  /* Escape, and the Tab trap. One listener, because both are keydown. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null,
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close]);

  /* Scroll lock, restoring whatever the page had rather than assuming "". */
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={close}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id={headingId} className="truncate text-base font-semibold text-slate-900">
              {lead.name || "Unnamed registration"}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${status.className}`}
              >
                {status.label}
              </span>
              {lead.keyMode === "test" && (
                <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  Test
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={close}
            className="-mr-1 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <span className="sr-only">Close</span>
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          <dl>
            <Row label="Name" value={lead.name || "—"} />
            <Row label="Email" value={lead.email || "—"} />
            <Row label="WhatsApp" value={formatMobile(lead.mobile)} />
            <Row label="Registration ID" value={lead.id} mono />
            <Row label="Status" value={status.label} />
            <Row label="Amount" value={`${formatAmount(lead.amountPaise)} ${lead.currency}`} />
            <Row label="Razorpay Order ID" value={lead.razorpayOrderId ?? "—"} mono />
            <Row label="Razorpay Payment ID" value={lead.razorpayPaymentId ?? "—"} mono />
            <Row label="Registered At" value={formatDateTime(lead.createdAt)} />
            <Row label="Paid At" value={formatDateTime(lead.paidAt)} />

            {/* Only meaningful once there is a payment to confirm — an unpaid
                lead has no WhatsApp story yet, so the row is left out rather
                than showing "Not sent" next to every pending registration. */}
            {lead.status === "PAID" && (
              <>
                <Row
                  label="WhatsApp Confirmation"
                  value={whatsappStatusStyle(lead)?.label ?? "Not sent"}
                />
                {lead.whatsappSentAt && (
                  <Row label="Confirmation Sent At" value={formatDateTime(lead.whatsappSentAt)} />
                )}
                {lead.whatsappMessageId && (
                  <Row label="WhatsApp Message ID" value={lead.whatsappMessageId} mono />
                )}
                {lead.whatsappStatus === "FAILED" && lead.whatsappError && (
                  <Row label="WhatsApp Error" value={lead.whatsappError} />
                )}
              </>
            )}

            {/* The three optional answers, shown only when they were asked. */}
            {lead.gender && <Row label="Gender" value={lead.gender} />}
            {lead.age && <Row label="Age" value={lead.age} />}
            {lead.occupation && <Row label="Occupation" value={lead.occupation} />}
          </dl>

          {lead.keyMode === "test" && (
            <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              This registration came from Razorpay test keys. No money moved.
            </p>
          )}
        </div>

        <footer className="border-t border-slate-200 px-5 py-3">
          <div className="flex flex-wrap gap-2">
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Email
              </a>
            )}
            {lead.mobile.length === 10 && (
              <a
                href={`https://wa.me/91${lead.mobile}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                WhatsApp
              </a>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
