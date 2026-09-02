import { REGISTER_ANCHOR } from "@/lib/config";
import { refFinal } from "@/lib/reference-content";

/**
 * Band 17 — the close.
 *
 * A 680px column on #4B0082: four lines, the six-item checklist, the Tamil
 * line at 30px amber, the button, and Kaleeswaran's signature. It is the last
 * argument the page makes, and it makes it by repeating the smallest promise
 * rather than the largest — "just give yourself 14 days".
 *
 * The four lines are the `<h2>` rather than a paragraph beneath an invisible
 * one. `.final-lines` is the band's only heading-weight text, and the project's
 * rule is that a section is labelled by a real heading (CLAUDE.md §13.1); the
 * alternative here was an `sr-only` copy of a line already on screen, which
 * reads it to a screen reader twice. `reference.css` neutralises the base
 * layer's heading weight and balance inside `.ref-page`, so the h2 renders
 * exactly as the reference's paragraph does.
 *
 * The button carries the reference's own bracketed label and goes where every
 * other call to action on the page goes — the questions, not a checkout.
 */
export function FinalCTA() {
  const { lines } = refFinal;

  return (
    <section className="final-section" id="begin" aria-labelledby="final-heading">
      <div className="final-center">
        <h2 className="final-lines" id="final-heading">
          {lines.first}
          <br />
          {lines.second}
          <br />
          <strong>{lines.strong}</strong>
          <br />
          {lines.last}
        </h2>

        <ul className="final-checklist">
          {refFinal.checklist.map((item) => (
            <li className="fc" key={item}>
              {item}
            </li>
          ))}
        </ul>

        <span className="final-tamil" lang="ta">
          {refFinal.tamil}
        </span>
        {/* One line, two scripts. The reference sets them as a single line and
            this keeps it one line; only the Tamil clause is marked, so it takes
            the same face as the ten other Tamil strings on the page instead of
            the platform fallback. */}
        <span className="final-sub">
          <span lang="ta">{refFinal.tamilSub}</span>
          {refFinal.tamilSubEnglish}
        </span>

        <a href={REGISTER_ANCHOR} className="final-cta">
          {refFinal.cta}
        </a>

        <p className="final-meta">{refFinal.meta}</p>
        <p className="final-sign">{refFinal.sign}</p>
      </div>
    </section>
  );
}
