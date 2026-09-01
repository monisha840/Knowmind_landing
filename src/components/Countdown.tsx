"use client";

import { useEffect, useState } from "react";

import { refSticky } from "@/lib/reference-content";

type Parts = { d: string; h: string; m: string; s: string };

const pad = (n: number) => String(n).padStart(2, "0");

/** The reference's own arithmetic, to the millisecond. */
function partsFrom(deadline: number, now: number): Parts | null {
  const t = deadline - now;
  if (t <= 0) return null;
  return {
    d: pad(Math.floor(t / 86_400_000)),
    h: pad(Math.floor((t % 86_400_000) / 3_600_000)),
    m: pad(Math.floor((t % 3_600_000) / 60_000)),
    s: pad(Math.floor((t % 60_000) / 1000)),
  };
}

/**
 * The sticky bar's countdown to the first session.
 *
 * Client-only and mount-gated, which is the whole reason it is its own file.
 * A live timer rendered on the server and again in the browser produces two
 * different sets of digits from the same markup — the hydration mismatch
 * CLAUDE.md §20.4 calls out, and one React resolves by throwing the server's
 * tree away. So the server renders a stable dash for every field, the first
 * client render matches it exactly, and the real figures land in an effect one
 * tick later.
 *
 * The reference's own timer replaces the whole strip with "🔴 Closing" once the
 * deadline passes; that branch is kept.
 */
export function Countdown() {
  const [parts, setParts] = useState<Parts | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const deadline = new Date(refSticky.deadline).getTime();

    const tick = () => {
      setParts(partsFrom(deadline, Date.now()));
      setReady(true);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (ready && !parts) {
    return (
      <div className="timer">
        <span className="timer-closed">{refSticky.closed}</span>
      </div>
    );
  }

  const fields: ReadonlyArray<[keyof Parts, string]> = [
    ["d", "D"],
    ["h", "H"],
    ["m", "M"],
    ["s", "S"],
  ];

  return (
    <div className="timer">
      <span className="tlbl">{refSticky.closesIn}</span>
      {fields.map(([key, label]) => (
        <div className="tb" key={key}>
          {/* Announced once, as a whole, rather than four times a second. */}
          <span className="n" aria-hidden={!parts}>
            {parts ? parts[key] : "--"}
          </span>
          <span className="l">{label}</span>
        </div>
      ))}
    </div>
  );
}
