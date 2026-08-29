"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";

import {
  useIsMobile,
  usePointer,
  usePrefersReducedMotion,
  useWebGLSupport,
} from "@/lib/hooks";
import { Fallback2D } from "./Fallback2D";
import { GrowthObject } from "./GrowthObject";

/**
 * The persistent 3D background.
 *
 * It lives behind the whole page but only *renders* while a section that
 * actually shows it is on screen. Sections opt in with `data-three-window`;
 * everywhere else the render loop is parked, which keeps the GPU idle through
 * the long light-toned middle of the page.
 */
export function Background3D() {
  const webgl = useWebGLSupport();
  const isMobile = useIsMobile();
  const reduced = usePrefersReducedMotion();
  const pointer = usePointer(!reduced && !isMobile);

  const scrollRef = useRef(0);
  const dawnRef = useRef(0);
  const [visible, setVisible] = useState(true);

  /* -- scroll progress + night→dawn warmth ------------------------------- */
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
      scrollRef.current = p;
      // Warmth ramps across the first two-thirds, then holds — the page has
      // fully "risen" by the time the offer arrives.
      dawnRef.current = Math.min(Math.max((p - 0.04) / 0.58, 0), 1);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  /* -- only run the loop where the object is actually visible ------------ */
  useEffect(() => {
    const windows = Array.from(document.querySelectorAll("[data-three-window]"));
    if (windows.length === 0) return; // no opt-ins: stay on

    const onScreen = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) onScreen.add(entry.target);
          else onScreen.delete(entry.target);
        }
        setVisible(onScreen.size > 0);
      },
      { rootMargin: "10% 0px" },
    );

    windows.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Probing — render nothing rather than flash the wrong thing.
  if (webgl === null) return <div className="fixed inset-0 -z-10" aria-hidden />;

  if (!webgl) {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <Fallback2D />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <Canvas
        // Reduced motion still gets the object — just held still.
        frameloop={reduced ? "demand" : visible ? "always" : "never"}
        dpr={[1, isMobile ? 1.1 : 1.5]}
        camera={{ position: [0, 0, 9], fov: 42 }}
        gl={{
          antialias: !isMobile,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ pointerEvents: "none" }}
      >
        <GrowthObject
          pointer={pointer}
          scrollRef={scrollRef}
          dawnRef={dawnRef}
          isMobile={isMobile}
          reduced={reduced}
        />
      </Canvas>
    </div>
  );
}
