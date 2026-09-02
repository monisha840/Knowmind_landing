import { Countdown } from "@/components/Countdown";

/**
 * The countdown, pinned to the foot of the screen on its own.
 *
 * It used to be the middle child of the pinned top bar, where it was the reason
 * that bar had to wrap: a wordmark, four time boxes and a button do not share
 * one line on a phone, so the bar became two rows at 390px and three at 320px
 * and its height moved with the viewport. Given its own edge it stops competing
 * for that line, and the top bar is a single row at every width again.
 *
 * ── Why `position: sticky` rather than `fixed` ────────────────────────────
 *
 * A fixed bar is out of flow, so it hangs over whatever is at the bottom of the
 * document — the footer here — and the only fix is to pad the page by however
 * tall the bar happens to be and keep the two numbers in step by hand. That is
 * the trap the old `StickyMobileCTA` had to work around with `pb-[4.5rem]`.
 *
 * A sticky element in normal flow reserves its own height, so the footer can
 * never be covered no matter what the bar ends up measuring — including when
 * the safe-area inset makes it taller on a notched phone. It is the last child
 * of `.ref-page` so it sticks to the viewport's bottom edge for the whole
 * scroll and lands naturally at the end of the document. Same mechanism the top
 * bar already uses, one edge down.
 *
 * A server component; only `Countdown` inside it needs the browser.
 */
export function CountdownBar() {
  return (
    <div className="countdown-bar">
      <Countdown />
    </div>
  );
}
