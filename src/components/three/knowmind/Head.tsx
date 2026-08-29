"use client";

import { type RefObject, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";

import { HEAD, MOTION, type Tier } from "./constants";
import { visualAt } from "./states";
import { ThreadSystem, type ThreadHandle } from "./ThreadSystem";

/**
 * One head.
 *
 * The sculptural form and its material arrive from above and are *shared* by
 * all three — the same geometry object, the same material instance. That is
 * not an optimisation, it is the argument the visual makes: one mind, not
 * three people. Nothing about the head itself is allowed to differ.
 *
 * What belongs to each head is the thread inside its skull, and a breath of
 * idle movement offset in phase so the row never pulses in unison.
 */

export type HeadHandle = {
  update(stage: number, time: number, dt: number, yaw: number, pitch: number): void;
};

type HeadProps = {
  handleRef: RefObject<HeadHandle | null>;
  /** Position in the row. Used only to offset the idle phase. */
  index: 0 | 1 | 2;
  tier: Tier;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  reduced: boolean;
  shadows: boolean;
};

export function Head({
  handleRef,
  index,
  tier,
  geometry,
  material,
  reduced,
  shadows,
}: HeadProps) {
  const group = useRef<THREE.Group>(null);
  const thread = useRef<ThreadHandle | null>(null);
  const phase = useMemo(() => index * MOTION.floatStagger, [index]);

  useImperativeHandle(
    handleRef,
    () => ({
      update(stage, time, dt, yaw, pitch) {
        thread.current?.update(stage, time, dt);

        const g = group.current;
        if (!g) return;

        if (reduced) {
          g.position.y = 0;
          g.rotation.set(0, 0, 0);
          g.scale.setScalar(1);
          return;
        }

        // A tangled mind is never quite still; a clear one nearly is.
        const unrest = visualAt("unrest", stage);

        g.position.y =
          Math.sin(time * MOTION.floatSpeed + phase) *
          MOTION.floatAmplitude *
          (0.55 + 0.45 * unrest);

        g.scale.setScalar(1 + Math.sin(time * MOTION.breathSpeed + phase) * MOTION.breathAmplitude);

        g.rotation.y = yaw + Math.sin(time * 0.21 + phase) * 0.022 * unrest;
        g.rotation.x = pitch;
        g.rotation.z = Math.sin(time * 0.17 + phase * 1.3) * 0.011 * unrest;
      },
    }),
    [phase, reduced],
  );

  return (
    <group ref={group}>
      <mesh
        geometry={geometry}
        material={material}
        castShadow={shadows}
        receiveShadow={shadows}
      />
      {/* The strand is authored in the profile's own coordinates; the head
          geometry was centred on its pivot at build time, so the thread is
          shifted by the same amount to stay in the skull. */}
      <group position={[-HEAD.pivotX, -HEAD.pivotY, 0]}>
        <ThreadSystem handleRef={thread} tier={tier} castShadow={shadows} />
      </group>
    </group>
  );
}
