import type { ReactNode } from "react";

type RefSectionIntroProps = {
  /** The uppercase pill above the title. Omitted where the reference omits it. */
  tag?: string;
  /**
   * The heading, in two clauses. The reference wraps the second in a `<span>`
   * and drops it to #4B0082 — the split-colour title is one of the page's ten
   * signature moves (specification §10), so it is expressed as data rather
   * than as two hand-written spans per section.
   */
  title: { before: ReactNode; accent?: ReactNode };
  /** The 14px lead beneath. */
  lead?: ReactNode;
  /** Centres the lead's own measure, as the reference does in four bands. */
  centred?: boolean;
  headingId?: string;
  /** The tag's own language, where it is not English. */
  tagLang?: string;
  titleLang?: string;
};

/**
 * Eyebrow pill, split-colour heading, lead — the furniture that opens eight of
 * the page's bands.
 *
 * The reference writes the pill inline in seven of those eight and as
 * `.pattern-left .s-tag` in the last, with identical values; `.s-tag` in
 * `reference.css` is that one declaration written once.
 */
export function RefSectionIntro({
  tag,
  title,
  lead,
  centred = false,
  headingId,
  tagLang,
  titleLang,
}: RefSectionIntroProps) {
  return (
    <>
      {tag && (
        <span className="s-tag" lang={tagLang}>
          {tag}
        </span>
      )}
      <h2 className="s-title" id={headingId} lang={titleLang}>
        {title.before}
        {title.accent && <span>{title.accent}</span>}
      </h2>
      {lead && <p className={`s-sub${centred ? " centred" : ""}`}>{lead}</p>}
    </>
  );
}
