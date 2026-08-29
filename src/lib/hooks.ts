"use client";

import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/* -------------------------------------------------------------------------- */
/*  Media queries (SSR-safe via useSyncExternalStore)                          */
/* -------------------------------------------------------------------------- */

/**
 * Matches a media query without a hydration mismatch — the server and the
 * first client render both return `false`, then the real value settles.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** Coarse pointer or narrow viewport — used to shed 3D work on phones. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/* -------------------------------------------------------------------------- */
/*  WebGL capability probe                                                     */
/* -------------------------------------------------------------------------- */

let webglSupport: boolean | null = null;

function detectWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    webglSupport = Boolean(gl);
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

/**
 * `null` while probing, then true/false. Lets the caller render the premium
 * 2D fallback instead of an empty hole when WebGL is unavailable.
 */
export function useWebGLSupport(): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => setSupported(detectWebGL()), []);
  return supported;
}

/* -------------------------------------------------------------------------- */
/*  Count-up                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Eases a number from 0 to `target` once `active` becomes true.
 * Returns the target immediately when motion is reduced.
 */
export function useCountUp(target: number, active: boolean, durationMs = 1150) {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(0);
  const frame = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      setValue(target);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      // easeOutExpo — fast to settle, no long tail.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setValue(target * eased);
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    };
  }, [target, active, durationMs, reduced]);

  return value;
}

/* -------------------------------------------------------------------------- */
/*  Pointer position, normalised to -1..1 around the viewport centre           */
/* -------------------------------------------------------------------------- */

export type Pointer = { x: number; y: number };

export function usePointer(enabled = true): RefObject<Pointer> {
  const pointer = useRef<Pointer>({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled]);

  return pointer;
}

/* -------------------------------------------------------------------------- */
/*  Whole-document scroll progress, 0 → 1, written to a ref (no re-renders)    */
/* -------------------------------------------------------------------------- */

export function useDocumentScrollRef(): RefObject<number> {
  const progress = useRef(0);

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.current = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return progress;
}
