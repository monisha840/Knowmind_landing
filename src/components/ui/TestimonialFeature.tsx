"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { refTestimonials } from "@/lib/reference-content";

/**
 * Band 12 — one participant at a time.
 *
 * This replaced a six-up grid of players. The argument for the change is that
 * six faces competing at once is a gallery, and a gallery is browsed; one face
 * with their story beside it is a testimony, and a testimony is read. The
 * others are present as names, not as five more video cards.
 *
 * ── One video, really one ─────────────────────────────────────────────────
 *
 * Only the selected person's `VideoPlayer` is mounted, and it is keyed by `src`
 * so selecting somebody else unmounts the previous one outright rather than
 * swapping its attributes. That is what actually releases the media element —
 * pausing a `<video>` leaves its buffer, its decoder and (on iOS) one of a very
 * small number of allowed media elements in hand. Five of the six are never
 * constructed at all.
 *
 * `VideoPlayer` is itself poster-first: `preload="none"` and no `src` until the
 * visitor presses play. So the band's cost at rest is one poster image, and the
 * other five posters are `<img loading="lazy">` in the selector, which is what
 * a browser is already good at (CLAUDE.md §14.2).
 *
 * ── The empty story ───────────────────────────────────────────────────────
 *
 * `story` is `null` for all six today, and the panel is skipped rather than
 * filled. These people have a name, a role and a recording in this repository
 * and nothing else; the quotes elsewhere on the page belong to six different
 * participants. Writing eighteen Before/Realization/After lines would be
 * inventing testimony (CLAUDE.md §0.4). The layout holds without it, and one
 * real paragraph in `reference-content` lights the panel up.
 */

const { feature } = refTestimonials;

type Story = {
  quote?: string;
  before: string;
  realization: string;
  after: string;
};

export type FeatureVideo = {
  src: string;
  poster: string;
  name: string;
  role: string;
  story?: Story | null;
};

type Props = { videos: readonly FeatureVideo[] };

const pad = (n: number) => String(n).padStart(2, "0");

/** Below this, a horizontal drag counts as a swipe rather than a scroll. */
const SWIPE_PX = 48;

/** How long each person holds the frame before the next one takes it. */
/* The cadence lives in `--tf-dur` in reference.css, beside the Voices band's. */

export function TestimonialFeature({ videos }: Props) {
  const [index, setIndex] = useState(0);
  /* Hover and focus pause the fill in CSS. These two cannot be expressed as a
     selector, so they ride on data attributes the stylesheet reads. */
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(false);
  const reduced = usePrefersReducedMotion();
  const baseId = useId();
  const stageRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number; lastX: number; lastY: number } | null>(null);

  const total = videos.length;
  const active = videos[index];

  /* Wraps. With the Previous/Next buttons gone there is no "end" to stop at —
     the band cycles, and a swipe or an arrow key off either edge comes round
     rather than doing nothing. */
  const go = useCallback(
    (next: number) => {
      setIndex(((next % total) + total) % total);
    },
    [total],
  );

  /* Arrow keys move between people while the focus is inside the band. Left and
     right only — up and down belong to the page's own scrolling. */
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    }
  };

  /* Swipe. Compared against the vertical delta so a diagonal scroll is not
     stolen from the page (CLAUDE.md §11 — never hijack scroll).

     The end position is tracked on every move rather than read out of
     `changedTouches` at the end. Both work in a real browser, but the tracked
     value is the one that survives a synthetic touch sequence and a cancelled
     gesture, where `changedTouches` can arrive empty and the swipe silently
     does nothing. */
  const onTouchStart = (event: React.TouchEvent) => {
    const t = event.touches[0];
    if (!t) return;
    touch.current = { x: t.clientX, y: t.clientY, lastX: t.clientX, lastY: t.clientY };
  };

  const onTouchMove = (event: React.TouchEvent) => {
    const t = event.touches[0];
    if (!t || !touch.current) return;
    touch.current.lastX = t.clientX;
    touch.current.lastY = t.clientY;
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const t = event.changedTouches[0];
    const endX = t ? t.clientX : start.lastX;
    const endY = t ? t.clientY : start.lastY;
    const dx = endX - start.x;
    const dy = endY - start.y;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return;
    go(dx < 0 ? index + 1 : index - 1);
  };

  /* The amber fill crossing the active name *is* the clock.
   *
   * There is no `setTimeout` here any more. The fill is a CSS animation of
   * `--tf-dur` and its `animationend` is what moves to the next person, which
   * is the same mechanism the Voices band uses — so the two sections of this
   * page advance identically rather than by two clocks that could disagree.
   *
   * It also buys the behaviour a timer could not have without tracking elapsed
   * time itself: hovering pauses the animation and it *resumes where it
   * stopped* rather than restarting the person's seven seconds.
   *
   * `animationend` bubbles, so this sits on the list and checks the target.
   */
  const onFillEnd = (event: React.AnimationEvent<HTMLUListElement>) => {
    if (!(event.target as HTMLElement).classList.contains("tf-fill")) return;
    go(index + 1);
  };

  /* Off screen it should not be quietly cycling through six people. */
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    /* No threshold — any part on screen counts, the same as the Voices band.
       A quarter of a 650px section is a lot to ask of a 608px phone. */
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: "0px",
    });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  /* Re-run the entrance on every change, so the swap reads as a change rather
     than a redraw. Held to one class toggle — no library, no layout animation,
     and nothing at all under reduced motion. */
  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    if (reduced) {
      node.classList.remove("tf-enter");
      return;
    }
    node.classList.remove("tf-enter");
    // Reading `offsetWidth` restarts the animation; without it the class is
    // removed and re-added inside one frame and nothing replays.
    void node.offsetWidth;
    node.classList.add("tf-enter");
  }, [index, reduced]);

  const story = active.story ?? null;

  return (
    <div
      ref={rootRef}
      className="tf"
      /* Hover and focus are handled in CSS (`:hover`, `:focus-within`), the
         same as the Voices band. These two are the states CSS cannot see:
         off screen, and a recording actually playing. A video mid-play must
         never be advanced away from. */
      data-autoplay={reduced ? "off" : "on"}
      data-held={!visible || playing ? "true" : undefined}
      onPlayCapture={() => setPlaying(true)}
      onPauseCapture={() => setPlaying(false)}
      onEndedCapture={() => setPlaying(false)}
      /* Drives the layout. With a story there are two columns, the recording
         beside the words; without one there is nothing to put in the second
         column, so the band centres instead of leaving half of itself empty.
         It flips per person, so filling in one story changes only that one. */
      data-has-story={story ? "true" : "false"}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="tf-stage" ref={stageRef}>
        {/* ---- the featured recording ---- */}
        <div className="tf-media">
          <div className="tf-frame">
            {/* Keyed by src: selecting somebody else unmounts this player
                rather than re-pointing it, which is what releases the media
                element instead of leaving it paused and loaded. */}
            <VideoPlayer
              key={active.src}
              src={active.src}
              poster={active.poster}
              label={`${active.name}, ${active.role}, on the 1% Better programme.`}
            />
          </div>
        </div>

        {/* ---- the story, when there is one ---- */}
        <div className="tf-detail">
          <p className="tf-count" aria-hidden>
            {pad(index + 1)} <span>/</span> {pad(total)}
          </p>

          <h3 className="tf-name">{active.name}</h3>
          <p className="tf-role">{active.role}</p>

          {story?.quote && <blockquote className="tf-quote">{story.quote}</blockquote>}

          {story ? (
            <ol className="tf-stages">
              {(
                [
                  ["before", feature.stages.before, story.before],
                  ["realization", feature.stages.realization, story.realization],
                  ["after", feature.stages.after, story.after],
                ] as const
              ).map(([key, label, text]) => (
                <li className={`tf-stage-item tf-${key}`} key={key}>
                  <span className="tf-stage-label">{label}</span>
                  <p className="tf-stage-text">{text}</p>
                </li>
              ))}
            </ol>
          ) : (
            /* An honest empty state rather than a blank column: the recording
               is the testimony until somebody writes the words down
               (CLAUDE.md §9.2). */
            <p className="tf-nostory">{feature.watchPrompt}</p>
          )}
        </div>
      </div>

      {/* ---- who else ---- */}
      {/* Who else. The names are the only control now — the Previous/Next
          buttons are gone at the owner's request, and the band advances on its
          own. Choosing somebody here restarts the clock rather than fighting
          it (see the advance effect). */}
      <div className="tf-controls">
        <ul className="tf-picker" aria-label="Choose a participant" onAnimationEnd={onFillEnd}>
          {videos.map((video, i) => (
            <li key={video.src}>
              <button
                type="button"
                className={`tf-pick${i === index ? " is-active" : ""}`}
                onClick={() => go(i)}
                aria-current={i === index ? "true" : undefined}
                aria-controls={`${baseId}-stage`}
              >
                <span className="tf-pick-face">
                  {/* Decorative: the name beside it is the label. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={video.poster} alt="" width={96} height={96} loading="lazy" />
                </span>
                <span className="tf-pick-name">{video.name}</span>
                {/* The rail is the indicator; the amber inside it is the clock.
                    It only animates under the active name — see `.tf-fill`. */}
                <span className="tf-rail" aria-hidden>
                  <span className="tf-fill" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* The change is visual for everybody else; this is how it reaches a
          screen reader without moving focus (CLAUDE.md §13.2). */}
      <p className="sr-only" role="status" aria-live="polite" id={`${baseId}-stage`}>
        {feature.nowShowing}: {active.name}, {active.role}. {pad(index + 1)} of {pad(total)}.
      </p>
    </div>
  );
}
