import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { live, liveReasons } from "@/lib/content";

/**
 * Why live?
 *
 * An explanation, not an objection handler. The one fact a visitor needs — that
 * there is no recording, and that this is chosen rather than missing — is
 * stated in the heading's own lead, at reading size, with no badge and no
 * warning colour around it. Making it loud would turn an honest constraint into
 * a scarcity tactic, which is the opposite of what it is.
 *
 * The composition is the one this section already had: the question on the
 * left, the answer on the right. What changed inside it is the four reasons.
 * They used to be full-width ruled rows, which suited descriptions of a
 * sentence and a half; the approved copy is four short lines, and eight columns
 * of empty space beside "You are not doing this alone." reads as a mistake. Two
 * by two gives each one a column it actually fills.
 *
 * A server component. Nothing here needs the browser (CLAUDE.md §4.1).
 */
export function LiveOnlySection() {
  return (
    <section
      id="why-live"
      aria-labelledby="live-heading"
      className="section-y relative bg-wine-950"
    >
      <div className="container-page">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading
              id="live-heading"
              eyebrow={live.eyebrow}
              title={live.title}
              lead={live.noRecording}
            />
          </div>

          <div className="lg:col-span-7">
            {/*
              Two by two from `sm`, stacked on a phone. Each cell carries its
              own top hairline rather than the list carrying one — that is what
              draws the grid, and it is the same ruled-index idiom the rest of
              the page uses.
            */}
            <ul className="grid gap-x-10 sm:grid-cols-2">
              {liveReasons.map((reason, i) => (
                <Reveal
                  as="li"
                  key={reason.title}
                  delay={i * 0.07}
                  className="border-t border-cream/12 py-6 sm:py-7"
                >
                  <h3 className="text-h3 font-medium text-honey">{reason.title}</h3>
                  <p className="mt-2.5 text-body text-cream-muted">{reason.description}</p>
                </Reveal>
              ))}
            </ul>

            {/* The closing thought. Set at reading size in cream rather than as
                a second heading — it is the section settling, not a claim. */}
            <Reveal delay={0.1}>
              <p className="mt-9 text-lead font-medium text-cream sm:mt-10">
                {live.conclusion}
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
