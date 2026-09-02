import { RefSectionIntro } from "@/components/ui/RefSectionIntro";
import { refFaq } from "@/lib/reference-content";

/**
 * Band 16 — the questions.
 *
 * Eight cards in a 2×2×2×2 on white, numbered in the copy itself because the
 * reference numbers them there rather than by counter. Not a disclosure list:
 * the reference sets every answer open, and a page whose whole argument is
 * "you already know what to do" should not make somebody click eight times to
 * find the refund terms. So `Accordion` is not used here, and the band ships no
 * client JavaScript at all.
 *
 * Answer 3 sets one clause in Tamil mid-sentence. It is the only place on the
 * page where a language switch happens inside a paragraph, which is exactly
 * what `lang` is for (CLAUDE.md §13.5) — and `.faq-tamil` is why the clause is
 * split out in the transcription rather than concatenated into the answer.
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

        <div className="faq-grid">
          {refFaq.items.map((item) => (
            <div className="faq-card" key={item.q}>
              <h3 className="faq-q">{item.q}</h3>
              <p className="faq-a">
                {item.a}
                {"tamil" in item && (
                  <>
                    <span className="faq-tamil" lang="ta">
                      {item.tamil}
                    </span>
                    {item.aAfter}
                  </>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
