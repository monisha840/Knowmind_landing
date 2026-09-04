import Image from "next/image";

import { refSticky } from "@/lib/reference-content";

/**
 * Band 1 — the pinned bar.
 *
 * The reference's only chrome: a wordmark, pinned at `top: 0` with no scroll
 * threshold and no shrink. There is no navigation on the page at any width —
 * no links, no hamburger, no drawer — so this replaces `Navbar` rather than
 * sitting beside it (specification §07).
 *
 * The call to action lived here until the owner asked for it to sit beside
 * the countdown instead, so both the deadline and the button that beats it
 * are in the same place, at the foot of the screen (`CountdownBar`). This bar
 * is the wordmark alone now.
 *
 * The KnowMind mark sits before the wordmark: `brand/logo-mark.png`, which is
 * the dimensional ribbon from `knowmind_logo.png` — the same artwork the
 * favicon and the app icons are cut from, so the tab icon and the bar are
 * recognisably one logo. The flat `logo.png` / `logo-white.png` pair are
 * simplified versions of it and are not this mark.
 *
 * It carries its own honey, so it holds the bar's purple without needing a
 * white variant, and its transparent ground is why it is stored as PNG — see
 * the job in `optimize-assets.mjs`.
 *
 * `alt=""` because the words immediately beside it say "KnowMind Universe";
 * announcing the same name twice is noise, and it is the convention the rest of
 * the project already follows for this mark (CLAUDE.md §14.1).
 *
 * A server component. Nothing here needs the browser.
 */
export function StickyBar() {
  return (
    <header className="sticky">
      <div className="s-logo">
        {/*
          `priority` — it is in the pinned bar and it is the only image above
          the fold on this route, which is the exact case §14.1 reserves the
          flag for. Sized in the markup at its rendered pixels, at the mark's
          own 220:96, so the bar cannot reflow around it as it decodes.
        */}
        <Image
          className="s-mark"
          src="/brand/logo-mark.png"
          alt=""
          width={60}
          height={26}
          priority
        />
        {/* A `div`, not a `span`: `.s-logo span` is the tagline's own selector
            and a wrapping span would inherit it. */}
        <div className="s-words">
          {refSticky.brand}
          <span>{refSticky.tagline}</span>
        </div>
      </div>
    </header>
  );
}
