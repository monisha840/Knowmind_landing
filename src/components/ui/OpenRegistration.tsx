"use client";

import type { ReactNode } from "react";

import { openRegistration } from "@/components/ui/registrationBus";

type OpenRegistrationProps = {
  /** The reference stylesheet's own class for whichever button this is. */
  className: string;
  children: ReactNode;
};

/**
 * A call to action that opens the registration dialog.
 *
 * This replaces the `<a href="#begin-journey">` every CTA used to be. It is a
 * real `<button>` because it performs an action rather than navigating — a
 * link that opens a dialog is the accessibility defect CLAUDE.md §13.2 names
 * directly, and a screen reader announcing "link" for something that opens a
 * form is a promise the page does not keep.
 *
 * It carries no styling of its own: it takes the same class the anchor had, so
 * every button keeps exactly the appearance `reference.css` already gives it.
 * The reset for the browser's own button chrome lives on `.cta-as-button`,
 * applied alongside.
 */
export function OpenRegistration({ className, children }: OpenRegistrationProps) {
  return (
    <button type="button" className={`${className} cta-as-button`} onClick={openRegistration}>
      {children}
    </button>
  );
}
