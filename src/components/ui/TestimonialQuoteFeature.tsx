"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type WrittenTestimonial = {
  readonly name: string;
  /** This person's own profession, from the corrections deck's slide 12. */
  readonly role: string;
  readonly quote: string;
};

type Props = {
  /** `readonly` because the content module is `as const` — this only reads it. */
  quotes: readonly WrittenTestimonial[];
  eyebrow: string;
  lead: string;
};

/**
 * Band 12's written half — "Voices of the Journey".
 *
 * One quote at a time, and it moves on by itself.
 *
 * ── Why this is not a grid any more ───────────────────────────────────────
 *
 * The written quotes used to be a three-up grid of cards, stacked on a phone.
 * Directly above them sits the featured participant recording. That put the
 * same argument on screen twice in the same shape, and on a 390px screen it
 * read as a player followed by a column of quote cards — roughly two more
 * viewports of scrolling before the band ended. Nothing was wrong with any
 * single card; the repetition was the problem.
 *
 * So the recording stays the visual proof and this becomes the read one: one
 * voice, set large, on the page's deep purple. Different medium, different
 * treatment, no second carousel wearing the first one's clothes (§4.3 — and
 * the deliberate opposite of `TestimonialFeature`, which is the video half and
 * is untouched).
 *
 * ── What advances it ──────────────────────────────────────────────────────
 *
 * The amber fill crossing the active segment of the rule *is* the timer. There
 * is no `setInterval` and no `setTimeout` in this file: the fill is a CSS
 * animation of `--voices-dur`, and its `animationend` is what moves to the next
 * quote. One mechanism, so the bar can never disagree with the content, and
 * pausing the bar pauses the carousel by construction.
 *
 * That buys three behaviours for free, all of them in `reference.css`:
 *
 *   hover / focus   `animation-play-state: paused` on `:hover` and
 *                   `:focus-within`, so reading or tabbing through holds it —
 *                   and it resumes from where it stopped rather than
 *                   restarting, which a timer could not do without tracking
 *                   elapsed time itself.
 *   off screen      `data-held` from the observer below does the same. Nothing
 *                   rotates in a section nobody is looking at (§15).
 *   reduced motion  the animation is cancelled, so no `animationend` ever
 *                   fires and the block simply never advances on its own. The
 *                   segments are still there to move through by hand (§11.1).
 *
 * ── Taking control ────────────────────────────────────────────────────────
 *
 * Any deliberate move — a segment, a swipe, an arrow key — sets `stopped` and
 * the rotation does not come back. Someone who has started steering does not
 * want the page steering too, and it is also this block's answer to WCAG 2.2.2:
 * there is a mechanism to stop the auto-updating content, and it is the same
 * control you would reach for anyway.
 *
 * `aria-live` is `off` while it is rotating on its own — a region that read a
 * new testimonial aloud every few seconds, unasked, would be hostile — and
 * becomes `polite` once `stopped`, at which point every change is something the
 * visitor just asked for and should hear about.
 *
 * Nothing reads `window` during render, so there is no hydration mismatch: the
 * server renders quote 1, held (the observer has not run yet), and the browser
 * hydrates exactly that (§20.4).
 */

/** Horizontal travel, in px, before a touch counts as a swipe rather than a tap. */
const SWIPE_MIN = 44;

const folio = (n: number) => String(n).padStart(2, "0");

export function TestimonialQuoteFeature({ quotes, eyebrow, lead }: Props) {
  /* Index and direction move together — two `useState` calls could tear and
     play the entrance the wrong way round on a fast double-tap. */
  const [{ index, dir }, setActive] = useState({ index: 0, dir: 1 });
  const [stopped, setStopped] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const total = quotes.length;

  const go = useCallback(
    (target: number, direction: 1 | -1) => {
      setActive({ index: ((target % total) + total) % total, dir: direction });
    },
    [total],
  );

  /** A move the visitor made, which ends the rotation for good. */
  const take = useCallback(
    (target: number, direction: 1 | -1) => {
      setStopped(true);
      go(target, direction);
    },
    [go],
  );

  /* ---- the rotation ---------------------------------------------------- */
  /* The fill finished crossing the active segment, so the quote it was
     measuring has had its time. Guarded on the fill's own class because
     `animationend` bubbles and this handler sits on the list. */
  const onFillEnd = (e: React.AnimationEvent<HTMLOListElement>) => {
    if (!(e.target as HTMLElement).classList.contains("voices-fill")) return;
    setActive((s) => ({ index: (s.index + 1) % total, dir: 1 }));
  };

  const shell = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = shell.current;
    if (!node) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      rootMargin: "0px",
    });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  /* ---- swipe ----------------------------------------------------------- */
  /* Touch and pen only. A mouse drag across a paragraph is a text selection,
     and stealing it would make the quote unquotable. */
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return;
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    /* Capture so the gesture still resolves if the finger leaves the stage. It
       does not block scrolling — `touch-action: pan-y` on `.voices-stage`
       governs that, and a native pan arrives here as `pointercancel`. */
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    drag.current = null;
    if (!start || start.id !== e.pointerId) return;

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    /* Horizontal-dominant, or it was a scroll that happened to drift. */
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) <= Math.abs(dy)) return;
    take(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  };

  const cancelDrag = () => {
    drag.current = null;
  };

  /* ---- keyboard -------------------------------------------------------- */
  /* Bubbles up from whichever segment has focus, so the arrow keys work
     wherever a visitor has landed inside the block — without making the block
     itself a tab stop that leads nowhere. */
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      take(index - 1, -1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      take(index + 1, 1);
    }
  };

  const active = quotes[index];

  return (
    <div
      className="voices"
      ref={shell}
      role="group"
      aria-roledescription="carousel"
      aria-label={eyebrow}
      /* Both are read by `reference.css`, which owns every pause condition. */
      data-autoplay={stopped ? "off" : "on"}
      data-held={onScreen ? undefined : "true"}
      onKeyDown={onKeyDown}
    >
      <div className="voices-head">
        <p className="voices-eyebrow">{eyebrow}</p>
        <p className="voices-lead">{lead}</p>
      </div>

      <div className="voices-body">
        <p className="voices-folio" aria-hidden>
          <span className="voices-folio-now">{folio(index + 1)}</span>
          <span className="voices-folio-sep">/</span>
          <span>{folio(total)}</span>
        </p>

        <div
          className="voices-stage"
          aria-live={stopped ? "polite" : "off"}
          aria-atomic="true"
          onPointerDown={onPointerDown}
          onPointerUp={endDrag}
          onPointerCancel={cancelDrag}
        >
          <figure className="voices-quote" key={index} data-dir={dir}>
            <p className="sr-only">
              Testimonial {index + 1} of {total}
            </p>
            {/* The five stars are the reference's, and every one of the six
                carries them. Nothing is rated here that was not already rated
                — see `refTestimonials.quotes` (CLAUDE.md §1.1). */}
            <p className="voices-stars" aria-label="Rated 5 out of 5">
              <span aria-hidden>★★★★★</span>
            </p>
            <blockquote className="voices-q">{active.quote}</blockquote>
            <figcaption className="voices-attr">
              <span className="voices-name">{active.name}</span>
              <span className="voices-role">{active.role}</span>
            </figcaption>
          </figure>
        </div>

        {/* The rule is the indicator, the timer and the only control. Each
            segment is a real button at a 44px target with its 2px hairline
            sitting inside it, so it carries `aria-current` as well — which is
            why the block needs neither dots nor a pair of arrow buttons. */}
        <ol className="voices-track" onAnimationEnd={onFillEnd}>
          {quotes.map((q, i) => (
            <li key={q.name}>
              <button
                type="button"
                className="voices-seg"
                aria-label={`Show testimonial ${i + 1} of ${total}: ${q.name}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => take(i, i < index ? -1 : 1)}
              >
                <span className="voices-rail" aria-hidden>
                  <span className="voices-fill" />
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
