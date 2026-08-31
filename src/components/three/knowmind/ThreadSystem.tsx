"use client";

import { type RefObject, useEffect, useImperativeHandle, useMemo } from "react";
import * as THREE from "three";

import { PALETTE, type Tier, TIERS } from "./constants";
import { clamp01 } from "./math";
import { blendThread, buildThreadPoints, visualAt } from "./states";
import { createTube, sweep } from "./tube";

/**
 * The thread.
 *
 * One continuous strand, swept as a tube along a Catmull-Rom spline through a
 * fixed number of control points. The control points are what morph; the tube
 * around them is rebuilt in place every frame into buffers allocated once, so
 * the whole system is a single draw call with zero per-frame allocation.
 *
 * Both ends taper away to almost nothing, which hides the open ends of the tube
 * and — in the final state, where the strand comes round to meet itself — lets
 * the ring read as whole without pretending it never had ends.
 */

export type ThreadHandle = {
  /** stage 0..2, time in animation seconds, dt the frame delta. */
  update(stage: number, time: number, dt: number): void;
};

type ThreadSystemProps = {
  handleRef: RefObject<ThreadHandle | null>;
  tier: Tier;
};

/* -------------------------------------------------------------------------- */

export function ThreadSystem({ handleRef, tier }: ThreadSystemProps) {
  const settings = TIERS[tier];

  const tube = useMemo(
    () => createTube(settings.tubular, settings.radial),
    [settings.tubular, settings.radial],
  );

  const shapes = useMemo(() => {
    const n = settings.control;
    return {
      chaos: buildThreadPoints(0, n),
      flow: buildThreadPoints(1, n),
      clarity: buildThreadPoints(2, n),
      blended: new Float32Array(n * 3),
    };
  }, [settings.control]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(PALETTE.purpleLift),
        emissive: new THREE.Color(PALETTE.honey),
        emissiveIntensity: 0,
        roughness: 0.55,
        metalness: 0.08,
      }),
    [],
  );

  const local = useMemo(() => ({ from: new THREE.Color(), to: new THREE.Color(), accum: 0 }), []);

  useImperativeHandle(
    handleRef,
    () => ({
      update(stage, time, dt) {
        // On the weakest devices the strand is rebuilt at a fixed lower rate.
        // The scene keeps rendering at full speed, so nothing stutters — the
        // thread's own micro-movement simply updates a little less often.
        if (settings.threadHz > 0) {
          local.accum += dt;
          if (local.accum < 1 / settings.threadHz) return;
          local.accum = 0;
        }

        const restless = visualAt("restless", stage);
        const speed = visualAt("restlessSpeed", stage);
        blendThread(
          shapes.blended,
          shapes.chaos,
          shapes.flow,
          shapes.clarity,
          stage,
          time * speed,
          restless,
        );
        sweep(tube, shapes.blended, visualAt("threadRadius", stage));
        tube.positionAttr.needsUpdate = true;
        tube.normalAttr.needsUpdate = true;

        // Deep purple warms into wine violet as the strand loosens, then lifts
        // once more — the thread stays cool so the face can own the warmth.
        const second = stage > 1;
        local.from.set(second ? "#6d2f58" : "#4e2874");
        local.to.set(second ? "#8a4a72" : "#6d2f58");
        material.color.copy(local.from).lerp(local.to, second ? stage - 1 : stage);
        material.emissiveIntensity = visualAt("threadEmissive", stage);
        material.roughness = 0.55 - clamp01(stage / 2) * 0.13;
      },
    }),
    [shapes, tube, material, local, settings.threadHz],
  );

  // Everything here was created by hand rather than by R3F, so it is released
  // by hand too.
  useEffect(() => () => tube.geometry.dispose(), [tube]);
  useEffect(() => () => material.dispose(), [material]);

  return <mesh geometry={tube.geometry} material={material} frustumCulled={false} />;
}
