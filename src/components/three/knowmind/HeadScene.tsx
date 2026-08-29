"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { Pointer } from "@/lib/hooks";
import { HEAD, LAYOUT, MOTION, PALETTE, type Tier, TIERS, threadStage } from "./constants";
import { Head, type HeadHandle } from "./Head";
import { buildHeadGeometry } from "./headGeometry";
import { clamp, damp, lerp, smoothstep } from "./math";

/**
 * The scene, and the one place per-frame work happens.
 *
 * One head, held still. Everything below this point is driven from a single
 * `useFrame`: React never re-renders while the visitor scrolls. Scroll progress
 * arrives as a ref, becomes a continuous stage in 0..2, and is damped — so a
 * flick of the wheel still reads as a transformation rather than a jump cut.
 *
 * The head geometry is identical at every stage. Only the thread inside it and
 * the colour of that thread change.
 */

type HeadSceneProps = {
  progressRef: RefObject<number>;
  pointer: RefObject<Pointer>;
  tier: Tier;
  reduced: boolean;
  align: "center" | "right";
};

export function HeadScene({ progressRef, pointer, tier, reduced, align }: HeadSceneProps) {
  const settings = TIERS[tier];
  const { size, camera } = useThree();

  const geometry = useMemo(
    () => buildHeadGeometry(settings.sections, settings.around),
    [settings.sections, settings.around],
  );

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(PALETTE.headBase),
        roughness: 0.82,
        metalness: 0,
        // The head is a closed solid — the cranial recess is pressed into it,
        // not cut through it — so back faces never need to be drawn.
        side: THREE.FrontSide,
      }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  const slot = useRef<THREE.Group>(null);
  const head = useRef<HeadHandle | null>(null);

  const live = useMemo(
    () => ({
      stage: -1,
      time: 0,
      yaw: 0,
      pitch: 0,
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

    /* -- state ----------------------------------------------------------- */
    const target = threadStage(progress);
    // -1 means "not yet initialised", so a refresh halfway down the section
    // lands on the right state instead of animating to it from the tangle.
    if (live.stage < 0) live.stage = target;
    else live.stage = damp(live.stage, target, MOTION.stageLambda, dt);

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

    /* -- fit -------------------------------------------------------------- */
    // On a wide canvas height decides; on a narrow one width does, which is why
    // both are checked rather than assuming a shape.
    //
    // Standing beside a column of copy, the head only has half the frame to
    // work with, so it is measured against that half rather than the whole
    // canvas — otherwise it sizes itself to a width the copy is occupying.
    const sideBySide = align === "right" && size.width >= LAYOUT.narrowBreakpoint;
    const usableWidth = sideBySide ? visibleWidth * LAYOUT.sideFill : visibleWidth;
    const scale = clamp(
      Math.min(
        (visibleHeight * LAYOUT.heightFill) / HEAD.height,
        (usableWidth * LAYOUT.widthFill) / HEAD.depth,
      ),
      LAYOUT.minScale,
      LAYOUT.maxScale,
    );

    // Sit in the right half, but never so far that the nose or the occiput
    // leaves the frame.
    const offsetX = sideBySide
      ? Math.max(
          Math.min(visibleWidth * 0.24, 2.6, visibleWidth / 2 - (HEAD.depth / 2) * scale),
          0,
        )
      : 0;

    /* -- cursor lean ------------------------------------------------------ */
    const targetYaw = reduced ? 0 : (pointer.current?.x ?? 0) * MOTION.pointerYaw;
    const targetPitch = reduced ? 0 : (pointer.current?.y ?? 0) * MOTION.pointerPitch;
    live.yaw = damp(live.yaw, targetYaw, MOTION.pointerLambda, dt);
    live.pitch = damp(live.pitch, targetPitch, MOTION.pointerLambda, dt);

    if (slot.current) {
      slot.current.scale.setScalar(scale);
      slot.current.position.x = damp(slot.current.position.x, offsetX, 3, dt);
      // Turned a few degrees off dead profile so the cheek and the brow catch
      // light and the cranial window opens toward the viewer. Any further and
      // it stops reading as a profile.
      slot.current.rotation.y = -MOTION.baseYaw + live.yaw;
      slot.current.rotation.x = live.pitch;
    }

    head.current?.update(live.stage, time, dt);
  });

  return (
    <group ref={slot}>
      <Head
        handleRef={head}
        tier={tier}
        geometry={geometry}
        material={material}
        reduced={reduced}
        shadows={settings.shadows}
      />
    </group>
  );
}
