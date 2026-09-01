import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { vsl } from "@/lib/content";
import { refVsl } from "@/lib/reference-content";

/**
 * Band 3 — the video sales letter.
 *
 * An 800px centred column on #1a0030, the darkest ground on the page: one
 * eyebrow, one frame, one line of his.
 *
 * ── On the placeholder ────────────────────────────────────────────────────
 *
 * The reference renders a labelled empty frame here — "▶️ / Add VSL video here
 * (1.5–2 minutes)" — because the recording did not exist when it was drawn. It
 * still does not exist in this repository. The only footage here is
 * `/kalee/kalee-intro.mp4`: ten seconds, silent, built as a background plate
 * for the registration questions. Presenting that as a two-minute introduction
 * would be the fake implementation CLAUDE.md §0.4 forbids, and `content.ts`
 * says so at the `vsl` declaration in as many words.
 *
 * So the reference's own treatment is reproduced exactly, which is also the
 * honest one — and the frame is wired, so setting `vsl.src` and `vsl.poster`
 * in `lib/content` swaps the real recording in with no other change.
 */
export function VSLSection() {
  const hasVideo = Boolean(vsl.src && vsl.poster);

  return (
    <section className="vsl-section" aria-labelledby="vsl-heading">
      <div className="vsl-inner">
        <p className="vsl-label">{refVsl.label}</p>

        <div className="vsl-frame">
          {hasVideo ? (
            <div style={{ width: "100%", position: "relative", aspectRatio: vsl.aspect }}>
              <VideoPlayer src={vsl.src!} poster={vsl.poster!} label={vsl.label} />
            </div>
          ) : (
            <>
              <span className="vsl-play" aria-hidden>
                ▶️
              </span>
              <p className="vsl-text">{refVsl.placeholder}</p>
            </>
          )}

          {/* Romanised Tanglish, so no `lang="ta"` — that attribute would put a
              screen reader into Tamil pronunciation and the type into Noto Sans
              Tamil, and both are wrong for Latin script (CLAUDE.md §13.5). */}
          <p className="vsl-quote" id="vsl-heading">
            {refVsl.quote}
          </p>
        </div>
      </div>
    </section>
  );
}
