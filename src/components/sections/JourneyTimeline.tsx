import { RefSectionIntro } from "@/components/ui/RefSectionIntro";
import { PRICING_ANCHOR } from "@/lib/config";
import { refJourney } from "@/lib/reference-content";

/**
 * Band 6 — the fourteen days.
 *
 * Two week cards side by side, seven day rows each, on #F8F5FF. The rows are
 * the same shape in both columns and are told apart by the numeral's colour
 * alone: #EDE7F6 on #4B0082 through week one, #E8F5E9 on #1B5E20 through week
 * two — understanding, then moving.
 *
 * The tallest band on the page at 940px, and the one that grows most on a
 * phone (1.92×), because the two cards stack rather than reflow.
 */
export function JourneyTimeline() {
  const { note } = refJourney;

  return (
    <section className="journey-section" id="journey" aria-labelledby="journey-heading">
      <div className="journey-inner">
        <div className="journey-top">
          <RefSectionIntro
            tag={refJourney.tag}
            title={refJourney.title}
            lead={refJourney.lead}
            centred
            headingId="journey-heading"
          />
        </div>

        <div className="weeks-grid">
          {refJourney.weeks.map((week) => (
            <div className="week-card" key={week.label}>
              <h3 className={`wk-label ${week.tone}`}>{week.label}</h3>
              {week.days.map((day) => (
                <div className="day-row" key={day.n}>
                  <div className={`day-num${week.tone === "w2" ? " g" : ""}`}>{day.n}</div>
                  <div className="day-info">
                    <h4>{day.title}</h4>
                    <p>{day.body}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="journey-note">
          <p>
            {note.before}
            <strong>{note.strong}</strong>
            {note.after}
          </p>
        </div>

        <div className="cta-center">
          <a href={PRICING_ANCHOR} className="cta-btn">
            {refJourney.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
