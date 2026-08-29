"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { Pointer } from "@/lib/hooks";
import {
  HEAD,
  LAYOUT,
  MOTION,
  PALETTE,
  headStage,
  type Tier,
  TIERS,
} from "./constants";
import { Head, type HeadHandle } from "./Head";
import { buildHeadGeometry } from "./headGeometry";
import { clamp, damp, lerp, smoothstep } from "./math";

/**
 * The triptych, and the one place per-frame work happens.
 *
 * Everything below this point is driven from a single `useFrame`: React never
 * re-renders while the visitor scrolls. Scroll progress arrives as a ref and is
 * turned into three separate stages, one per head — the left head holds at
 * TANGLED, the middle reorganises as far as UNRAVELING, the right goes all the
 * way to CLEAR. They begin identical and separate as you scroll, which is the
 * only honest way to show one mind in three states.
 *
 * Each stage is damped, so a flick of the wheel still reads as a
 * transformation rather than a jump cut.
 */

type HeadRowProps = {
  progressRef: RefObject<number>;
  pointer: RefObject<Pointer>;
  tier: Tier;
  reduced: boolean;
};

const INDICES = [0, 1, 2] as const;

export function HeadRow({ progressRef, pointer, tier, reduced }: HeadRowProps) {
  const settings = TIERS[tier];
  const { size, camera } = useThree();

  /* -- one geometry, one material, three heads --------------------------- */

  const geometry = useMemo(
    () => buildHeadGeometry(settings.headProfileSamples, settings.headSlices),
    [settings.headProfileSamples, settings.headSlices],
  );

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(PALETTE.headBase),
        roughness: 0.86,
        metalness: 0,
      }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  const slots = useRef<(THREE.Group | null)[]>([null, null, null]);

  // Three stable refs rather than an array of them: a ref object recreated on
  // render would detach and reattach the imperative handle every time.
  const headA = useRef<HeadHandle | null>(null);
  const headB = useRef<HeadHandle | null>(null);
  const headC = useRef<HeadHandle | null>(null);
  const heads = useMemo(() => [headA, headB, headC], []);

  /* -- per-frame state, deliberately outside React ----------------------- */

  const live = useMemo(
    () => ({
      stage: [-1, -1, -1] as number[],
      time: 0,
      yaw: 0,
      pitch: 0,
      pan: 0,
      camZ: MOTION.cameraNear as number,
    }),
    [],
  );

  useFrame((_, rawDelta) => {
    // Clamp: a backgrounded tab hands back one enormous delta on return, and an
    // un-clamped damp would teleport straight past the transformation.
    const dt = Math.min(rawDelta, 0.05);
    const progress = progressRef.current ?? 0;

    if (!reduced) live.time += dt;
    const time = live.time;

    /* -- camera: closer at the start, a touch wider by the end ----------- */
    const perspective = camera as THREE.PerspectiveCamera;
    live.camZ = damp(
      live.camZ,
      lerp(MOTION.cameraNear, MOTION.cameraFar, smoothstep(0, 1, progress)),
      2.4,
      dt,
    );
    perspective.position.z = live.camZ;

    const visibleHeight = 2 * Math.tan((perspective.fov * Math.PI) / 360) * live.camZ;
    const visibleWidth = visibleHeight * (size.width / Math.max(size.height, 1));

    /* -- layout ---------------------------------------------------------- */
    const wide = size.width >= LAYOUT.mobileBreakpoint;
    // Wide: three equal columns, so the heads land on the sixths and the HTML
    // labels underneath line up with them. Narrow: the row is spread out and
    // the camera tracks along it instead, because three heads at a sixth of a
    // phone's width are unreadable.
    const spacing = wide
      ? visibleWidth / LAYOUT.columns
      : visibleWidth * LAYOUT.mobileSpread;

    const scale = clamp(
      Math.min(
        (spacing * LAYOUT.columnFill) / HEAD.depth,
        (visibleHeight * LAYOUT.heightFill) / HEAD.height,
      ),
      LAYOUT.minScale,
      LAYOUT.maxScale,
    );

    // The pan lingers on each head rather than sliding evenly past all three.
    const targetPan = wide
      ? 0
      : (smoothstep(0.06, 0.34, progress) + smoothstep(0.52, 0.82, progress)) - 1;
    live.pan = damp(live.pan, targetPan, 3, dt);
    perspective.position.x = live.pan * spacing;

    /* -- cursor lean ----------------------------------------------------- */
    const targetYaw = reduced ? 0 : (pointer.current?.x ?? 0) * MOTION.pointerYaw;
    const targetPitch = reduced ? 0 : (pointer.current?.y ?? 0) * MOTION.pointerPitch;
    live.yaw = damp(live.yaw, targetYaw, MOTION.pointerLambda, dt);
    live.pitch = damp(live.pitch, targetPitch, MOTION.pointerLambda, dt);

    /* -- the heads ------------------------------------------------------- */
    for (let i = 0; i < 3; i += 1) {
      const target = headStage(i as 0 | 1 | 2, progress);
      // -1 means "not yet initialised", so a refresh halfway down the section
      // lands on the right state instead of animating to it from the tangle.
      if (live.stage[i] < 0) live.stage[i] = target;
      else live.stage[i] = damp(live.stage[i], target, MOTION.stageLambda, dt);

      const slot = slots.current[i];
      if (slot) {
        const x = (i - 1) * spacing;
        slot.position.x = x;
        // Each head is turned to face the camera. A wide canvas puts the outer
        // two more than thirty degrees off axis, and left alone they would read
        // as three-quarter views of two different people — the one thing this
        // visual cannot afford. Their size needs no correction: all three sit in
        // the same plane, so the perspective divide scales them identically.
        // Perspective still does its work *within* each head, which is what
        // makes them sculptural rather than flat.
        slot.rotation.y = -Math.atan2(x - perspective.position.x, live.camZ);
        slot.scale.setScalar(scale);
      }

      heads[i].current?.update(live.stage[i], time, dt, live.yaw, live.pitch);
    }
  });

  return (
    <group>
      {INDICES.map((i) => (
        <group
          key={i}
          ref={(el) => {
            slots.current[i] = el;
          }}
        >
          <Head
            handleRef={heads[i]}
            index={i}
            tier={tier}
            geometry={geometry}
            material={material}
            reduced={reduced}
            shadows={settings.shadows}
          />
        </group>
      ))}
    </group>
  );
}
