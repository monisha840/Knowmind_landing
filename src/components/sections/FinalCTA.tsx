import { OpenRegistration } from "@/components/ui/OpenRegistration";
import { refFinal } from "@/lib/reference-content";

/**
 * Band 17 — the close.
 *
 * A 680px column on the deep purple: four lines, the six-item checklist, the
 * Tanglish line in amber with its English gloss, the button, and Kaleeswaran's
 * signature. It is the last
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

        {/* Tanglish display line, English gloss under it. Roman script, so no
            `lang="ta"` (CLAUDE.md §13.5). */}
        <span className="final-tanglish">{refFinal.tanglish}</span>
        <span className="final-sub">{refFinal.tanglishEnglish}</span>

        <OpenRegistration className="final-cta">{refFinal.cta}</OpenRegistration>

        <p className="final-meta">{refFinal.meta}</p>
        <p className="final-sign">{refFinal.sign}</p>
      </div>
    </section>
  );
}
