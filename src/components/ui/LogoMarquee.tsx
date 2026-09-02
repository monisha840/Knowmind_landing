import Image from "next/image";

/**
 * The two logo strips — bands 10 and 11.
 *
 * One list, rendered twice, translated to -50% over 25 seconds: at the halfway
 * point the second copy sits exactly where the first began, so the loop has no
 * seam. The reference builds the second copy in script
 * (`el.innerHTML += el.innerHTML`); doing it in the markup is the same output
 * with nothing to run, and — unlike the countdown — it is deterministic, so
 * there is no hydration hazard in rendering it on the server
 * (specification §06).
 *
 * The duplicate is `aria-hidden`, so the eighteen organisations are announced
 * once rather than thirty-six times. Hover pauses the animation and
 * `prefers-reduced-motion` stops it outright — both in `reference.css`.
 *
 * ── Two kinds of item ─────────────────────────────────────────────────────
 *
 * A plain string sets the name as type; a `MarqueeLogo` renders the outlet's
 * own mark. Band 10's eighteen organisations are still strings — no logo files
 * exist for them, and the deck's only copy is a flattened grid of all eighteen
 * in one picture, which cannot be cut apart into marks anyone would be entitled
 * to ship. Band 11's nine media outlets are logos.
 *
 * The name travels with the picture either way: it is the image's `alt`, so
 * removing every logo file leaves a strip that still reads as nine outlets to a
 * screen reader (CLAUDE.md §13.3).
 *
 * A server component: nothing here needs the browser.
 */

export type MarqueeLogo = {
  /** The outlet's name — the `alt`, and the fallback if the mark is dropped. */
  name: string;
  src: string;
  /** The file's own pixels, so the pill reserves its box before it loads. */
  width: number;
  height: number;
};

export type MarqueeItem = string | MarqueeLogo;


export function LogoMarquee({ items, label }: { items: readonly MarqueeItem[]; label: string }) {
  return (
    <>
      <p className="media-label">{label}</p>
      <div className="marquee-wrap-outer marquee-pad">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <div className="contents" key={copy} aria-hidden={copy === 1}>
              {items.map((item) =>
                typeof item === "string" ? (
                  <div className="logo-pill" key={`${copy}-${item}`}>
                    <span>{item}</span>
                  </div>
                ) : (
                  <div className="logo-pill logo-pill-mark" key={`${copy}-${item.name}`}>
                    {/*
                      Sized by the file rather than by `fill`, because each mark
                      has its own shape — a lighthouse is nearly square and a
                      masthead is four times as wide — and a fixed box would
                      have to letterbox one to fit the other. The pill caps both
                      axes in CSS instead, so every mark lands at the largest
                      size that fits and none is cropped or stretched.

                      The duplicate copy requests the same URLs, so the strip
                      costs nine files, not eighteen.
                    */}
                    <Image
                      src={item.src}
                      alt={item.name}
                      width={item.width}
                      height={item.height}
                    />
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
