import type { MethodStage } from "@/lib/content";

/**
 * Purpose-drawn symbols for the five stages of the method.
 *
 * Geometric, stroke-only and on one 24-unit grid, so they read as a set rather
 * than as clip-art. Deliberately not emoji.
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

/** Reflection — a form and its answering echo across a still line. */
function ReflectionIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 12h16" opacity="0.45" />
      <path d="M7 9.2 12 4l5 5.2" />
      <path d="M7 14.8 12 20l5-5.2" opacity="0.4" />
    </svg>
  );
}

/** Action — one deliberate step toward a mark. */
function ActionIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="17" cy="12" r="4" opacity="0.35" />
      <circle cx="17" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <path d="M3 12h8.5" />
      <path d="M8.8 9.2 11.6 12l-2.8 2.8" />
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

/** 1% Better — a small rise that keeps going. */
function BetterIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M3.5 18.5c4.6 0 6.4-3 8.2-6.2S15.4 6 20.5 6" />
      <path d="M16.6 6h3.9v3.9" />
      <circle cx="3.5" cy="18.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export const methodIcons: Record<MethodStage["key"], (p: IconProps) => React.ReactElement> = {
  awareness: AwarenessIcon,
  reflection: ReflectionIcon,
  action: ActionIcon,
  repetition: RepetitionIcon,
  better: BetterIcon,
};
