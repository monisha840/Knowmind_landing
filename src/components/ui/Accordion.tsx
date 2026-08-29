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
};

/**
 * Accessible disclosure list.
 *
 * Each row is a real `<button>` carrying `aria-expanded` and `aria-controls`,
 * and each panel is a labelled `region`, so screen readers and keyboards get
 * the same behaviour as the pointer.
 */
export function Accordion({ items, tone = "light", defaultOpen = 0 }: AccordionProps) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const reduced = usePrefersReducedMotion();
  const baseId = useId();

  const isDark = tone === "dark";
  const divider = isDark ? "border-cream/12" : "border-ink/12";

  return (
    <div className={`border-t ${divider}`}>
      {items.map((item, i) => {
        const expanded = open === i;
        const buttonId = `${baseId}-trigger-${i}`;
        const panelId = `${baseId}-panel-${i}`;

        return (
          <div key={item.question} className={`border-b ${divider}`}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : i)}
                className={`group flex w-full items-start justify-between gap-6 py-6 text-left transition-colors duration-300 sm:py-7 ${
                  isDark
                    ? "text-cream hover:text-honey"
                    : "text-ink hover:text-amber-ink"
                }`}
              >
                <span className="text-h3 font-medium">{item.question}</span>

                {/* Plus → minus, drawn so it never needs an icon font. */}
                <span
                  aria-hidden
                  className={`relative mt-1.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-colors duration-300 ${
                    isDark
                      ? "border-cream/25 group-hover:border-honey/70"
                      : "border-ink/20 group-hover:border-amber-ink/60"
                  }`}
                >
                  <span className="absolute h-px w-3 bg-current" />
                  <span
                    className={`absolute h-3 w-px bg-current transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      expanded ? "scale-y-0" : "scale-y-100"
                    }`}
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
                    className={`max-w-2xl pr-10 pb-7 text-body ${
                      isDark ? "text-cream-muted" : "text-ink-muted"
                    }`}
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
