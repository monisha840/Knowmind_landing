"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { CTAButton } from "@/components/ui/CTAButton";
import { inr, programDetails } from "@/lib/config";

/**
 * Phone-only registration bar.
 *
 * Appears once the hero has been passed and hides again over the registration
 * card and the footer, so it never sits on top of the thing it points at.
 */
export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const pastHero = window.scrollY > window.innerHeight * 0.9;

      const register = document.getElementById("register");
      const footer = document.querySelector("footer");
      const overlapping = [register, footer].some((el) => {
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
          className="fixed inset-x-0 bottom-0 z-40 border-t border-cream/10 bg-night/92 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:hidden"
        >
          <div className="flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-cream tabular-nums">
                {inr(programDetails.price)}
              </p>
              <p className="truncate text-xs text-cream-dim">
                {programDetails.dateLabelShort} · {programDetails.seats} seats
              </p>
            </div>

            <CTAButton size="md" className="ml-auto shrink-0">
              Begin
            </CTAButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
