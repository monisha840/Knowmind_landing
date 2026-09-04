import Image from "next/image";

import { OpenRegistration } from "@/components/ui/OpenRegistration";
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

          {/* The question leads and the mark answers it. This is the reverse of
              the reference, at the owner's request: "Are You Ready to Become 1%
              Better Every Day?" is the primary line and "1% Better. Every Day."
              sits under it as the secondary. The type scale in `reference.css`
              was swapped to match — the h1 carries the weight now, and `.h-main`
              keeps the brand's amber italic at a subordinate size. */}
          <h1 className="h-headline" id="hero-heading">
            {refHero.headline}
          </h1>

          <span className="h-main">{refHero.mark}</span>
          <span className="h-sub">{refHero.sub}</span>

          {/* Roman script, so no `lang="ta"` — that attribute would put a
              screen reader into Tamil pronunciation and the type into a Tamil
              face, and both are wrong for Latin letters (CLAUDE.md §13.5). */}
          <div className="h-tanglish">{refHero.tanglish}</div>
          <div className="h-tamil-eng">{refHero.tanglishEnglish}</div>

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

          <OpenRegistration className="h-cta">{refHero.cta}</OpenRegistration>
          <br />
          <span className="h-cta-note">{refHero.ctaNote}</span>
        </div>

        <div className="hero-right">
          {/*
            The owner's updated credentials card. The introduction video that
            briefly sat here has gone back to band 3, where its own line
            ("A Small Question for You...") introduces it; neither asset is
            duplicated and both are the supplied files.

            `contain` on the image and a light frame ground, because every badge
            on this card is lettering baked into the pixels — `cover` would clip
            words, and a dark frame would show as bars around the card's own
            white. The frame carries the artwork's own 1448x1086 so the two
            agree and nothing has to crop.
          */}
          <div className="hero-photo">
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
