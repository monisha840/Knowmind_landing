"use client";

import type { ReactNode } from "react";

import { usePrefersReducedMotion } from "@/lib/hooks";

type MarqueeProps = {
  items: string[];
  /** Seconds for one full pass. Larger = slower. */
  duration?: number;
  reverse?: boolean;
  tone?: "dark" | "light";
  renderItem?: (item: string) => ReactNode;
};

/**
 * A slow, CSS-driven typographic marquee.
 *
 * Under reduced-motion it degrades to a static, wrapped list rather than a
 * clipped strip, so no content becomes unreachable.
 */
export function Marquee({
  items,
  duration = 60,
  reverse = false,
  tone = "dark",
  renderItem,
}: MarqueeProps) {
  const reduced = usePrefersReducedMotion();

  const itemClass =
    tone === "dark"
      ? "text-cream-dim transition-colors duration-300 hover:text-honey"
      : "text-ink-muted transition-colors duration-300 hover:text-amber-ink";

  if (reduced) {
    return (
      <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3">
        {items.map((item) => (
          <li key={item} className={`text-lg font-medium tracking-tight ${itemClass}`}>
            {renderItem ? renderItem(item) : item}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div
      className="group relative flex overflow-hidden"
      style={{
        // Fade the strip into the background at both edges.
        maskImage:
          "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
      }}
    >
      {[0, 1].map((copy) => (
        <ul
          key={copy}
          aria-hidden={copy === 1}
          className="flex shrink-0 items-center gap-10 pr-10 [animation-play-state:running] group-hover:[animation-play-state:paused] sm:gap-14 sm:pr-14"
          style={{
            animation: `marquee ${duration}s linear infinite`,
            animationDirection: reverse ? "reverse" : "normal",
          }}
        >
          {items.map((item) => (
            <li
              key={item}
              className={`text-lg font-medium tracking-tight whitespace-nowrap sm:text-xl ${itemClass}`}
            >
              {renderItem ? renderItem(item) : item}
            </li>
          ))}
        </ul>
      ))}

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
