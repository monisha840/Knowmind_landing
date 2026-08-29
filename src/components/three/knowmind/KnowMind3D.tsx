"use client";

import dynamic from "next/dynamic";
import {
  Component,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useMediaQuery, usePointer, usePrefersReducedMotion } from "@/lib/hooks";
import { chapterAt, type Tier } from "./constants";
import { smoothstep } from "./math";
import { KnowMindFallback } from "./KnowMindFallback";
import { usePerformanceTier } from "./usePerformanceTier";
import { useScrollProgress } from "./useScrollProgress";
import { useWebGL2Support } from "./useWebGL2";

/**
 * KnowMind3D — the scroll-driven psychological triptych.
 *
 * A drop-in visual: give it a box and something to measure scroll against, and
 * it draws three identical sculptural profile heads whose internal thread
 * reorganises from a tangle, through an unravelling, into a clear spiral. It
 * owns its own geometry, animation, lighting, quality tier and failure
 * handling. The page owns its position, its size and its background.
 *
 * It is an *enhancement*. Text renders first, the flat fallback holds the
 * space next, and three.js only arrives once the section is close enough to
 * matter. If WebGL is missing or the GPU context is lost, the flat version
 * simply stays.
 */

const KnowMindCanvas = dynamic(
  () => import("./KnowMindCanvas").then((m) => m.KnowMindCanvas),
  { ssr: false },
);

export type KnowMind3DProps = {
  /**
   * The element whose scroll range drives the evolution — usually the tall
   * section the canvas is pinned inside. Progress runs 0 when its top meets
   * the top of the viewport to 1 when its bottom meets the bottom.
   */
  trackRef?: RefObject<HTMLElement | null>;
  /**
   * Drive it yourself instead. Setting this re-renders, so use it for coarse,
   * occasional control (a chapter index, a slider) rather than per-frame.
   */
  progress?: number;
  /**
   * Or hand over a ref you write at frame rate. Nothing re-renders and the
   * value is read once per frame inside the render loop. Preferred.
   */
  progressRef?: RefObject<number>;
  /** Force a quality tier instead of measuring the device. */
  quality?: Tier | "auto";
  /**
   * Where the head sits in a full-bleed canvas. `right` stands it beside a
   * column of copy and is ignored below 1024px, where there is no room to.
   */
  align?: "center" | "right";
  /**
   * Fade the whole visual out across this progress range, e.g. `[0.88, 1]`.
   *
   * Worth using at the end of a pinned section: the character finishes its
   * story, then dissolves before the pin releases, so it never shares the
   * screen with whatever the next section brings with it.
   */
  fade?: readonly [number, number];
  /**
   * An extra element to fade alongside the visual — the state rail beside the
   * head, typically, which has nothing to name once the sculpture has gone.
   */
  fadeRef?: RefObject<HTMLElement | null>;
  className?: string;
  /**
   * Describe the visual to assistive tech. Left off, the canvas is marked
   * decorative — which is correct whenever the surrounding HTML already says
   * what it says.
   */
  label?: string;
  /** Fires when the visitor crosses into a new state. At most twice a pass. */
  onChapterChange?: (state: 0 | 1 | 2) => void;
};

/* -------------------------------------------------------------------------- */

class CanvasBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { crashed: boolean }
> {
  state = { crashed: false };

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch() {
    // A decorative visual is never worth taking the page down for.
    this.props.onError();
  }

  render() {
    return this.state.crashed ? null : this.props.children;
  }
}

/* -------------------------------------------------------------------------- */

export function KnowMind3D({
  trackRef,
  progress,
  progressRef,
  quality = "auto",
  align = "center",
  fade,
  fadeRef,
  className = "",
  label,
  onChapterChange,
}: KnowMind3DProps) {
  const host = useRef<HTMLDivElement>(null);

  const webgl = useWebGL2Support();
  const tier = usePerformanceTier(quality);
  const reduced = usePrefersReducedMotion();
  const coarse = useMediaQuery("(pointer: coarse)");
  // Cursor lean is a desktop affordance. Phones get nothing but scroll.
  const pointer = usePointer(!reduced && !coarse);

  const [near, setNear] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  // Only so the flat stand-in can follow the scroll as well. Changes at most
  // twice per pass, which is cheap enough to be React state.
  const [state, setState] = useState<0 | 1 | 2>(0);

  /* -- progress ---------------------------------------------------------- */

  const controlled = typeof progress === "number";
  const chapter = useRef<0 | 1 | 2 | -1>(-1);
  const notify = useRef(onChapterChange);
  notify.current = onChapterChange;

  const fadeFrom = fade?.[0] ?? 1;
  const fadeTo = fade?.[1] ?? 1;
  const companion = useRef(fadeRef);
  companion.current = fadeRef;

  const settle = useCallback(
    (value: number) => {
      // The exit fade is a style write or two per scroll event — no layout is
      // read, no React state changes, and it costs nothing when `fade` is off.
      if (fadeTo > fadeFrom) {
        const opacity = String(1 - smoothstep(fadeFrom, fadeTo, value));
        if (host.current) host.current.style.opacity = opacity;
        if (companion.current?.current) companion.current.current.style.opacity = opacity;
      }

      const next = chapterAt(value);
      if (next === chapter.current) return;
      chapter.current = next;
      setState(next);
      notify.current?.(next);
    },
    [fadeFrom, fadeTo],
  );

  const owned = useScrollProgress(trackRef, settle, !controlled && !progressRef);
  const live = progressRef ?? owned;

  useEffect(() => {
    if (!controlled) return;
    live.current = progress as number;
    settle(progress as number);
  }, [controlled, progress, live, settle]);

  /* -- only pay for the canvas near the section -------------------------- */

  useEffect(() => {
    const el = host.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNear(true);
      setOnScreen(true);
      return;
    }

    // Mount early enough that three.js is parsed before the visitor arrives…
    const approach = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setNear(true),
      { rootMargin: "80% 0px" },
    );
    // …and render only while it is genuinely on screen.
    const presence = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { rootMargin: "5% 0px" },
    );

    approach.observe(el);
    presence.observe(el);
    return () => {
      approach.disconnect();
      presence.disconnect();
    };
  }, []);

  /* -- what to show ------------------------------------------------------ */

  const supported = webgl !== false && !failed;
  const canMount = supported && webgl === true && tier !== null && near;
  const showCanvas = canMount && ready;

  const a11y = label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true };

  // The two layers are stacked with grid rather than absolute positioning, so
  // this component never dictates its own `position`. The caller is free to
  // pass `absolute`, `sticky` or nothing at all and get what they asked for —
  // which a hard-coded `relative` would quietly win against, since Tailwind
  // emits `relative` after `absolute` and specificity is equal.
  //
  // The single `1fr` row and column are load-bearing, not decoration. Without
  // them the implicit track is `auto`, the grid area has no definite height,
  // and every percentage height below it — including the two that r3f uses to
  // size its own container — silently collapses. The canvas then measures
  // square instead of matching its box, and the character renders correctly
  // into a viewport that is the wrong shape.
  return (
    <div
      ref={host}
      className={`pointer-events-none grid grid-cols-1 grid-rows-1 ${className}`}
      {...a11y}
    >
      {/* Always present underneath: the page never has a hole in it. */}
      <div
        className="col-start-1 row-start-1 h-full w-full transition-opacity duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ opacity: showCanvas ? 0 : 1 }}
      >
        <KnowMindFallback
          state={state}
          align={align}
          variant={supported ? "loading" : "static"}
        />
      </div>

      {canMount && (
        <div
          className="col-start-1 row-start-1 h-full w-full transition-opacity duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ opacity: showCanvas ? 1 : 0 }}
        >
          <CanvasBoundary onError={() => setFailed(true)}>
            <KnowMindCanvas
              tier={tier}
              progressRef={live}
              pointer={pointer}
              reduced={reduced}
              align={align}
              active={onScreen}
              onReady={() => setReady(true)}
              onFail={() => setFailed(true)}
            />
          </CanvasBoundary>
        </div>
      )}
    </div>
  );
}
