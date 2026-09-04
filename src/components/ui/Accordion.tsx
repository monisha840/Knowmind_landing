"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";

import { usePrefersReducedMotion } from "@/lib/hooks";

export type AccordionItem = {
  question: string;
  answer: string;
};

type AccordionProps = {
  items: AccordionItem[];
  tone?: "dark" | "light";
  /** Index open on first paint. `null` opens nothing. */
  defaultOpen?: number | null;
  /**
   * Which design system paints it.
   *
   * `tokens` (the default) is the deck page's Tailwind scale. `reference` hands
   * the styling to `reference.css` via `faq-*` class names, because the
   * programme page is drawn in that stylesheet rather than in tokens.
   *
   * The behaviour — open state, `aria-expanded`, `aria-controls`, the labelled
   * region, reduced motion — is shared, which is the whole reason this is a
   * prop on the existing component instead of a second accordion
   * (CLAUDE.md §6).
   */
  variant?: "tokens" | "reference";
};

/**
 * Accessible disclosure list.
 *
 * Each row is a real `<button>` carrying `aria-expanded` and `aria-controls`,
 * and each panel is a labelled `region`, so screen readers and keyboards get
 * the same behaviour as the pointer.
 */
export function Accordion({
  items,
  tone = "light",
  defaultOpen = 0,
  variant = "tokens",
}: AccordionProps) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const reduced = usePrefersReducedMotion();
  const baseId = useId();

  const isDark = tone === "dark";
  const divider = isDark ? "border-cream/12" : "border-ink/12";
  const ref = variant === "reference";

  return (
    <div className={ref ? "faq-list" : `border-t ${divider}`}>
      {items.map((item, i) => {
        const expanded = open === i;
        const buttonId = `${baseId}-trigger-${i}`;
        const panelId = `${baseId}-panel-${i}`;

        return (
          <div key={item.question} className={ref ? "faq-item" : `border-b ${divider}`}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : i)}
                className={
                  ref
                    ? "faq-trigger"
                    : `group flex w-full items-start justify-between gap-6 py-6 text-left transition-colors duration-300 sm:py-7 ${
                        isDark
                          ? "text-cream hover:text-honey"
                          : "text-ink hover:text-amber-ink"
                      }`
                }
              >
                <span className={ref ? "faq-q" : "text-h3 font-medium"}>{item.question}</span>

                {/* Plus → minus, drawn so it never needs an icon font. */}
                <span
                  aria-hidden
                  className={
                    ref
                      ? "faq-mark"
                      : `relative mt-1.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-colors duration-300 ${
                          isDark
                            ? "border-cream/25 group-hover:border-honey/70"
                            : "border-ink/20 group-hover:border-amber-ink/60"
                        }`
                  }
                >
                  <span className={ref ? "faq-mark-h" : "absolute h-px w-3 bg-current"} />
                  <span
                    className={
                      ref
                        ? `faq-mark-v${expanded ? " is-open" : ""}`
                        : `absolute h-3 w-px bg-current transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                            expanded ? "scale-y-0" : "scale-y-100"
                          }`
                    }
                  />
                </span>
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  key="panel"
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={reduced ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p
                    className={
                      ref
                        ? "faq-a"
                        : `max-w-2xl pr-10 pb-7 text-body ${
                            isDark ? "text-cream-muted" : "text-ink-muted"
                          }`
                    }
                  >
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
