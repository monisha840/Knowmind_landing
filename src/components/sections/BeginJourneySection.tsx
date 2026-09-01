import { AnchorLanding } from "@/components/ui/AnchorLanding";
import { JourneyForm } from "@/components/ui/JourneyForm";
import { LazyVideo } from "@/components/ui/LazyVideo";
import { journeyForm } from "@/lib/content";

/**
 * Begin your journey — the registration questions.
 *
 * An editorial spread rather than a form on a page: Kaleeswaran holds one side
 * and the questions the other, asked one at a time. Deliberately a server
 * component — the heading is static, and the two things that need
 * the client — the video and the stepper — are their own components rather
 * than a reason to send the whole section to the browser.
 *
 * Three compositions, each drawn for its own width rather than scaled from the
 * one above it:
 *
 *   ≥ 1200px   video left at 43%, questions right — the footage bleeds to
 *              the viewport edge, because a portrait in a card is a bio, not
 *              an invitation. Exactly one screen tall: every call to action on
 *              the page lands here, and it should arrive at a whole
 *              composition rather than at a slice of one with the next
 *              section showing underneath
 *   768–1199   stacked: a wide band of video, questions beneath
 *   ≤ 767px    a compact band sized in svh so the first question is reachable
 *              without scrolling, questions full width beneath
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

      <div className="grid min-[1200px]:min-h-svh min-[1200px]:grid-cols-[43fr_57fr]">
        {/* ---------------- Kaleeswaran ---------------- */}
        {/* Flex rather than a percentage height: `h-full` inside a stretched
            grid item does not resolve here, so the media stopped at its
            min-height and left paper below it. Stretch fills the column
            whatever the screen is. */}
        <div className="relative min-[1200px]:flex">
          {/*
            Heights are per-composition, not one value scaled. `svh` on phones
            because the browser chrome makes `vh` lie; capped so a tall phone
            does not hand the whole first screen to the video, floored so a
            short one still shows a face rather than a stripe.

            These heights are unchanged from the photograph this replaced. The
            video fills exactly the box the picture filled, so the section's
            proportions, the form's position and the page's total height are
            all where they were.
          */}
          {/* Every height here is scoped below 1200 on purpose. Left open-ended
              they also apply on desktop, where an arbitrary `md:h-[38vh]` wins
              the cascade over anything static this side of it — so the column
              would sit at 38vh instead of filling the screen. Above 1200 no
              height rule applies at all and the flex stretch does the work. */}
          <div className="relative w-full overflow-hidden max-[1200px]:h-[30svh] max-[1200px]:max-h-[300px] max-[1200px]:min-h-[190px] min-[420px]:max-[1200px]:h-[32svh] md:max-[1200px]:h-[38vh] md:max-[1200px]:max-h-[430px]">
            {/*
              Two treatments, because the box and the footage want different
              things at different widths.

              The footage is 1280x720 — 1.78:1. Below `md` the band is close to
              that shape (390x253 is 1.54:1, 320x190 is 1.68:1), so `cover`
              takes 20 to 60 pixels off the sides and the whole composition
              survives. That is the version already on phones and it is left
              exactly as it was.

              From `md` the box stops agreeing. The desktop column is 43fr of
              the grid and a full screen tall — 619x900 at 1440, which is
              0.69:1. `cover` there scales the frame to 1600x900 and clips it to
              619 wide: 39% of the picture, with the badge ring and both wings
              outside the box. That was the crop.

              So from `md` the foreground contains instead — whole frame, no
              distortion, centred, as large as the column allows — and the
              letterbox is filled by `backdropClassName` below rather than left
              as a flat band.

              The `object-position` only applies below `md`. Kaleeswaran sits at
              50.6% across and his head starts 7.9% down, so 51% centres him and
              12% keeps the crop high enough to clear his head wherever the box
              runs wider than 16:9. `contain` centres on its own, which is why
              `md:object-center` takes over.

              Verified by screenshot at 320, 375, 390, 430, 768, 1024, 1280,
              1440 and 1920 rather than derived and hoped for.
            */}
            <LazyVideo
              src="/kalee/kalee-intro.mp4"
              poster="/kalee/kalee-intro-poster.webp"
              className="absolute inset-0 z-10 h-full w-full object-cover object-[51%_12%] md:object-contain md:object-center"
              /*
                The same file again, covering the panel behind the contained
                copy so the bars read as the footage's own colour rather than as
                a flat band.

                Lightened rather than darkened, which is worth saying because it
                is the opposite of the usual instinct. The footage is shot on a
                near-white ground, so a *darker* blur puts a grey field above and
                below a bright picture and the panel reads as three stacked
                bands — tried it, that is exactly what it looked like. Lifting
                the blur toward the footage's own white and draining most of the
                colour out of it is what actually lowers the contrast, which is
                the thing the treatment is for.

                `scale-110` is here to hide an artefact, not to crop anything: a
                blur samples past the element's edge and fades to transparent
                there, which would draw a soft light rim around the panel. The
                overscan pushes that rim outside the box, which is why the
                parent gained `overflow-hidden`. It only ever affects this
                blurred layer — the foreground is untouched.
              */
              backdropClassName="absolute inset-0 h-full w-full scale-110 object-cover object-center blur-3xl brightness-[1.08] saturate-[0.45]"
              // Only where the shapes actually disagree. Phones get one
              // decoder, as before.
              backdropQuery="(min-width: 768px)"
            />

            {/* Paper over the blurred layer, and only over that one.

                The blur alone still carries the suit's darkness through as a
                grey cast, because `cover` samples the middle of the frame and
                the middle of the frame is a black jacket. This settles it onto
                the section's own paper instead, so the letterbox is a field the
                page already contains rather than a dimmed still of the video.
                It sits under the sharp copy at `z-[5]`, so nothing it does
                reaches the picture.

                `hidden` below `md` because there is no backdrop to wash there —
                the phone's video covers its band on its own, and a paper veil
                over it would only mute it. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[5] hidden bg-paper/85 md:block"
            />

            {/* Ties the footage into the palette and lets the paper side of
                the spread meet it without a hard seam. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-wine-950/25 to-transparent min-[1200px]:bg-gradient-to-r min-[1200px]:from-transparent min-[1200px]:via-transparent min-[1200px]:to-paper/30"
            />
          </div>
        </div>

        {/* ---------------- The questions ---------------- */}
        <div className="flex flex-col justify-center px-(--spacing-gutter) py-14 sm:py-16 md:py-20 min-[1200px]:py-24">
          <div className="mx-auto w-full max-w-xl min-[1200px]:mx-0 min-[1200px]:max-w-[34rem] min-[1200px]:pl-4 xl:pl-10">
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
