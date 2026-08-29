"use client";

import { type RefObject, useEffect, useImperativeHandle, useMemo } from "react";
import * as THREE from "three";

import { lerpHueShort } from "./color";
import { PALETTE, type Tier, TIERS, threadWarmth } from "./constants";
import { blendThread, buildThreadPoints, visualAt } from "./states";
import { createTube, sweep } from "./tube";

/**
 * The thread inside one skull.
 *
 * A single continuous strand, swept as a tube along a Catmull-Rom spline
 * through a fixed number of control points. The control points are what morph;
 * the tube around them is rebuilt in place every frame into buffers allocated
 * once, so each strand is one draw call with zero per-frame allocation.
 *
 * Both ends taper away to nothing, which hides the open ends of the tube and
 * lets the strand read as one length of thread that begins and ends somewhere
 * rather than as a closed loop.
 */

export type ThreadHandle = {
  /** stage 0..2, time in animation seconds, dt the frame delta. */
  update(stage: number, time: number, dt: number): void;
};

type ThreadSystemProps = {
  handleRef: RefObject<ThreadHandle | null>;
  tier: Tier;
  castShadow?: boolean;
};

/* -------------------------------------------------------------------------- */

export function ThreadSystem({ handleRef, tier, castShadow = false }: ThreadSystemProps) {
  const settings = TIERS[tier];

  const tube = useMemo(
    () => createTube(settings.tubular, settings.radial),
    [settings.tubular, settings.radial],
  );

  const shapes = useMemo(() => {
    const n = settings.control;
    return {
      tangled: buildThreadPoints(0, n),
      unraveling: buildThreadPoints(1, n),
      clear: buildThreadPoints(2, n),
      blended: new Float32Array(n * 3),
    };
  }, [settings.control]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(PALETTE.wineLift),
        roughness: 0.52,
        metalness: 0.05,
      }),
    [],
  );

  const local = useMemo(
    () => ({
      from: new THREE.Color(PALETTE.wineLift),
      to: new THREE.Color(PALETTE.honey),
      accum: 0,
    }),
    [],
  );

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

        blendThread(
          shapes.blended,
          shapes.tangled,
          shapes.unraveling,
          shapes.clear,
          stage,
          time * visualAt("restlessSpeed", stage),
          visualAt("restless", stage),
        );
        sweep(tube, shapes.blended, visualAt("threadRadius", stage));
        tube.positionAttr.needsUpdate = true;
        tube.normalAttr.needsUpdate = true;

        // Wine violet warms toward honey, but late: at UNRAVELING the strand
        // should carry only a hint of gold, which is what `threadWarmth`
        // encodes. The hue takes the short way round, so it passes through
        // amber rather than through the cyan a linear hue lerp would give.
        const warmth = threadWarmth(stage);
        lerpHueShort(material.color, local.from, local.to, warmth, 0.3);
        material.roughness = 0.52 - warmth * 0.14;
      },
    }),
    [shapes, tube, material, local, settings.threadHz],
  );

  // Everything here was created by hand rather than by R3F, so it is released
  // by hand too.
  useEffect(() => () => tube.geometry.dispose(), [tube]);
  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh
      geometry={tube.geometry}
      material={material}
      castShadow={castShadow}
      frustumCulled={false}
    />
  );
}
