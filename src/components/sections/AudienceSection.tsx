import { refWho } from "@/lib/reference-content";

/**
 * Band 13 — who this journey is for, and who it is not for.
 *
 * Two columns on #F8F5FF that argue against each other: the qualifying case on
 * the left in near-black, the disqualifying one on the right in #C62828. Each
 * column closes on a dark box — the left on #4B0082 with what a participant may
 * begin to notice, the right on #2D0060 with the line that lets somebody in
 * anyway. The page's only red is here, and it is deliberate: this is the one
 * band whose job is to lose the wrong reader rather than keep them.
 *
 * The ✓ and ✕ markers are presentational. `.not-x` is named for its glyph, and
 * `.ai` is a flex row with a gap for a marker it never fills — so the check is
 * the structural counterpart to the cross, not copy, and both are hidden from
 * assistive technology (the list semantics carry the meaning instead).
 */
export function AudienceSection() {
  const { notNote } = refWho;

  return (
    <section className="who-section" id="who-its-for" aria-labelledby="who-heading">
      {/* The level the reference skips — see `refWho.srHeading`. Visually
          nothing; structurally it is what stops the outline jumping h2 → h3
          here, and what the two column heads below now sit under. */}
      <h2 className="sr-only" id="who-heading">
        {refWho.srHeading}
      </h2>

      <div className="who-inner">
        {/* ---- For you ---- */}
        <div className="for-col">
          <h3>{refWho.forHeading}</h3>

          <ul>
            {refWho.forItems.map((item) => (
              <li className="for-item" key={item.title}>
                <div className="fi-text">
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="after-box">
            <h4>{refWho.afterHeading}</h4>
            <ul>
              {refWho.afterItems.map((item) => (
                <li className="ai" key={item}>
                  <span aria-hidden>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ---- Not for you ---- */}
        <div className="not-col">
          <h3>{refWho.notHeading}</h3>

          <ul>
            {refWho.notItems.map((item) => (
              <li className="not-item" key={item}>
                <span className="not-x" aria-hidden>
                  ✕
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="not-note">
            <p>{notNote.top}</p>
            <p className="big">{notNote.big}</p>
            <p className="tamil" lang="ta">
              {notNote.tamil}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
