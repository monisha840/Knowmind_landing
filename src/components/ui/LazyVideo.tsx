"use client";

import { useEffect, useRef, useState } from "react";

import { useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";

/**
 * A silent, looping background video that costs nothing until it is nearly on
 * screen.
 *
 * Built for decorative footage sitting where an image used to sit: give it a
 * positioned box with a definite size and it fills it exactly the way
 * `next/image` with `fill` did, so swapping one for the other cannot shift the
 * page. It draws the poster immediately and the video only once the visitor is
 * close enough for it to matter.
 *
 * The loading chain, in order:
 *
 *   1. `preload="none"` and **no `src` attribute at all**. `preload` is a hint
 *      a browser may ignore; a missing source is not. Until the observer
 *      fires, this element cannot make a network request, so a video far below
 *      the fold costs the initial load nothing.
 *   2. An IntersectionObserver with a generous margin sets the source when the
 *      box is within roughly a screen of the viewport — early enough that the
 *      first frames are usually buffered by the time it is looked at.
 *   3. A second, tighter observer plays it on screen and pauses it off screen,
 *      so it is never decoding frames nobody is watching. This one keeps
 *      running: scrolling back up resumes it.
 *
 * `muted` is set as a DOM property in an effect as well as an attribute.
 * React renders `muted` to the DOM property, and a few browsers have shipped
 * versions where the attribute alone does not survive hydration — an unmuted
 * autoplay is both blocked by every autoplay policy and, if it did play, a
 * page that starts making noise on its own.
 *
 * If autoplay is refused anyway, `play()` rejects, nothing is thrown, and the
 * poster stays. That is the whole failure path: a still frame where the video
 * would have been, never a broken element and never a control the design did
 * not ask for.
 */

export type LazyVideoProps = {
  src: string;
  /** Shown before the video loads, and wherever it cannot play. */
  poster: string;
  /**
   * Object-position for both the video and its poster — they crop identically,
   * so one value covers both.
   */
  className?: string;
  /**
   * Classes for a second copy of the same file painted behind the first.
   *
   * For the case where the box and the footage disagree about shape. A
   * landscape video in a portrait column can be `cover` — filling the box and
   * throwing most of the frame away — or `contain`, which keeps the whole frame
   * and leaves bars. This gives a third option: the foreground contains, and a
   * blurred, over-scaled copy covers the box behind it, so the bars are filled
   * with the footage's own colour instead of a flat band.
   *
   * Both elements point at one URL, so it is one download and one cache entry
   * — verified by request count, not assumed.
   */
  backdropClassName?: string;
  /**
   * Media query deciding when the backdrop is worth its second decoder. Left
   * off, there is no backdrop at all.
   */
  backdropQuery?: string;
  /**
   * Describe the footage only if it carries meaning the page does not already
   * say. Left off, it is marked decorative and taken out of the tab order,
   * which is what a background loop should be.
   */
  label?: string;
};

export function LazyVideo({
  src,
  poster,
  className = "",
  backdropClassName,
  backdropQuery = "(min-width: 0px)",
  label,
}: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const backdrop = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);
  const reduced = usePrefersReducedMotion();

  /*
   * Gated in JavaScript rather than with `hidden md:block`, deliberately.
   *
   * A `display: none` video still holds a source and, in several engines, still
   * decodes — so hiding it in CSS would hand every phone a second 1280x720
   * decoder to run behind a layer it can never see. Not creating the element is
   * the only version of "off" that is actually off.
   *
   * `useMediaQuery` reports false during SSR and for the first client render,
   * so the backdrop arrives a frame after hydration. It is a blurred wash
   * behind a video that is itself still loading; nothing about that frame is
   * visible.
   */
  const wantsBackdrop = useMediaQuery(backdropQuery) && Boolean(backdropClassName);

  /* -- 1 & 2 · don't fetch until it is nearly in view --------------------- */

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setLoad(true);
      return;
    }

    const approach = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setLoad(true);
        approach.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    approach.observe(el);
    return () => approach.disconnect();
  }, []);

  /* -- 3 · play on screen, pause off it ----------------------------------- */

  useEffect(() => {
    const el = ref.current;
    if (!el || !load) return;

    // Both layers, wherever there are two. They are the same ten seconds of
    // footage started at the same moment, so they stay in step on their own —
    // and at this blur radius they could drift a second apart unnoticed.
    const layers = [el, backdrop.current].filter(Boolean) as HTMLVideoElement[];

    // Belt and braces against an unmuted autoplay; see the note above.
    for (const v of layers) v.muted = true;

    // Someone who has asked for less motion gets the poster and nothing else.
    // The rest of the page already works this way — the marquee stops, the
    // metrics jump to their final value, both 3D scenes hold still (§11.1).
    if (reduced) {
      for (const v of layers) v.pause();
      return;
    }

    // Rejects when an autoplay policy refuses, which is not an error worth
    // surfacing: the poster is already showing the same frame.
    const start = () => {
      for (const v of layers) void v.play().catch(() => {});
    };

    if (typeof IntersectionObserver === "undefined") {
      start();
      return;
    }

    const presence = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
        else for (const v of layers) v.pause();
      },
      { rootMargin: "10% 0px" },
    );
    presence.observe(el);
    return () => presence.disconnect();
  }, [load, reduced, wantsBackdrop]);

  const a11y = label
    ? { "aria-label": label, role: "img" as const }
    : { "aria-hidden": true, tabIndex: -1 };

  /** Everything both layers share. `src` is assigned only once the observer
      says so — see the note above on why this is a missing attribute rather
      than a `preload` hint. */
  const common = {
    src: load ? src : undefined,
    poster,
    muted: true,
    loop: true,
    playsInline: true,
    preload: "none" as const,
    // Chrome and Safari both keep a picture-in-picture affordance and a media
    // download entry on a plain video; neither belongs on a background loop.
    disablePictureInPicture: true,
    disableRemotePlayback: true,
    controlsList: "nodownload noplaybackrate noremoteplayback",
  };

  return (
    <>
      {wantsBackdrop && (
        <video ref={backdrop} {...common} className={backdropClassName} aria-hidden tabIndex={-1} />
      )}
      <video ref={ref} {...common} className={className} {...a11y} />
    </>
  );
}
