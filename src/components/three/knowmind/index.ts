/**
 * KnowMind3D — one sculptural head, and the mind inside it.
 *
 *   <section ref={track} className="relative">
 *     <div className="sticky top-0 h-[100svh]">
 *       <KnowMind3D trackRef={track} className="h-full w-full" />
 *     </div>
 *     … three screens of copy, one per state …
 *   </section>
 *
 * The head never changes. The thread in its cranium reorganises from a tangle,
 * through an unravelling, into a clear spiral as the visitor scrolls. See
 * `MindEvolution.tsx` for the full integration, and README.md for the component
 * contract, the quality tiers and the performance notes.
 */

export { KnowMind3D, type KnowMind3DProps } from "./KnowMind3D";
export { KnowMindFallback, KnowMindHead } from "./KnowMindFallback";
export { useScrollProgress } from "./useScrollProgress";
export { usePerformanceTier } from "./usePerformanceTier";
export { useWebGL2Support } from "./useWebGL2";
export {
  chapterAt,
  threadStage,
  TANGLED,
  UNRAVELING,
  CLEAR,
  STATE_LABELS,
  PALETTE,
  type Tier,
} from "./constants";
