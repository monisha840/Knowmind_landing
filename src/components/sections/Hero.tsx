import Image from "next/image";

import { PRICING_ANCHOR } from "@/lib/config";
import { refAssets, refHero } from "@/lib/reference-content";

/**
 * Band 2 — the hero.
 *
 * Two columns, `1fr 400px`, bottom-aligned, on the page's one gradient:
 * `linear-gradient(160deg, #1a0030, #4B0082 60%, #6A0DAD)`. The band carries
 * 70px of top padding and none at the bottom, so the portrait column meets the
 * fold flush; the left column's own 60px of bottom padding is what lifts the
 * copy off it.
 *
 * The 600px ∞ glyph bleeding off the right edge at 2% white is `.hero::after`
 * in `reference.css`. It is nearly invisible, and it is what gives the band its
 * depth (specification §10) — easy to lose, so it is worth naming here.
 *
 * The mark is set as two spans rather than as the h1: "1% Better." at 52/900
 * italic amber over "EVERY DAY." at 26/400 with 3px of tracking. The contrast
 * between those two lines is the brand. The h1 is the question below them, and
 * it is the page's only h1.
 *
 * At ≤1000px the whole right column is hidden, as the reference hides it. That
 * loses the portrait and the three headline figures on the widths carrying most
 * of this page's traffic; it is the reference's own call, reproduced, and
 * flagged in the delivery summary rather than quietly corrected.
 */
export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-inner">
        <div className="hero-left">
          <div className="h-tag">
            <span className="h-dot" />
            {refHero.tag}
          </div>

          <span className="h-main">{refHero.mark}</span>
          <span className="h-sub">{refHero.sub}</span>

          <div className="h-tamil" lang="ta">
            {refHero.tamil}
          </div>
          <div className="h-tamil-eng">{refHero.tamilEnglish}</div>

          <h1 className="h-headline" id="hero-heading">
            {refHero.headline}
          </h1>

          <p className="h-sub2">
            {refHero.subLines[0]}
            <br />
            {refHero.subLines[1]}
          </p>

          <div className="h-badges">
            {refHero.badges.map((badge) => (
              <span className="hb" key={badge}>
                {badge}
              </span>
            ))}
          </div>

          <a href={PRICING_ANCHOR} className="h-cta">
            {refHero.cta}
          </a>
          <br />
          <span className="h-cta-note">{refHero.ctaNote}</span>
        </div>

        <div className="hero-right">
          {/*
            The reference frames a placeholder here — a 📸 glyph over "Kalee's
            photo here". What sits in it now is the credentials card, at the
            owner's request, clipped to the frame's own `20px 20px 0 0` radius
            so the stat bar still meets it flush.

            The frame is landscape rather than the reference's upright box,
            because the card is 1200x811 and its badges are baked-in lettering
            that an upright crop would cut away — the reasoning is on
            `.hero-photo` in `reference.css`, next to the rule that does it.

            No `priority`: the frame is `display:none` below 1000px, and
            preloading an image that phones never show would take bandwidth
            from the LCP on exactly the widths that can least afford it
            (CLAUDE.md §14.1).
          */}
          <div className="hero-photo">
            {/*
              `sizes` traces `.hero-inner`'s `clamp(380px, 30vw, 470px)` track,
              because `sizes` takes no `clamp()` and a stale number here is
              invisible until you look at the pixels: at a flat "380px" the
              browser fetched the 380-wide candidate and stretched it to 468 on
              a 1920 screen, which on an asset whose whole content is small
              lettering is exactly the softness this card cannot afford.

              The breakpoints are where the clamp changes hands — 30vw reaches
              the 380px floor at 1267px and the 470px ceiling at 1567px. Below
              1000px the column stacks and the card is capped at 420px, so the
              last two entries cover the phone and tablet widths where it is now
              shown rather than hidden.
            */}
            <Image
              src={refAssets.heroPhoto.src}
              alt={refAssets.heroPhoto.alt}
              fill
              sizes="(min-width: 1567px) 470px, (min-width: 1267px) 30vw, (min-width: 1001px) 380px, (min-width: 540px) 420px, 92vw"
            />
          </div>

          <div className="hero-stat-bar">
            {refHero.stats.map((stat) => (
              <div className="hstat" key={stat.l}>
                <span className="n">{stat.n}</span>
                <span className="l">{stat.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
