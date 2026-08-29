/**
 * KnowMind3D — the scroll-driven psychological triptych.
 *
 *   <section ref={track} className="relative">
 *     <div className="sticky top-0 h-[100svh]">
 *       <KnowMind3D trackRef={track} className="h-full w-full" />
 *     </div>
 *     … three screens of copy, one per state …
 *   </section>
 *
 * Three identical sculptural heads; only the thread inside each skull differs.
 * See `MindEvolution.tsx` for the full integration, and README.md for the
 * component contract, the quality tiers and the performance notes.
 */

export { KnowMind3D, type KnowMind3DProps } from "./KnowMind3D";
export { KnowMindFallback, KnowMindHead } from "./KnowMindFallback";
export { useScrollProgress } from "./useScrollProgress";
export { usePerformanceTier } from "./usePerformanceTier";
export { useWebGL2Support } from "./useWebGL2";
export {
  chapterAt,
  headStage,
  TANGLED,
  UNRAVELING,
  CLEAR,
  STATE_LABELS,
  PALETTE,
  type Tier,
} from "./constants";
