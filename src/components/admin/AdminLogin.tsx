"use client";

/**
 * The admin login form.
 *
 * It collects a password and posts it. That is the whole of its
 * responsibility — it does not know the password, cannot check one, and holds
 * nothing afterwards. The decision is made in `/api/admin/login`, the session
 * arrives as an HttpOnly cookie this component cannot read, and `router.refresh()`
 * then re-runs the server component that decides what to render.
 *
 * Nothing is written to `localStorage` or `sessionStorage`. A "logged in" flag
 * in browser storage would be a client-side security boundary, which is exactly
 * what the owner's condition 6 rules out — and it would be trivially forged.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";

type Phase = { kind: "idle" } | { kind: "submitting" } | { kind: "error"; message: string };

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  const submitting = phase.kind === "submitting";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || password.length === 0) return;

    setPhase({ kind: "submitting" });

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        signal: AbortSignal.timeout(20_000),
      });

      if (response.ok) {
        /* Clear it from component state the moment it is no longer needed. It
           was never persisted anywhere, and it does not linger in memory
           either. */
        setPassword("");
        router.refresh();
        return;
      }

      const body: unknown = await response.json().catch(() => null);
      const message =
        typeof body === "object" && body !== null && "message" in body &&
        typeof (body as { message: unknown }).message === "string"
          ? (body as { message: string }).message
          : "That password was not accepted.";

      setPhase({ kind: "error", message });
    } catch {
      setPhase({
        kind: "error",
        message: "Could not reach the server. Check your connection and try again.",
      });
    }
  }

  return (
    <main
      id="main"
      className="flex min-h-svh items-center justify-center bg-slate-100 px-4 py-12 text-slate-900"
    >
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">Admin login</h1>
          <p className="mt-1 text-sm text-slate-500">1% Better Every Day — registrations</p>

          {!configured && (
            /* An honest closed door rather than a login box that cannot
               succeed (CLAUDE.md §0.4). It names the variables because only an
               operator ever sees this, and only when the deployment is
               misconfigured — never in response to a wrong password. */
            <p
              className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
              role="status"
            >
              Admin access is not configured on this deployment. Set{" "}
              <code className="font-mono text-xs">ADMIN_PASSWORD_HASH</code> and{" "}
              <code className="font-mono text-xs">ADMIN_SESSION_SECRET</code>, then redeploy.
            </p>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                autoFocus
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (phase.kind === "error") setPhase({ kind: "idle" });
                }}
                aria-invalid={phase.kind === "error"}
                aria-describedby={phase.kind === "error" ? "admin-login-error" : undefined}
                disabled={submitting}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-purple focus:ring-2 focus:ring-purple/20 disabled:opacity-60"
              />
            </div>

            {/* Announced, not merely coloured. */}
            <p
              id="admin-login-error"
              role="alert"
              aria-live="polite"
              className={
                phase.kind === "error"
                  ? "rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
                  : "sr-only"
              }
            >
              {phase.kind === "error" ? phase.message : ""}
            </p>

            <button
              type="submit"
              disabled={submitting || password.length === 0}
              aria-busy={submitting}
              className="w-full rounded-lg bg-purple px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          This page is private and is not indexed.
        </p>
      </div>
    </main>
  );
}
