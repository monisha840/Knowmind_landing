import { Accordion } from "@/components/ui/Accordion";
import { RefSectionIntro } from "@/components/ui/RefSectionIntro";
import { refFaq } from "@/lib/reference-content";

/**
 * Band 16 — the questions.
 *
 * A disclosure list, at the owner's request. The reference set all eight
 * answers open in a 2x2x2x2 of cards and this band shipped no client
 * JavaScript at all; it now opens one answer at a time, so the eight questions
 * can be read as a list and only the relevant answer costs any height.
 *
 * The behaviour comes from `Accordion` rather than from anything written here.
 * That component already carries the real `<button>`, `aria-expanded`,
 * `aria-controls`, the labelled region and the reduced-motion path, and
 * CLAUDE.md §6 is explicit that a second accordion must not be built — so it
 * gained a `variant` instead, which hands the painting to `reference.css` and
 * leaves the behaviour where it already was.
 *
 * `defaultOpen={null}` because the owner asked for answers hidden until asked
 * for. This file stays a server component (CLAUDE.md §4.1); only the accordion
 * itself is client-side.
 */
export function FAQSection() {
  return (
    <section className="faq-section" id="faq" aria-labelledby="faq-heading">
      <div className="faq-inner">
        <div className="faq-top">
          <RefSectionIntro
            tag={refFaq.tag}
            title={{ before: refFaq.title }}
            headingId="faq-heading"
          />
        </div>

        {/* `refFaq` speaks q/a; `Accordion` speaks question/answer. Mapped here
            rather than renaming the content, whose field names are the
            reference's transcription. */}
        <Accordion
          variant="reference"
          defaultOpen={null}
          items={refFaq.items.map((item) => ({ question: item.q, answer: item.a }))}
        />
      </div>
    </section>
  );
}
