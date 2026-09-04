import { refPattern } from "@/lib/reference-content";

/**
 * Band 4 — "Is this your pattern?"
 *
 * The first light band, and the page's first two-column layout: the four-step
 * loop on the left, the truth box on the right, centred against each other
 * across a 60px gutter on #F8F5FF.
 *
 * The steps are the page's most repeated shape — a 4px #3a1a5c left border with
 * a `0 10px 10px 0` radius — chained by a ↓ between each pair. The arrows are
 * real elements here rather than pseudo-elements, because they sit *between*
 * the cards in the flow rather than hanging off one.
 *
 * The band was written in Tamil and romanised Tanglish. It is English now, at
 * the owner's request, so no element here carries `lang="ta"` any more.
 *
 * The heading is two lines with two sizes rather than one: the lead sets
 * smaller than the reference's 34px and the line under it larger, which is the
 * hierarchy the owner asked for. Both are scoped to `.pattern-title` because
 * `.s-title` is shared furniture — `RefSectionIntro` uses it for every other
 * band, and resizing it here would resize the whole page.
 */
export function PatternSection() {
  const { truth } = refPattern;

  return (
    <section className="pattern-section" aria-labelledby="pattern-heading">
      <div className="pattern-inner">
        <div className="pattern-left">
          <span className="s-tag">{refPattern.tag}</span>

          <h2 className="s-title pattern-title" id="pattern-heading">
            <span className="pt-lead">{refPattern.titleLead}</span>
            <span className="pt-accent">{refPattern.titleAccent}</span>
          </h2>

          <div className="pattern-flow">
            {refPattern.steps.map((step, i) => (
              <div key={step.title} className="contents">
                <div className="pf-step">
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
          <span className="tb-tanglish">{truth.tanglish}</span>
          <span className="tb-eng">{truth.english}</span>
          <p className="tb-quote">{truth.quote}</p>
          <p className="tb-note">{truth.note}</p>
        </div>
      </div>
    </section>
  );
}
