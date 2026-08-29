"use client";

import { type RefObject, useEffect, useRef } from "react";

import { clamp01 } from "./math";

/**
 * Normalised progress through a scroll track, written to a ref.
 *
 * No React state is involved, so scrolling never re-renders anything — the
 * value is read once per frame inside the render loop.
 *
 * The track's offset and height are measured only on mount, on resize and
 * whenever the element itself changes size (ResizeObserver). Everything the
 * scroll handler does after that is arithmetic on `window.scrollY`, so it
 * never forces a layout mid-scroll.
 *
 * Progress is measured immediately on mount, which means a refresh halfway
 * down the section starts the character halfway through its evolution rather
 * than snapping back to the tangle.
 */
export function useScrollProgress(
  trackRef?: RefObject<HTMLElement | null>,
  onSettle?: (progress: number) => void,
  /** Off when the caller drives progress itself — no listeners are attached. */
  enabled = true,
): RefObject<number> {
  const progress = useRef(0);
  const settle = useRef(onSettle);
  settle.current = onSettle;

  useEffect(() => {
    if (!enabled) return;
    const el = trackRef?.current ?? null;
    let top = 0;
    let height = 0;

    const measure = () => {
      if (el) {
        const rect = el.getBoundingClientRect();
        top = rect.top + window.scrollY;
        height = rect.height;
      } else {
        top = 0;
        height = document.documentElement.scrollHeight;
      }
    };

    const update = () => {
      const span = Math.max(height - window.innerHeight, 1);
      const next = clamp01((window.scrollY - top) / span);
      progress.current = next;
      settle.current?.(next);
    };

    const remeasure = () => {
      measure();
      update();
    };

    remeasure();

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", remeasure, { passive: true });
    window.addEventListener("orientationchange", remeasure, { passive: true });

    let observer: ResizeObserver | undefined;
    if (el && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(remeasure);
      observer.observe(el);
    }

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("orientationchange", remeasure);
      observer?.disconnect();
    };
  }, [trackRef, enabled]);

  return progress;
}
