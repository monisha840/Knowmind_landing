"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import { usePrefersReducedMotion } from "@/lib/hooks";
import type { RefReelPhoto } from "@/lib/reference-content";

/**
 * One row of the journey reel — a strip of photographs drifting sideways.
 *
 * ── The mechanism, and why it is not the marquee's ────────────────────────
 *
 * `LogoMarquee` translates a `max-content` track with a CSS keyframe. That is
 * the right answer for the logo strips, which nobody is expected to touch. It
 * is the wrong answer here, because this band has to be draggable: a transform
 * and a native scroll are two independent offsets, so a row that is both
 * animated and swipeable ends up somewhere neither of them meant.
 *
 * So the row is a real horizontal scroll container and the drift is written to
 * `scrollLeft`, one value, from a single `requestAnimationFrame` loop. Every
 * behaviour the band needs then falls out of that one decision rather than
 * being built:
 *
 *   · swipe and drag        — native touch scrolling, momentum included
 *   · keyboard              — a focusable scroll container answers the arrow
 *                             keys on its own; no key handler is written here
 *   · no page-level sideways scroll — `overscroll-behavior-x: contain` in
 *                             `reference.css` stops the gesture chaining out to
 *                             the document (and to the browser's back swipe)
 *   · reduced motion        — the loop simply never starts, and what is left is
 *                             a scroll container the visitor moves by hand.
 *                             The photographs are never hidden (CLAUDE.md §11.1)
 *
 * Nothing here goes through React state. `scrollLeft` is written from a ref
 * inside the frame, so a drifting row costs zero re-renders (CLAUDE.md §15).
 *
 * ── The seamless loop ─────────────────────────────────────────────────────
 *
 * The photographs are laid out `COPIES` times end to end, and `pos` is kept
 * inside `[0, seq)` — one sequence width — by a modulo every frame. Because the
 * content repeats exactly every `seq` pixels, subtracting `seq` from the scroll
 * position moves the row a whole period and lands on identical pixels: there is
 * nothing to see at the wrap, in either direction.
 *
 * Holding `pos` under one sequence also means there are always `COPIES - 1`
 * sequences of content to the right of the viewport, which is what stops the
 * row running out of track. That is the constraint `COPIES` exists to satisfy:
 * two spare copies cover any viewport up to twice a sequence — about 2,800px
 * with the seven photographs this band carries — and the `span > seq` guard
 * below holds the row still rather than stuttering if it is ever exceeded.
 *
 * Only the first copy is announced. The other two are `aria-hidden`, exactly as
 * the logo marquee's seam copy is, so a screen reader reads seven photographs
 * and not twenty-one.
 */

/** Sequences laid end to end inside the track. See the note above. */
const COPIES = 3;

/**
 * How long the row stays out of the way after the visitor touches it.
 *
 * Long enough that iOS momentum has finished — resuming into a live fling
 * means fighting it, and the row jitters. It is generous on purpose: this is a
 * decorative strip, and a visitor who is holding it wants it held.
 */
const RESUME_MS = 1400;

/**
 * A scroll position we did not write is the visitor's. The threshold only has
 * to clear the browser's own rounding of `scrollLeft`, which is sub-pixel.
 */
const USER_SCROLL_EPSILON = 2;

type PhotoReelProps = {
  photos: readonly RefReelPhoto[];
  /** Names the row for assistive technology and for anyone who tabs into it. */
  label: string;
  /** Which way the photographs travel. Row 1 goes left, row 2 goes right. */
  direction: "left" | "right";
  /** Drift in CSS pixels per second. Cinematic is ~20; this is not a marquee. */
  speed: number;
};

export function PhotoReel({ photos, label, direction, speed }: PhotoReelProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const row = rowRef.current;
    const copy = copyRef.current;
    if (!row || !copy) return;
    /* The row stays a hand-scrollable strip; it just never moves on its own. */
    if (reduced) return;

    /* One sequence's width, measured on mount and again whenever the layout
       changes — never inside the frame loop, and never inside a scroll handler
       (CLAUDE.md §15). It is correct before a single photograph has loaded,
       because every one of them carries its own width and height, so the boxes
       are sized from the aspect ratio rather than from the decoded pixels. */
    let seq = copy.offsetWidth;
    const measure = () => {
      seq = copy.offsetWidth;
    };
    const resize = new ResizeObserver(measure);
    resize.observe(copy);

    /* Effect-local rather than a ref on the component: nothing outside this
       loop reads it, and pausing on hover must not re-render 21 images. */
    let hovering = false;
    let pos = row.scrollLeft;
    /* What the browser actually took the last time we wrote. Compared against
       rather than `pos` itself so that a clamped or rounded write is not
       mistaken for the visitor scrolling — which would pause the row forever. */
    let written = pos;
    let userUntil = 0;

    const nudge = () => {
      userUntil = performance.now() + RESUME_MS;
    };
    /* Listening to `scroll` rather than only to the gestures that start one is
       what catches iOS momentum, a trackpad's inertia and the arrow keys — all
       of which move the row without a pointer being down. */
    const onScroll = () => {
      if (Math.abs(row.scrollLeft - written) > USER_SCROLL_EPSILON) nudge();
    };

    /* Hover pauses — but only a real mouse. A touch fires `pointerenter` too,
       and often never fires the matching `pointerleave`, which would leave a
       phone's row paused for the rest of the visit.

       Native listeners rather than React's `onPointerEnter`. `pointerenter`
       does not bubble, so React synthesises it at the root from `pointerover`
       and `pointerout` — which works, but puts this one behaviour on a
       different mechanism from the other four listeners here, and made it the
       only part of the row that could not be exercised directly. On the
       element it is the browser's own enter/leave: fired once when the pointer
       crosses into the row, not again as it moves between photographs. */
    const enter = (event: PointerEvent) => {
      if (event.pointerType === "mouse") hovering = true;
    };
    const leave = (event: PointerEvent) => {
      if (event.pointerType === "mouse") hovering = false;
    };

    row.addEventListener("pointerenter", enter, { passive: true });
    row.addEventListener("pointerleave", leave, { passive: true });
    row.addEventListener("pointerdown", nudge, { passive: true });
    row.addEventListener("touchstart", nudge, { passive: true });
    row.addEventListener("wheel", nudge, { passive: true });
    row.addEventListener("scroll", onScroll, { passive: true });

    /* Parked while off screen, like every other loop on this page. */
    let onScreen = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
      },
      { rootMargin: "10% 0px" },
    );
    io.observe(row);

    const sign = direction === "left" ? 1 : -1;
    let frame = 0;
    let last = 0;

    const step = (now: number) => {
      frame = requestAnimationFrame(step);
      /* Capped so a backgrounded tab does not return and jump the row a
         second's worth of pixels in one frame. */
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;

      if (!seq) {
        measure();
        return;
      }
      /* Off screen, hovered, or the visitor is still working the row: follow
         where they left it rather than writing over them. */
      if (!onScreen || hovering || now < userUntil) {
        pos = row.scrollLeft;
        written = pos;
        return;
      }
      /* Wider than the track can cover. Impossible at any real viewport with
         seven photographs, but wrapping here would clamp against the end of
         the track and stutter, so the row holds still instead. */
      if (row.scrollWidth - row.clientWidth <= seq) return;

      pos += sign * speed * dt;
      /* The wrap. Modulo rather than a comparison so a position left far out
         of range by a long swipe is brought back in one step — and always by a
         whole multiple of `seq`, which is to say invisibly. */
      pos = ((pos % seq) + seq) % seq;
      row.scrollLeft = pos;
      written = row.scrollLeft;
    };

    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      io.disconnect();
      row.removeEventListener("pointerenter", enter);
      row.removeEventListener("pointerleave", leave);
      row.removeEventListener("pointerdown", nudge);
      row.removeEventListener("touchstart", nudge);
      row.removeEventListener("wheel", nudge);
      row.removeEventListener("scroll", onScroll);
    };
  }, [direction, speed, reduced]);

  return (
    <div
      ref={rowRef}
      className="reel-row"
      /* A horizontal scroll container with a name, and reachable by keyboard:
         the arrow keys move it once it has focus, which is the whole of the
         keyboard story here. Deliberately not a button, a listbox or anything
         else that would promise an interaction this strip does not have. */
      role="group"
      aria-label={label}
      tabIndex={0}
    >
      <div className="reel-track">
        {Array.from({ length: COPIES }, (_, copy) => (
          <div
            className="reel-copy"
            key={copy}
            ref={copy === 0 ? copyRef : undefined}
            aria-hidden={copy > 0}
          >
            {photos.map((photo, index) => (
              <div className="reel-item" key={`${copy}-${index}-${photo.src}`}>
                {/*
                  Sized by height in CSS with the width left to follow the
                  file's own ratio, so nothing is cropped and no face is cut —
                  `object-fit` never has a mismatch to resolve. The width and
                  height here are what let the box exist at the right size
                  before the picture arrives, which is what keeps the loop's
                  measurement stable and the band free of layout shift.

                  `sizes` is what stops a phone downloading the 840px master
                  for a 190px slot. Every copy of every row asks for the same
                  seven URLs, so the band costs seven files however many
                  elements are on screen.

                  Lazy by default — this band is a long way below the fold and
                  nothing here may compete with the hero (CLAUDE.md §14.1).
                */}
                <Image
                  src={photo.src}
                  alt={copy === 0 ? photo.alt : ""}
                  width={photo.width}
                  height={photo.height}
                  sizes="(min-width: 700px) 250px, 220px"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
