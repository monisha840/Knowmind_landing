import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { vsl } from "@/lib/content";
import { refVsl } from "@/lib/reference-content";

/**
 * Band 3 — "A Small Question for You..."
 *
 * An 800px centred column on the page's darkest ground: one eyebrow, one
 * frame, one line of his.
 *
 * The introduction video lives here, under the line that introduces it. It
 * spent one revision up in the hero and has come back; the hero now carries the
 * owner's updated credentials card instead, so the two assets are in one place
 * each and neither is duplicated.
 *
 * `VideoPlayer` is poster-first: nothing is fetched and nothing plays until the
 * visitor presses play, so a 14 MB file in band 3 costs the initial load only
 * its poster image. No autoplay, and therefore no audio (CLAUDE.md §14.2).
 */
export function VSLSection() {
  return (
    <section className="vsl-section" aria-labelledby="vsl-heading">
      <div className="vsl-inner">
        <p className="vsl-label">{refVsl.label}</p>

        {/* The line first, then the recording it introduces. */}
        <h2 className="vsl-quote" id="vsl-heading">
          {refVsl.quote}
        </h2>

        <div className="vsl-frame">
          <div className="vsl-video">
            <VideoPlayer src={vsl.src!} poster={vsl.poster!} label={vsl.label} />
          </div>
        </div>
      </div>
    </section>
  );
}
