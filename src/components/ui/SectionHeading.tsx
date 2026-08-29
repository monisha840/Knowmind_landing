import type { ReactNode } from "react";

import { Reveal } from "./Reveal";

export type Tone = "dark" | "light";

/* -------------------------------------------------------------------------- */

export function Eyebrow({
  children,
  tone = "dark",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-3 text-eyebrow font-semibold uppercase ${
        tone === "dark" ? "text-honey" : "text-amber-ink"
      } ${className}`}
    >
      <span aria-hidden className="h-px w-8 bg-current opacity-60" />
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */

type SectionHeadingProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  tone?: Tone;
  align?: "left" | "center";
  className?: string;
  /** Renders the title as an `h3` inside already-titled regions. */
  as?: "h2" | "h3";
  /**
   * Id for the rendered heading. Sections that label themselves with
   * `aria-labelledby` must pass this, or the reference dangles.
   */
  id?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  lead,
  tone = "dark",
  align = "left",
  className = "",
  as: Tag = "h2",
  id,
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div
      className={`flex flex-col ${centered ? "items-center text-center" : "items-start"} ${className}`}
    >
      {eyebrow && (
        <Reveal>
          <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
        </Reveal>
      )}

      <Reveal delay={0.06}>
        <Tag
          id={id}
          className={`mt-5 text-h2 font-semibold ${
            tone === "dark" ? "text-cream" : "text-ink"
          } ${centered ? "mx-auto max-w-4xl" : "max-w-3xl"}`}
        >
          {title}
        </Tag>
      </Reveal>

      {lead && (
        <Reveal delay={0.12}>
          <p
            className={`mt-6 text-lead ${
              tone === "dark" ? "text-cream-muted" : "text-ink-muted"
            } ${centered ? "mx-auto max-w-2xl" : "max-w-2xl"}`}
          >
            {lead}
          </p>
        </Reveal>
      )}
    </div>
  );
}
