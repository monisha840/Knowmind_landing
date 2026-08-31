"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { CTAButton } from "@/components/ui/CTAButton";
import { inr, programDetails } from "@/lib/config";

/**
 * The registration bar, pinned to the bottom of the viewport.
 *
 * With no navbar and no footer on the page, this is the only persistent path
 * to registration — so unlike the phone-only bar it replaces, it runs at every
 * breakpoint rather than disappearing from `sm` upward.
 *
 * Two rules govern when it shows, and both are about not competing with
 * something better:
 *
 *  · It stays down over the hero. The hero has its own full-size CTA in view
 *    there, and two primaries in one viewport is one too many.
 *  · It hides again over the registration card and the sign-up questions, so it
 *    never sits on top of the thing it points at — and never covers a field
 *    somebody is part-way through filling in.
 *
 * The old footer check is gone with the footer itself, which means the bar now
 * stays up through the final CTA at the end of the page. That is intended:
 * the last screen is the last chance to act, and there is no longer a footer
 * underneath it holding anything else.
 */
export function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const pastHero = window.scrollY > window.innerHeight * 0.9;

      const register = document.getElementById("register");
      const journey = document.getElementById("begin-journey");
      const overlapping = [register, journey].some((el) => {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
      });

      setVisible(pastHero && !overlapping);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: "120%" }}
          animate={{ y: 0 }}
          exit={{ y: "120%" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-cream/10 bg-night/92 backdrop-blur-xl"
        >
          {/* The gutter comes from `container-page`, so the bar lines up with
              the page's own margins instead of hugging the glass on a wide
              screen. The safe-area inset keeps it clear of the home indicator
              on a notched phone. */}
          <div className="container-page flex items-center gap-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:gap-8 sm:py-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-cream tabular-nums sm:text-base">
                {inr(programDetails.price)}
              </p>
              <p className="truncate text-xs text-cream-dim sm:text-sm">
                {programDetails.dateLabelShort} · {programDetails.seats} seats
              </p>
            </div>

            {/* One link, two labels. Rendering two buttons and hiding one would
                put a second, invisible CTA in the accessibility tree. */}
            <CTAButton size="md" className="ml-auto shrink-0">
              <span className="sm:hidden">Begin</span>
              <span className="hidden sm:inline">Begin Your 1% Journey</span>
            </CTAButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
