"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import type { Pointer } from "@/lib/hooks";
import { CoreGlow } from "./CoreGlow";
import { OrbitalField } from "./OrbitalField";

/**
 * The growth object.
 *
 * The method, made geometric:
 *   · a warm point of light at the centre — the 1%
 *   · orbits woven at the golden angle — repetition, cycles within cycles
 *   · two drawn rings — the shape those cycles trace over time
 *
 * It breathes, it leans toward the cursor, and it warms from wine violet
 * toward honey as the visitor scrolls from night into dawn.
 *
 * Everything is additively blended and view-shaded — there is not a single
 * light in the scene, which keeps it cheap and keeps it from ever blowing out
 * over the copy.
 */

type GrowthObjectProps = {
  pointer: React.RefObject<Pointer>;
  scrollRef: React.RefObject<number>;
  dawnRef: React.RefObject<number>;
  isMobile: boolean;
  reduced: boolean;
};

/** Two drawn accent rings, deliberately close in angle so they read as a pair. */
const ACCENT_RINGS = [
  { radius: 2.92, tilt: [1.16, 0.14, 0.22], speed: 0.02, color: "#e6b44c", opacity: 0.26 },
  { radius: 3.24, tilt: [1.3, -0.2, 0.05], speed: -0.014, color: "#a0538c", opacity: 0.2 },
];

export function GrowthObject({
  pointer,
  scrollRef,
  dawnRef,
  isMobile,
  reduced,
}: GrowthObjectProps) {
  const outer = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  /** Free rotation, accumulated separately from the scroll contribution. */
  const drift = useRef(0);

  const { viewport } = useThree();

  // Desktop: the object sits in the right half so the hero copy owns the left.
  // Mobile: centred, smaller and dimmer — atmosphere behind the text.
  const restingX = isMobile ? 0 : Math.min(viewport.width * 0.2, 2.9);

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.05); // clamp after a tab regains focus
    const t = state.clock.elapsedTime;
    const scroll = scrollRef.current ?? 0;

    if (!reduced) drift.current += d * 0.04;

    if (spin.current) {
      // Base drift plus a slow turn earned by scrolling — by the time the
      // visitor reaches the decision, the object has visibly come round.
      spin.current.rotation.y = drift.current + scroll * Math.PI * 0.9;
      spin.current.rotation.x = 0.1 + scroll * 0.3;
    }

    if (outer.current) {
      // Cursor parallax — a lean, not a spin.
      const px = pointer.current?.x ?? 0;
      const py = pointer.current?.y ?? 0;
      const targetRotY = reduced ? 0 : px * 0.14;
      const targetRotX = reduced ? 0 : py * 0.09;

      outer.current.rotation.y += (targetRotY - outer.current.rotation.y) * Math.min(d * 2, 1);
      outer.current.rotation.x += (targetRotX - outer.current.rotation.x) * Math.min(d * 2, 1);

      // Drifts from the right of the composition toward centre as the page
      // advances: the object comes to meet you at the decision.
      const targetX = restingX * (1 - scroll * 0.8);
      outer.current.position.x += (targetX - outer.current.position.x) * Math.min(d * 1.4, 1);
      outer.current.position.y = reduced ? 0 : Math.sin(t * 0.2) * 0.07;
    }

    if (!reduced) {
      for (let i = 0; i < ACCENT_RINGS.length; i += 1) {
        const mesh = ringRefs.current[i];
        if (mesh) mesh.rotation.z += d * ACCENT_RINGS[i].speed;
      }
    }
  });

  return (
    <group ref={outer} position={[restingX, 0, 0]} scale={isMobile ? 0.78 : 1}>
      <group ref={spin} rotation={[0.1, 0, 0]}>
        <CoreGlow dawnRef={dawnRef} reduced={reduced} />

        <OrbitalField
          rings={isMobile ? 6 : 9}
          perRing={isMobile ? 120 : 260}
          size={isMobile ? 3.0 : 4.0}
          opacity={isMobile ? 0.6 : 1.0}
          dawnRef={dawnRef}
          reduced={reduced}
        />

        {ACCENT_RINGS.map((ring, i) => (
          <mesh
            key={ring.radius}
            ref={(el) => {
              ringRefs.current[i] = el;
            }}
            rotation={ring.tilt as [number, number, number]}
          >
            <torusGeometry args={[ring.radius, 0.004, 6, 200]} />
            <meshBasicMaterial
              color={ring.color}
              transparent
              opacity={ring.opacity}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
