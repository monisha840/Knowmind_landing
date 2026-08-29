"use client";

import { useInView } from "motion/react";
import { useRef } from "react";

import { useCountUp } from "@/lib/hooks";

type MetricProps = {
  /** Pre-formatted display value, used verbatim when `count` is absent. */
  value: string;
  count?: number;
  decimals?: number;
  suffix?: string;
  label: string;
  tone?: "dark" | "light";
};

const format = (n: number, decimals: number) =>
  n.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/**
 * An authority number that counts up once, when it first scrolls into view.
 * Falls back to the static value under reduced-motion (handled in useCountUp).
 */
export function Metric({
  value,
  count,
  decimals = 0,
  suffix,
  label,
  tone = "dark",
}: MetricProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const animated = useCountUp(count ?? 0, inView && count !== undefined);

  const display = count === undefined ? value : format(animated, decimals);

  return (
    <div ref={ref} className="flex flex-col gap-2">
      <div
        className={`text-h2 font-semibold tabular-nums ${
          tone === "dark" ? "text-honey" : "text-amber-ink"
        }`}
      >
        {display}
        {suffix && <span className="opacity-80">{suffix}</span>}
      </div>
      <div
        className={`max-w-[16ch] text-sm leading-snug ${
          tone === "dark" ? "text-cream-muted" : "text-ink-muted"
        }`}
      >
        {label}
      </div>
    </div>
  );
}
