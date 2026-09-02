import { AnchorLanding } from "@/components/ui/AnchorLanding";
import { JourneyForm } from "@/components/ui/JourneyForm";
import { journeyForm } from "@/lib/content";

/**
 * Begin your journey — the registration questions.
 *
 * One centred column: the questions, asked one at a time, on paper. Deliberately
 * a server component — the heading is static, and the only thing that needs the
 * client is the stepper, which is its own component rather than a reason to
 * send the whole section to the browser.
 *
 * This used to be an editorial spread: Kaleeswaran's intro video at 43% on the
 * left, the questions at 57% on the right. The video was removed at the owner's
 * request and the questions took the whole width, centred, rather than being
 * left offset in a column whose other half no longer exists. `kalee-intro.mp4`
 * and its poster stay in `public/kalee/` — nothing was deleted, it is simply no
 * longer composed in (CLAUDE.md §19).
 *
 * Still one screen tall from 1200px up: every call to action on the page lands
 * here, and it should arrive at a whole composition rather than at a slice of
 * one with the footer showing underneath.
 */
export function BeginJourneySection() {
  return (
    /*
     * Every call to action on the page lands here, and it is the last section
     * on the page, so it now lands going forward rather than scrolling back.
     *
     * The `-scroll-mt-8` that used to sit here cancelled a 2rem
     * `scroll-padding-top` set for a page with no fixed chrome. There is a
     * navbar again and the global value is 6rem, so the cancel is gone and the
     * section keeps that clearance like every other anchor.
     */
    <section
      id="begin-journey"
      aria-labelledby="begin-journey-heading"
      className="relative bg-paper text-ink min-[1200px]:min-h-svh"
    >
      {/* Draws nothing: keeps the landing exact when a long smooth scroll
          outruns the layout settling above it. */}
      <AnchorLanding target="begin-journey" />

      <div className="grid min-[1200px]:min-h-svh">
        {/* ---------------- The questions ---------------- */}
        <div className="flex flex-col justify-center px-(--spacing-gutter) py-14 sm:py-16 md:py-20 min-[1200px]:py-24">
          <div className="mx-auto w-full max-w-xl">
            <span className="inline-flex items-center gap-3 text-eyebrow font-semibold text-amber-ink uppercase">
              <span aria-hidden className="h-px w-8 bg-current opacity-60" />
              {journeyForm.eyebrow}
            </span>

            <h2
              id="begin-journey-heading"
              className="mt-5 text-h2 font-semibold tracking-[-0.025em] text-ink"
            >
              {journeyForm.heading}
            </h2>

            <p className="mt-4 text-lead text-ink-muted">{journeyForm.lead}</p>

            <div className="mt-12 min-[1200px]:mt-14">
              <JourneyForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
