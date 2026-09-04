"use client";

/**
 * The lead dashboard.
 *
 * ---------------------------------------------------------------------------
 * Where the data comes from, and where it does not
 * ---------------------------------------------------------------------------
 * Every row is fetched from `/api/admin/registrations` after this component
 * mounts, over a session cookie the browser cannot read. No lead data is
 * rendered into the page's HTML, embedded in the client bundle, or written to
 * `localStorage` — the server component that mounts this one renders the login
 * form instead when there is no valid session, so an unauthenticated request
 * never receives a single name (owner's condition 12).
 *
 * A 401 mid-session means the eight hours ran out. `router.refresh()` re-runs
 * the server component, which swaps the dashboard for the login form.
 *
 * ---------------------------------------------------------------------------
 * Design
 * ---------------------------------------------------------------------------
 * An internal tool, not a continuation of the landing page: white surfaces,
 * slate text, deep purple for the one primary action and the header, amber only
 * where it carries meaning (a pending payment). No reveal animations, no 3D, no
 * marquee — the page's job is to be legible and fast.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { LeadDetail } from "@/components/admin/LeadDetail";
import {
  DEFAULT_PAGE_SIZE,
  type Lead,
  type LeadPage,
  type LeadSort,
  type ModeFilter,
  type StatusFilter,
} from "@/lib/admin/types";
import {
  formatAmount,
  formatDateShort,
  formatMobile,
  statusStyle,
  whatsappStatusStyle,
} from "@/lib/admin/format";
import { siteConfig } from "@/lib/config";

type Query = {
  search: string;
  status: StatusFilter;
  mode: ModeFilter;
  sort: LeadSort;
  page: number;
};

const INITIAL_QUERY: Query = {
  search: "",
  status: "ALL",
  mode: "all",
  sort: "newest",
  page: 1,
};

function toParams(query: Query, pageSize?: number): string {
  const params = new URLSearchParams({
    q: query.search,
    status: query.status,
    mode: query.mode,
    sort: query.sort,
  });
  if (pageSize !== undefined) {
    params.set("page", String(query.page));
    params.set("pageSize", String(pageSize));
  }
  return params.toString();
}

/* ------------------------------------------------------------------ atoms -- */

function StatTile({
  label,
  value,
  active,
  hint,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border px-4 py-3 text-left transition-colors ${
        active
          ? "border-purple bg-purple/5 ring-1 ring-purple/20"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <span className="block text-xs font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </span>
      <span className="mt-1 block text-2xl font-semibold tabular-nums text-slate-900">{value}</span>
      <span className="mt-0.5 block h-4 text-xs text-slate-400">{hint ?? ""}</span>
    </button>
  );
}

function StatusBadge({ lead }: { lead: Lead }) {
  const style = statusStyle(lead);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${style.className}`}
    >
      {style.label}
    </span>
  );
}

function WhatsappBadge({ lead }: { lead: Lead }) {
  const style = whatsappStatusStyle(lead);
  if (!style) return <span className="text-slate-300">—</span>;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${style.className}`}
    >
      {style.label}
    </span>
  );
}

function TestBadge() {
  return (
    <span className="ml-1.5 inline-flex items-center rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[0.625rem] font-semibold tracking-wide text-slate-600 uppercase">
      Test
    </span>
  );
}

const selectClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-purple focus:ring-2 focus:ring-purple/20";

/* -------------------------------------------------------------- dashboard -- */

export function AdminDashboard() {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState<Query>(INITIAL_QUERY);
  const [data, setData] = useState<LeadPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [reconcile, setReconcile] = useState<{ busy: boolean; message: string | null }>({
    busy: false,
    message: null,
  });
  const [reloadKey, setReloadKey] = useState(0);

  const signedOut = useRef(false);

  /* Debounced, so typing a name is one request rather than one per keystroke. */
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((current) =>
        current.search === searchInput ? current : { ...current, search: searchInput, page: 1 },
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    setLoading(true);

    (async () => {
      try {
        const response = await fetch(`/api/admin/registrations?${toParams(query, DEFAULT_PAGE_SIZE)}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (response.status === 401) {
          /* The session expired. Let the server component decide what to show
             rather than faking a logged-out state here. */
          if (!signedOut.current) {
            signedOut.current = true;
            router.refresh();
          }
          return;
        }

        if (!response.ok) {
          const body: unknown = await response.json().catch(() => null);
          const message =
            typeof body === "object" && body !== null && "message" in body &&
            typeof (body as { message: unknown }).message === "string"
              ? (body as { message: string }).message
              : "Could not load the registrations.";
          if (!cancelled) setError(message);
          return;
        }

        const page = (await response.json()) as LeadPage;
        if (!cancelled) {
          setData(page);
          setError(null);
        }
      } catch (cause) {
        // An aborted request is this effect being superseded, not a failure.
        if (!cancelled && (cause as Error).name !== "AbortError") {
          setError("Could not reach the server. Check your connection and try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [query, reloadKey, router]);

  const setFilter = useCallback((patch: Partial<Query>) => {
    setQuery((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));
  }, []);

  async function onLogout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    router.refresh();
  }

  async function onReconcile() {
    setReconcile({ busy: true, message: null });
    try {
      const response = await fetch("/api/admin/reconcile", { method: "POST" });
      const body: unknown = await response.json().catch(() => null);

      if (response.status === 401) {
        router.refresh();
        return;
      }

      if (!response.ok) {
        const message =
          typeof body === "object" && body !== null && "message" in body &&
          typeof (body as { message: unknown }).message === "string"
            ? (body as { message: string }).message
            : "Reconciliation failed.";
        setReconcile({ busy: false, message });
        return;
      }

      const result = body as { scanned: number; written: number; skipped: number; hasMore: boolean };
      setReconcile({
        busy: false,
        message:
          `Scanned ${result.scanned} Razorpay orders, wrote ${result.written}, skipped ${result.skipped}.` +
          (result.hasMore ? " More remain — run it again." : ""),
      });
      setReloadKey((key) => key + 1);
    } catch {
      setReconcile({ busy: false, message: "Could not reach the server." });
    }
  }

  const stats = data?.stats;
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pageCount = data?.pageCount ?? 1;
  const firstIndex = (query.page - 1) * DEFAULT_PAGE_SIZE;
  const filtered = query.search !== "" || query.status !== "ALL" || query.mode !== "all";

  const modeLabel = useMemo(() => {
    const totals = data?.modeTotals ?? { test: 0, live: 0 };
    return {
      all: `All modes (${totals.live + totals.test})`,
      live: `Live only (${totals.live})`,
      test: `Test only (${totals.test})`,
    };
  }, [data]);

  return (
    <div className="min-h-svh bg-slate-100 text-slate-900">
      {/* ------------------------------------------------------------ header */}
      <header className="bg-purple text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            {/* The owner's wording for the dashboard's title; the programme's
                own name and batch come from siteConfig, which is their one
                source of truth (CLAUDE.md §1.1). */}
            <h1 className="text-base font-semibold tracking-tight sm:text-lg">
              1% Better Every Day — Admin
            </h1>
            <p className="mt-0.5 text-xs text-white/70">
              {siteConfig.program} · {siteConfig.batch}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReconcile}
              disabled={reconcile.busy}
              aria-busy={reconcile.busy}
              className="rounded-lg border border-white/25 px-3 py-1.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              {reconcile.busy ? "Syncing…" : "Sync from Razorpay"}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {reconcile.message && (
          <p
            role="status"
            className="mb-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            {reconcile.message}
          </p>
        )}

        {data && !data.databaseConfigured && (
          /* An honest empty state. An unconfigured database and a cohort where
             nobody has registered look identical in a table, and only one of
             them is something to act on (CLAUDE.md §9.2). */
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">No database is configured.</p>
            <p className="mt-1">
              Registrations are still being taken and recorded in Razorpay, but there is nothing
              here to list until <code className="font-mono text-xs">DATABASE_URL</code> is set on
              this deployment. Once it is, use “Sync from Razorpay” to import what already exists.
            </p>
          </div>
        )}

        {data && data.databaseConfigured && !data.webhookConfigured && (
          /* Not cosmetic. Without the webhook, a payment whose browser never
             came back is confirmed by nothing, so that person pays and never
             appears here as PAID. It is the one gap this dashboard cannot close
             on its own, and the owner is the only one who can close it. */
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">The Razorpay webhook is not configured.</p>
            <p className="mt-1">
              Payments confirmed in the browser are recorded normally, but a payment where the
              visitor loses connection before returning will never be marked paid. Run{" "}
              <code className="font-mono text-xs">npm run webhook:create</code> and set{" "}
              <code className="font-mono text-xs">RAZORPAY_WEBHOOK_SECRET</code> on this
              deployment.
            </p>
          </div>
        )}

        {/* -------------------------------------------------------- stat tiles */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Total"
            value={stats?.total ?? 0}
            active={query.status === "ALL"}
            onClick={() => setFilter({ status: "ALL" })}
          />
          <StatTile
            label="Paid"
            value={stats?.paid ?? 0}
            active={query.status === "PAID"}
            onClick={() => setFilter({ status: "PAID" })}
          />
          <StatTile
            label="Pending"
            value={stats?.pending ?? 0}
            active={query.status === "PENDING"}
            hint={stats && stats.abandoned > 0 ? `${stats.abandoned} over 24h old` : undefined}
            onClick={() => setFilter({ status: "PENDING" })}
          />
          <StatTile
            label="Payment failed"
            value={stats?.failed ?? 0}
            active={query.status === "PAYMENT_FAILED"}
            onClick={() => setFilter({ status: "PAYMENT_FAILED" })}
          />
        </div>

        {/* ---------------------------------------------------------- controls */}
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="min-w-0 grow basis-64">
            <label htmlFor="lead-search" className="block text-xs font-medium text-slate-600">
              Search
            </label>
            <input
              id="lead-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Name, email, number, order or payment ID"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-purple focus:ring-2 focus:ring-purple/20"
            />
          </div>

          <div>
            <label htmlFor="lead-status" className="block text-xs font-medium text-slate-600">
              Status
            </label>
            <select
              id="lead-status"
              value={query.status}
              onChange={(event) => setFilter({ status: event.target.value as StatusFilter })}
              className={`mt-1 ${selectClass}`}
            >
              <option value="ALL">All statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="PAYMENT_FAILED">Payment failed</option>
              <option value="ABANDONED">Abandoned (pending over 24h)</option>
            </select>
          </div>

          <div>
            <label htmlFor="lead-mode" className="block text-xs font-medium text-slate-600">
              Mode
            </label>
            <select
              id="lead-mode"
              value={query.mode}
              onChange={(event) => setFilter({ mode: event.target.value as ModeFilter })}
              className={`mt-1 ${selectClass}`}
            >
              <option value="all">{modeLabel.all}</option>
              <option value="live">{modeLabel.live}</option>
              <option value="test">{modeLabel.test}</option>
            </select>
          </div>

          <div>
            <label htmlFor="lead-sort" className="block text-xs font-medium text-slate-600">
              Sort
            </label>
            <select
              id="lead-sort"
              value={query.sort}
              onChange={(event) => setFilter({ sort: event.target.value as LeadSort })}
              className={`mt-1 ${selectClass}`}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          {/* A plain link, so the browser's own download handles the response's
              Content-Disposition and the session cookie rides along. */}
          <a
            href={`/api/admin/export?${toParams(query)}`}
            className="rounded-lg bg-purple px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-500"
          >
            Export CSV
          </a>
        </div>

        {/* -------------------------------------------------------------- list */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5">
            <p className="text-sm text-slate-600" aria-live="polite">
              {loading && !data
                ? "Loading…"
                : total === 0
                  ? "No registrations"
                  : `Showing ${firstIndex + 1}–${Math.min(firstIndex + rows.length, total)} of ${total}`}
            </p>
            {loading && data && <span className="text-xs text-slate-400">Updating…</span>}
          </div>

          {error && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-rose-700">{error}</p>
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
                className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Try again
              </button>
            </div>
          )}

          {!error && rows.length === 0 && !loading && (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              {filtered
                ? "No registrations match these filters."
                : "No registrations yet. They will appear here as people register."}
            </p>
          )}

          {!error && rows.length > 0 && (
            <>
              {/* Desktop: a table, because a table is what this is. */}
              <div className="hidden md:block">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs tracking-wide text-slate-500 uppercase">
                      <th scope="col" className="px-4 py-2.5 font-medium">#</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Name</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Email</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">WhatsApp</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Confirmation</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-medium">Amount</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((lead, index) => (
                      <tr
                        key={lead.id}
                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                      >
                        <td className="px-4 py-2.5 tabular-nums text-slate-400">
                          {firstIndex + index + 1}
                        </td>
                        <td className="px-4 py-2.5">
                          {/* A real button: the row is not a div pretending to be
                              one, so this is keyboard reachable (CLAUDE.md §13.2). */}
                          <button
                            type="button"
                            onClick={() => setSelected(lead)}
                            className="text-left font-medium text-purple underline-offset-2 hover:underline"
                          >
                            {lead.name || "Unnamed"}
                          </button>
                          {lead.keyMode === "test" && <TestBadge />}
                        </td>
                        <td className="px-4 py-2.5 break-all text-slate-600">{lead.email}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">
                          {formatMobile(lead.mobile)}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge lead={lead} />
                        </td>
                        <td className="px-4 py-2.5">
                          <WhatsappBadge lead={lead} />
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-900">
                          {formatAmount(lead.amountPaise)}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">
                          {formatDateShort(lead.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: one card per lead. A seven-column table at 360px would
                  either scroll sideways or become unreadable, and the brief
                  rules out both (CLAUDE.md §12). */}
              <ul className="divide-y divide-slate-100 md:hidden">
                {rows.map((lead, index) => (
                  <li key={lead.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(lead)}
                      className="flex w-full flex-col gap-1.5 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-medium text-slate-900">
                          <span className="mr-1.5 tabular-nums text-slate-400">
                            {firstIndex + index + 1}.
                          </span>
                          {lead.name || "Unnamed"}
                          {lead.keyMode === "test" && <TestBadge />}
                        </span>
                        <StatusBadge lead={lead} />
                      </span>
                      <span className="block break-all text-sm text-slate-600">{lead.email}</span>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                        <span>{formatMobile(lead.mobile)}</span>
                        <span className="tabular-nums">{formatAmount(lead.amountPaise)}</span>
                        <span>{formatDateShort(lead.createdAt)}</span>
                        <WhatsappBadge lead={lead} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {pageCount > 1 && (
            <nav
              aria-label="Pagination"
              className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3"
            >
              <button
                type="button"
                onClick={() => setQuery((c) => ({ ...c, page: Math.max(1, c.page - 1) }))}
                disabled={query.page <= 1}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {query.page} of {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setQuery((c) => ({ ...c, page: Math.min(pageCount, c.page + 1) }))}
                disabled={query.page >= pageCount}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </div>
      </main>

      {selected && <LeadDetail lead={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
