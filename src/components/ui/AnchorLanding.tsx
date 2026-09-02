"use client";

import { useEffect } from "react";

/**
 * Keeps an anchor landing exact.
 *
 * A click from the top of the page starts a smooth scroll of some twenty
 * thousand pixels that takes well over a second. Content above the target is
 * still settling while that runs — measured at 320px, the document grew 26px
 * mid-flight — and the browser is scrolling to where the target *was*. It never
 * re-checks, so the section comes to rest short of the top of the screen.
 *
 * So this waits for the scroll to stop and, if the target is off by more than a
 * pixel from where `scroll-padding-top` says it belongs, closes the gap. That
 * finishes the navigation rather than taking it over: the correction is
 * abandoned the moment somebody touches the wheel, the screen or the keyboard,
 * because a page that yanks itself out from under a reader is worse than one
 * that lands a few pixels low.
 *
 * Rendered once, by the section it belongs to. It draws nothing.
 */
export function AnchorLanding({ target }: { target: string }) {
  useEffect(() => {
    const hash = `#${target}`;
    let frame = 0;
    let cancelled = false;

    const stop = () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };

    const align = () => {
      cancelled = false;
      cancelAnimationFrame(frame);

      let last = Number.NaN;
      let steady = 0;

      const step = () => {
        if (cancelled) return;
        const y = Math.round(window.scrollY);
        steady = y === last ? steady + 1 : 0;
        last = y;

        // Six still frames is the scroll having genuinely finished, not a
        // momentary plateau in the easing.
        if (steady < 6) {
          frame = requestAnimationFrame(step);
          return;
        }

        const el = document.getElementById(target);
        if (!el) return;

        /* Where the browser would have put it: `scroll-padding-top` on the
           scrolling element, which is what clears the pinned bar — 96px at
           desktop, 120px under 700px where the bar wraps to two rows. Closing
           to a bare 0 instead is what this used to do, and it undid the very
           clearance it was written to protect: the browser landed the section
           correctly and this then pulled it up under the bar, by 64px at 1440,
           98px at 390 and 131px at 320. `auto` computes to a length here; the
           `|| 0` covers a UA that leaves it as a keyword. */
        const clearance = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
        const off = el.getBoundingClientRect().top - clearance;
        if (Math.abs(off) > 1) window.scrollBy({ top: off, behavior: "auto" });
      };

      frame = requestAnimationFrame(step);
    };

    /* `hashchange` covers arriving from a different hash. It does not fire when
       the hash is already this one, so clicks are watched too — otherwise a
       second CTA press from further down the page would go uncorrected. */
    const onHashChange = () => {
      if (window.location.hash === hash) align();
    };
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('a[href]');
      if (link && link.getAttribute("href") === hash) align();
    };

    window.addEventListener("hashchange", onHashChange);
    document.addEventListener("click", onClick, true);
    for (const event of ["wheel", "touchstart", "keydown"] as const) {
      window.addEventListener(event, stop, { passive: true });
    }

    // Landing straight on the anchor — a shared link, or a reload.
    if (window.location.hash === hash) align();

    return () => {
      stop();
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onClick, true);
      for (const event of ["wheel", "touchstart", "keydown"] as const) {
        window.removeEventListener(event, stop);
      }
    };
  }, [target]);

  return null;
}
