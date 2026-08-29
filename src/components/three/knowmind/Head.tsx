"use client";

import { type RefObject, useImperativeHandle, useRef } from "react";
import * as THREE from "three";

import { HEAD, MOTION, type Tier } from "./constants";
import { ThreadSystem, type ThreadHandle } from "./ThreadSystem";

/**
 * The head.
 *
 * The sculptural form and its material arrive from above and never change —
 * not between states, not across the whole scroll. What belongs to this
 * component is the thread inside the cranium and a breath of idle movement
 * small enough that a visitor registers it as alive rather than as animation.
 */

export type HeadHandle = {
  update(stage: number, time: number, dt: number): void;
};

type HeadProps = {
  handleRef: RefObject<HeadHandle | null>;
  tier: Tier;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  reduced: boolean;
  shadows: boolean;
};

export function Head({ handleRef, tier, geometry, material, reduced, shadows }: HeadProps) {
  const group = useRef<THREE.Group>(null);
  const thread = useRef<ThreadHandle | null>(null);

  useImperativeHandle(
    handleRef,
    () => ({
      update(stage, time, dt) {
        thread.current?.update(stage, time, dt);

        const g = group.current;
        if (!g) return;

        if (reduced) {
          g.position.y = 0;
          g.scale.setScalar(1);
          return;
        }

        g.position.y = Math.sin(time * MOTION.floatSpeed) * MOTION.floatAmplitude;
        g.scale.setScalar(1 + Math.sin(time * MOTION.breathSpeed) * MOTION.breathAmplitude);
      },
    }),
    [reduced],
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
          shifted by the same amount to stay inside the skull. */}
      <group position={[-HEAD.pivotX, -HEAD.pivotY, 0]}>
        <ThreadSystem handleRef={thread} tier={tier} castShadow={shadows} />
      </group>
    </group>
  );
}
