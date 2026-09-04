import { refHow } from "@/lib/reference-content";

/**
 * Band 7 — how the fourteen days actually work.
 *
 * The first dark band after the hero: five numbered steps on #2D0060, then the
 * clarity strip — duration, format, time, focus — then the miss-a-day note.
 *
 * The five steps are the one place the reference's stylesheet contradicts
 * itself. At ≤1000px it declares `display:none` on `.how-steps` and then
 * `display:grid` two rules later in the same block; the later rule wins, so the
 * steps do show as three columns and the `none` is dead code. `reference.css`
 * writes the intended rule once rather than carrying the contradiction forward
 * (specification §07).
 */
export function HowItWorksSection() {
  return (
    <section className="how-section" aria-labelledby="how-heading">
      <div className="how-inner">
        <div className="how-top">
          <h2 id="how-heading">{refHow.title}</h2>
          <p>{refHow.lead}</p>
        </div>

        {/* The numeral is decoration for a screen reader: the steps are already
            in document order, and "1 Join the Journey" read out adds nothing. */}
        <ol className="how-steps">
          {refHow.steps.map((step, i) => (
            <li className="how-step" key={step.title}>
              <div className="how-num" aria-hidden>
                {i + 1}
              </div>
              <h3 className="how-title">{step.title}</h3>
              <p className="how-desc">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="how-clarity">
          {refHow.clarity.map((item) => (
            <div className="hc-item" key={item.label}>
              <div className="label">{item.label}</div>
              <div className="val">{item.val}</div>
            </div>
          ))}
        </div>

        <div className="how-miss">
          <p>{refHow.miss.question}</p>
          <div className="how-miss-reassurance">{refHow.miss.reassurance}</div>
          <p className="after">{refHow.miss.after}</p>
        </div>
      </div>
    </section>
  );
}
