import { refPattern } from "@/lib/reference-content";

/**
 * Band 4 — "Idhu ungaloda pattern-aa?"
 *
 * The first light band, and the page's first two-column layout: the four-step
 * loop on the left, the truth box on the right, centred against each other
 * across a 60px gutter on #F8F5FF.
 *
 * The steps are the page's most repeated shape — a 4px #4B0082 left border with
 * a `0 10px 10px 0` radius — chained by a ↓ between each pair. The arrows are
 * real elements here rather than pseudo-elements, because they sit *between*
 * the cards in the flow rather than hanging off one.
 *
 * The Tanglish in the step titles is Latin script and deliberately carries no
 * `lang="ta"`; the heading and the truth box, which are Tamil script, do.
 */
export function PatternSection() {
  const { truth } = refPattern;

  return (
    <section className="pattern-section" aria-labelledby="pattern-heading">
      <div className="pattern-inner">
        <div className="pattern-left">
          <span className="s-tag">{refPattern.tag}</span>

          <h2 className="s-title" id="pattern-heading" lang="ta">
            {refPattern.titleTamil}
            <br />
            <span>{refPattern.titleTamilAccent}</span>
          </h2>

          <div className="pattern-flow">
            {refPattern.steps.map((step, i) => (
              <div key={step.title} className="contents">
                <div className="pf-step">
                  <span className="pf-icon" aria-hidden>
                    {step.icon}
                  </span>
                  <div className="pf-text">
                    <strong>{step.title}</strong>
                    <p>{step.body}</p>
                  </div>
                </div>
                {i < refPattern.steps.length - 1 && (
                  <div className="pf-arrow" aria-hidden>
                    ↓
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="truth-box">
          <p className="tb-top">
            {truth.top[0]}
            <br />
            {truth.top[1]}
          </p>
          <span className="tb-tamil" lang="ta">
            {truth.tamil[0]}
            <br />
            {truth.tamil[1]}
          </span>
          <span className="tb-eng">{truth.english}</span>
          <p className="tb-quote">{truth.quote}</p>
          <p className="tb-note">{truth.note}</p>
        </div>
      </div>
    </section>
  );
}
