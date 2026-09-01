import Image from "next/image";

import { refAssets, refKalee } from "@/lib/reference-content";

/**
 * Band 9 — the authority band.
 *
 * `380px 1fr` on #F8F5FF: a profile card that sticks at `top: 80px` and follows
 * the bio column past it, and the bio itself — the question, the pull-quote
 * against its amber rail, the approach card, and three credential badges.
 *
 * The card stops being sticky below 1000px, where it sits above the bio rather
 * than beside it and pinning it would cover the copy it introduces.
 *
 * The reference draws a 📸 glyph in the avatar ring; §05 identifies the real
 * portrait, and it is used here, clipped to the ring.
 */
export function MeetKaleeswaranSection() {
  const { card, approach } = refKalee;

  return (
    <section className="kalee-section" id="meet-kaleeswaran" aria-labelledby="kalee-heading">
      <div className="kalee-inner">
        <div className="kalee-card">
          <div className="kalee-photo">
            <Image
              src={refAssets.portrait.src}
              alt={refAssets.portrait.alt}
              fill
              sizes="150px"
            />
          </div>

          <p className="kalee-name">{card.name}</p>
          <p className="kalee-title">
            {card.roleLines[0]}
            <br />
            {card.roleLines[1]}
          </p>

          <div className="k-stats">
            {card.stats.map((stat) => (
              <div className="k-stat" key={stat.l}>
                <span className="n">{stat.n}</span>
                <span className="l">{stat.l}</span>
              </div>
            ))}
          </div>

          <div className="g-card">
            <div className="g-score">{card.google.score}</div>
            <span className="g-stars" aria-hidden>
              {card.google.stars}
            </span>
            <div className="g-rev">{card.google.reviews}</div>
          </div>
        </div>

        <div className="kalee-content">
          <span className="s-tag">{refKalee.tag}</span>
          <h2 id="kalee-heading">{refKalee.heading}</h2>

          <p className="k-quote">{refKalee.quote}</p>

          <p className="k-bio">
            {refKalee.bio.before}
            <strong>{refKalee.bio.strong}</strong>
          </p>

          <div className="k-approach">
            <h3>{approach.heading}</h3>
            {approach.points.map((point) => (
              <div className="k-point" key={point}>
                {point}
              </div>
            ))}
            <p className="k-close">{approach.close}</p>
          </div>

          <div className="spec-badges">
            {refKalee.badges.map((badge) => (
              <div className="sb" key={badge.title}>
                <span className="si" aria-hidden>
                  {badge.icon}
                </span>
                <strong>{badge.title}</strong>
                <p>{badge.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
