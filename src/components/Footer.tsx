import { siteConfig } from "@/lib/config";
import { refFooter } from "@/lib/reference-content";

/**
 * Band 18 — the footer.
 *
 * Twenty pixels of #0D0020, the darkest ground on the page: the wordmark and
 * its tagline on the left, contact and the results disclaimer on the right,
 * stacked to the left edge below 700px.
 *
 * No navigation. The reference has none anywhere — not in the bar at the top
 * and not here — and the previous footer's "Explore" column pointed at four
 * section anchors, two of which (`#the-problem`, `#whats-included`) belong to
 * sections this redesign no longer composes. A link list that resolves to
 * nothing is worse than no link list, and the page is a single scroll with one
 * decision in it (specification §07).
 *
 * The three contact details are `siteConfig`'s, not the transcription's: they
 * are facts about a real person and the project has one source of truth for
 * them (CLAUDE.md §1.1). `refFooter` supplies the brand line, the copyright and
 * the disclaimer.
 */
export function Footer() {
  const { contact } = siteConfig;

  return (
    <footer className="ref-footer">
      <div>
        <div className="f-logo">
          {refFooter.brand}
          <span>{refFooter.tagline}</span>
        </div>
        <p className="f-copy">{refFooter.copyright}</p>
      </div>

      <div className="f-right">
        <p className="f-contact">
          <a href={contact.websiteHref} target="_blank" rel="noopener noreferrer">
            {contact.website}
          </a>
          {" · "}
          <a href={contact.phoneHref}>{contact.phone}</a>
          {" · "}
          <a href={contact.emailHref}>{contact.email}</a>
        </p>
        <p className="f-disc">{refFooter.disclaimer}</p>
      </div>
    </footer>
  );
}
