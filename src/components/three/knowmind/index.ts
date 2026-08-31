/**
 * KnowMind3D — the scroll-driven psychological growth character.
 *
 *   <section ref={track} className="relative">
 *     <div className="sticky top-0 h-[100svh]">
 *       <KnowMind3D trackRef={track} align="right" className="h-full w-full" />
 *     </div>
 *     … three screens of copy, one per state …
 *   </section>
 *
 * One character. The thread around it reorganises from a tangle, through
 * loosening loops, into a clean halo as the visitor scrolls — and back again on
 * the way up. See `MindEvolution.tsx` for the full integration, and README.md
 * for the component contract, the quality tiers and the performance notes.
 */

export { KnowMind3D, type KnowMind3DProps } from "./KnowMind3D";
export { KnowMindFallback, KnowMindGlyph } from "./KnowMindFallback";
export { useScrollProgress } from "./useScrollProgress";
export { usePerformanceTier } from "./usePerformanceTier";
export { useWebGL2Support } from "./useWebGL2";
export {
  chapterAt,
  CHAOS,
  FLOW,
  CLARITY,
  STATE_LABELS,
  PALETTE,
  type Tier,
} from "./constants";
