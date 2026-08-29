import * as THREE from "three";

import { lerp } from "./math";

/**
 * Blend two colours the short way round the hue wheel.
 *
 * three's own `Color.lerpHSL` interpolates hue linearly, which takes the
 * *long* way whenever the two hues are more than half a turn apart. Wine
 * violet sits at about 318° and honey at about 40°: a linear lerp runs
 * 318 → 179 → 40 and puts a bright cyan character on the page halfway through
 * the transition. Going the short way runs 318 → 0 → 40 instead, through red
 * and orange, which is both on-palette and exactly the warming the story
 * wants.
 *
 * Straight RGB interpolation is not an option either — it drops through a
 * desaturated brown in the middle.
 */
const hslA = { h: 0, s: 0, l: 0 };
const hslB = { h: 0, s: 0, l: 0 };

export function lerpHueShort(
  out: THREE.Color,
  from: THREE.Color,
  to: THREE.Color,
  t: number,
  /**
   * How far to pull saturation down at the midpoint. Wine violet and honey sit
   * on opposite shoulders of red, so the short path passes through it; without
   * this the character spends a moment as a fire-engine red disc. Easing the
   * saturation out and back turns that moment into a dusty clay instead —
   * still a warming, no longer an alarm.
   */
  satDip = 0,
) {
  from.getHSL(hslA);
  to.getHSL(hslB);

  let dh = hslB.h - hslA.h;
  if (dh > 0.5) dh -= 1;
  else if (dh < -0.5) dh += 1;

  out.setHSL(
    (hslA.h + dh * t + 1) % 1,
    lerp(hslA.s, hslB.s, t) * (1 - satDip * Math.sin(Math.PI * t)),
    lerp(hslA.l, hslB.l, t),
  );
  return out;
}
