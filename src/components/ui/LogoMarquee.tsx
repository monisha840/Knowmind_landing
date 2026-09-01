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
 * A server component: nothing here needs the browser.
 */
export function LogoMarquee({ items, label }: { items: readonly string[]; label: string }) {
  return (
    <>
      <p className="media-label">{label}</p>
      <div className="marquee-wrap-outer marquee-pad">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <div className="contents" key={copy} aria-hidden={copy === 1}>
              {items.map((item) => (
                <div className="logo-pill" key={`${copy}-${item}`}>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
