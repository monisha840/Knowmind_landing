"use client";

import { useId } from "react";

/**
 * The KnowMind mark, tumbling on its long axis.
 *
 * A flat SVG rotated on Y vanishes to a hairline every half turn, which at logo
 * size reads as a glitch rather than a rotation. So the mark is a stack of
 * copies a little over a pixel apart inside a `preserve-3d` parent: that
 * extrudes the flat path into a slab with something to show edge-on.
 *
 * Layer count and spacing are a pair, not two free choices. The tube renders
 * about 1.3px wide at header size, so a gap wider than that shows daylight
 * between the slices and the mark reads as a coil of separate rings. See
 * `DEPTH` for the measurements behind the value chosen here.
 *
 * Deliberately not WebGL, even though this page already ships three.js: at 30px
 * a shader's fresnel core and layered bloom are invisible, and a canvas in a
 * fixed header costs a draw call every frame for the whole session.
 *
 * Sizing: pass `height` for a fixed pixel size, or leave it off and size with
 * Tailwind classes — the stylesheet's default sits at zero specificity via
 * `:where()` so a utility class wins without a fight. Width must stay 2× height,
 * which is the viewBox ratio.
 *
 *   <TumblingMark height={30} />
 *   <TumblingMark className="h-8 w-16" seconds={20} />
 *   <TumblingMark height={30} label="KnowMind Universe" />
 */

/**
 * Slice count and spacing, which are one decision rather than two.
 *
 * The slab has to be thick enough not to disappear edge-on, and the slices
 * close enough together that they never separate into visible rings. Those pull
 * in opposite directions if you only tune the spacing, because adjacent slices
 * come apart once `tan(angle) > tubeWidth / DEPTH` — the tube renders about
 * 1.6px wide at header size, so:
 *
 *   DEPTH 1.1 → gaps from 55°, a third of every turn showing daylight
 *   DEPTH 0.5 → gaps from 73°, but 12 gaps only make a 6px slab, which lights
 *               1% of the box at 90° and reads as the logo blinking out
 *
 * Thickness has to come from the layer count instead. Measured on the shipped
 * path, counting separate lit runs across three scan lines (3 = one solid
 * object, more = that many gaps):
 *
 *   layers × depth   thick   90° lit    55°  65°  75°  85°
 *   13 × 0.5          6.0px     1.0%      9    6    3   18
 *   13 × 1.1         13.2px     2.5%      3   19   32   40   ← visibly striped
 *   29 × 0.45        12.6px     3.0%      3    3    3   19
 *   33 × 0.4         12.8px     3.7%      3    3    3   15
 *   41 × 0.32        12.8px     4.7%      3    3    3    9   ← chosen
 *
 * 41 × 0.32 is solid everywhere the mark is big enough to read, and lights the
 * most of any option at 90°. Two marks turning together hold a locked 16.7ms
 * frame at every count tried, because the rotation is a single transform on the
 * parent and only the two faces carry the blur — so the layers cost markup, not
 * frames, and the markup is why the path is drawn once and `<use>`d below.
 *
 * Scaling the mark far past header size means raising DEPTH in proportion.
 */
const LAYERS = 41;
const DEPTH = 0.32;

/** A lemniscate of Bernoulli, sampled to a polyline on a 240×120 viewBox. */
const LEMNISCATE =
  "M212.9,60.0L212.7,55.1L212.1,50.3L211.0,45.7L209.6,41.2L207.8,37.1L205.7,33.2L203.3,29.7L200.7,26.6L197.8,23.9L194.9,21.6L191.8,19.7L188.6,18.2L185.4,17.2L182.2,16.4L179.0,16.1L175.9,16.0L172.7,16.2L169.7,16.8L166.7,17.5L163.8,18.5L161.0,19.7L158.2,21.0L155.6,22.6L153.0,24.2L150.5,26.0L148.1,27.9L145.8,29.9L143.5,31.9L141.3,34.1L139.2,36.3L137.1,38.5L135.1,40.8L133.1,43.1L131.1,45.5L129.2,47.9L127.4,50.3L125.5,52.7L123.7,55.1L121.8,57.6L120.0,60.0L118.2,62.4L116.3,64.9L114.5,67.3L112.6,69.7L110.8,72.1L108.9,74.5L106.9,76.9L104.9,79.2L102.9,81.5L100.8,83.7L98.7,85.9L96.5,88.1L94.2,90.1L91.9,92.1L89.5,94.0L87.0,95.8L84.4,97.4L81.8,99.0L79.0,100.3L76.2,101.5L73.3,102.5L70.3,103.2L67.3,103.8L64.1,104.0L61.0,103.9L57.8,103.6L54.6,102.8L51.4,101.8L48.2,100.3L45.1,98.4L42.2,96.1L39.3,93.4L36.7,90.3L34.3,86.8L32.2,82.9L30.4,78.8L29.0,74.3L27.9,69.7L27.3,64.9L27.1,60.0L27.3,55.1L27.9,50.3L29.0,45.7L30.4,41.2L32.2,37.1L34.3,33.2L36.7,29.7L39.3,26.6L42.2,23.9L45.1,21.6L48.2,19.7L51.4,18.2L54.6,17.2L57.8,16.4L61.0,16.1L64.1,16.0L67.3,16.2L70.3,16.8L73.3,17.5L76.2,18.5L79.0,19.7L81.8,21.0L84.4,22.6L87.0,24.2L89.5,26.0L91.9,27.9L94.2,29.9L96.5,31.9L98.7,34.1L100.8,36.3L102.9,38.5L104.9,40.8L106.9,43.1L108.9,45.5L110.8,47.9L112.6,50.3L114.5,52.7L116.3,55.1L118.2,57.6L120.0,60.0L121.8,62.4L123.7,64.9L125.5,67.3L127.4,69.7L129.2,72.1L131.1,74.5L133.1,76.9L135.1,79.2L137.1,81.5L139.2,83.7L141.3,85.9L143.5,88.1L145.8,90.1L148.1,92.1L150.5,94.0L153.0,95.8L155.6,97.4L158.2,99.0L161.0,100.3L163.8,101.5L166.7,102.5L169.7,103.2L172.7,103.8L175.9,104.0L179.0,103.9L182.2,103.6L185.4,102.8L188.6,101.8L191.8,100.3L194.9,98.4L197.8,96.1L200.7,93.4L203.3,90.3L205.7,86.8L207.8,82.9L209.6,78.8L211.0,74.3L212.1,69.7L212.7,64.9L212.9,60.0Z";

type TumblingMarkProps = {
  /** Fixed pixel height. Width follows at 2:1. Omit to size with `className`. */
  height?: number;
  /** Seconds per full rotation. */
  seconds?: number;
  className?: string;
  /**
   * Only when the mark is the *only* thing naming its link. Beside a wordmark
   * leave it null: announcing the brand twice in one link is worse than not
   * announcing it at all.
   */
  label?: string | null;
};

export function TumblingMark({
  height,
  seconds = 12,
  className = "",
  label = null,
}: TumblingMarkProps) {
  /*
   * Unique ids per instance.
   *
   * The gradient and the filter are referenced by id, and two marks on one page
   * sharing an id is invalid HTML — the browser resolves url(#…) to whichever
   * comes first, so unmounting that instance silently strips the gradient from
   * every other one. The navbar and the footer both render a mark, so this is
   * load-bearing here, not theoretical.
   */
  const uid = useId().replace(/:/g, "");
  const stroke = `km-stroke-${uid}`;
  const glow = `km-glow-${uid}`;
  const shape = `km-shape-${uid}`;

  return (
    <span
      className={`km-mark ${className}`}
      style={height ? { height, width: height * 2 } : undefined}
      role={label ? "img" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
    >
      <span className="km-mark-inner" style={{ animationDuration: `${seconds}s` }}>
        <svg className="km-defs" aria-hidden>
          <defs>
            <linearGradient id={stroke} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FDB406" />
              <stop offset="45%" stopColor="#FFD470" />
              <stop offset="100%" stopColor="#8B2FE8" />
            </linearGradient>
            <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="b" />
              </feMerge>
            </filter>

            {/* Drawn once. Forty-one copies of 2.6kB of path data would be a
                quarter of a megabyte of DOM for a logo; each slice below is a
                hundred-byte `use` of this instead. */}
            <path id={shape} d={LEMNISCATE} />
          </defs>
        </svg>

        {Array.from({ length: LAYERS }, (_, i) => {
          const face = i === 0 || i === LAYERS - 1;
          return (
            <svg
              key={i}
              viewBox="0 0 240 120"
              fill="none"
              style={{
                transform: `translateZ(${(i - (LAYERS - 1) / 2) * DEPTH}px)`,
                // The faces carry full weight; the slices between them are the
                // edge, and at full opacity they smear the glow.
                opacity: face ? 1 : 0.42,
              }}
            >
              {/*
                Only the faces carry the blur. Rasterising an feGaussianBlur per
                layer per frame is most of the cost of the whole thing — dropping
                it from the eleven interior slices cut paint and raster work by
                roughly a third, which is worth having in a header that renders
                on every page.
              */}
              {face && (
                <use
                  href={`#${shape}`}
                  stroke={`url(#${stroke})`}
                  strokeWidth="9"
                  strokeLinecap="round"
                  filter={`url(#${glow})`}
                  opacity="0.75"
                />
              )}
              <use
                href={`#${shape}`}
                stroke={`url(#${stroke})`}
                strokeWidth="6"
                strokeLinecap="round"
              />
              {face && (
                <use
                  href={`#${shape}`}
                  stroke="#FFFFFF"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  opacity="0.85"
                />
              )}
            </svg>
          );
        })}
      </span>
    </span>
  );
}
