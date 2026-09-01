import type { PhilosophyStage } from "@/lib/content";

/**
 * Purpose-drawn symbols for the four stages of the 1% Better philosophy.
 *
 * Geometric, stroke-only and on one 24-unit grid, so they read as a set rather
 * than as clip-art. Deliberately not emoji, and no icon dependency.
 */

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Awareness — an aperture opening onto a single point. */
function AwarenessIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" opacity="0.35" />
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Repetition — the return. */
function RepetitionIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v4.2h-4.2" />
    </svg>
  );
}

/** Growth — a small rise that keeps going. */
function BetterIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M3.5 18.5c4.6 0 6.4-3 8.2-6.2S15.4 6 20.5 6" />
      <path d="M16.6 6h3.9v3.9" />
      <circle cx="3.5" cy="18.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Choice — one path, and the moment it becomes two. */
function ChoiceIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 21V13" />
      <path d="M12 13 5.5 6.5" opacity="0.4" />
      <path d="M12 13 18.5 6.5" />
      <circle cx="18.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="5.5" cy="6.5" r="1.5" opacity="0.4" />
    </svg>
  );
}

/**
 * The four stages of the approved 1% Better philosophy.
 *
 * `growth` reuses the rise that was drawn as `better`, which is the same idea
 * under the deck's name for it, so the four read as one family.
 */
export const philosophyIcons: Record<
  PhilosophyStage["key"],
  (p: IconProps) => React.ReactElement
> = {
  awareness: AwarenessIcon,
  choice: ChoiceIcon,
  repetition: RepetitionIcon,
  growth: BetterIcon,
};
