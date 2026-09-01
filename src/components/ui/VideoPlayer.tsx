"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A poster-first video the visitor chooses to play, with sound.
 *
 * Deliberately a separate component from `LazyVideo`, which is the opposite
 * kind of thing: that one is a muted, looping, autoplaying background plate
 * that is `aria-hidden` by default and has no controls at all. Bolting a
 * play-gate, an unmuted track and a controls bar onto it would have given one
 * component two contradictory contracts (CLAUDE.md §4.3 — extend a primitive
 * for a variant, not for a different job).
 *
 * The loading chain, in order:
 *
 *   1. `preload="none"` and **no `src` attribute at all** until the visitor
 *      presses play. `preload` is a hint a browser may ignore; a missing
 *      source is not. So a video below the fold costs the initial page load
 *      nothing — not a byte, not a connection.
 *   2. Pressing play sets the source, and an effect calls `play()` once React
 *      has committed it. The effect rather than the click handler because the
 *      element genuinely has no source to play until after that render.
 *   3. `play()` rejecting is not an error worth surfacing: the controls are
 *      showing by then, so the visitor can simply press play again.
 *
 * No autoplay anywhere in it, which is also why there is no reduced-motion
 * branch — nothing moves until it is asked to.
 *
 * The parent supplies the frame: give it `position: relative` and a definite
 * shape (an `aspect-ratio` box is what the VSL section uses), because both
 * layers here are absolutely positioned to fill it. `object-contain` then
 * guarantees the footage is never cropped even if the frame's declared ratio
 * and the file's real one disagree.
 */

export type VideoPlayerProps = {
  src: string;
  /** The frame shown before playback, and wherever the video cannot play. */
  poster: string;
  /** Describes the recording for anyone who cannot watch it. */
  label: string;
};

export function VideoPlayer({ src, poster, label }: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    void ref.current?.play().catch(() => {});
  }, [started]);

  return (
    <>
      <video
        ref={ref}
        poster={poster}
        src={started ? src : undefined}
        preload="none"
        playsInline
        controls={started}
        controlsList="nodownload"
        className="absolute inset-0 h-full w-full object-contain"
        /* Before play this is a still frame behind a button that already
           describes it; announcing and focusing it as well would put the same
           thing in the tab order twice. */
        {...(started ? { "aria-label": label } : { "aria-hidden": true, tabIndex: -1 })}
      />

      {!started && (
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="group absolute inset-0 grid place-items-center bg-night/30 transition-colors duration-300 hover:bg-night/10 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-honey"
        >
          <span className="sr-only">Play the video. {label}</span>
          <span
            aria-hidden
            className="grid h-16 w-16 place-items-center rounded-full bg-honey text-wine-950 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 sm:h-20 sm:w-20"
          >
            {/* Nudged right by a hair: a triangle is optically off-centre in a
                circle when it is mathematically centred. */}
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-7 w-7 sm:h-8 sm:w-8">
              <path d="M8 5.2v13.6L19 12 8 5.2Z" />
            </svg>
          </span>
        </button>
      )}
    </>
  );
}
