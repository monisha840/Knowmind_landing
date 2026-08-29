"use client";

import { type RefObject, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";

import { BODY, FACE, type Tier } from "./constants";
import { clamp01, smootherstep } from "./math";
import { visualAt } from "./states";

/**
 * The face.
 *
 * Two inlaid eyes and one shallow arc, sitting just proud of the front of the
 * circular body. Nothing here pops into existence: the eyes surface as a faint
 * darkening partway through the second chapter, and the smile only arrives once
 * the thread has genuinely settled — scaling up from a shorter, flatter arc so
 * it reads as the mouth *finding* the expression, not switching to it.
 *
 * Deliberately small, and deliberately unchanging otherwise. The psychological
 * transformation is carried by the thread; the face only confirms it at the end.
 */

export type FaceHandle = {
  update(stage: number): void;
};

type FaceProps = {
  handleRef: RefObject<FaceHandle | null>;
  tier: Tier;
};

const R = BODY.radius;
const EYE_RADIUS = FACE.eyeRadius * R;
const EYE_X = FACE.eyeX * R;
const EYE_Y = FACE.eyeY * R;
const SMILE_RADIUS = FACE.smileRadius * R;
const SMILE_TUBE = FACE.smileTube * R;
const SMILE_DROP = FACE.smileDrop * R;
/** Height of the arc's endpoints above its own centre — the corners of the mouth. */
const SMILE_LIFT = SMILE_RADIUS * Math.cos(FACE.smileArc / 2);

export function Face({ handleRef, tier }: FaceProps) {
  const eyes = useRef<THREE.Group>(null);
  const smile = useRef<THREE.Group>(null);

  const detail = tier === "low" ? 0 : tier === "medium" ? 1 : 2;

  const geometry = useMemo(() => {
    const eye = new THREE.SphereGeometry(EYE_RADIUS, 12 + detail * 6, 8 + detail * 4);
    const arc = new THREE.TorusGeometry(
      SMILE_RADIUS,
      SMILE_TUBE,
      6 + detail * 2,
      16 + detail * 8,
      FACE.smileArc,
    );
    return { eye, arc };
  }, [detail]);

  // Ink, not black — the same wine family as the rest of the character, so the
  // features read as part of the body rather than stuck onto it.
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#2a0f22"),
        roughness: 0.58,
        metalness: 0,
        transparent: true,
        opacity: 0,
      }),
    [],
  );

  useImperativeHandle(
    handleRef,
    () => ({
      update(stage) {
        const eyeLevel = clamp01(visualAt("eyes", stage));
        const smileLevel = smootherstep(0, 1, clamp01(visualAt("smile", stage)));

        // One material, so the stronger of the two drives its opacity and the
        // groups carry the rest of the reveal in scale.
        material.opacity = Math.max(eyeLevel, smileLevel) * 0.94;

        if (eyes.current) {
          eyes.current.visible = eyeLevel > 0.01;
          const s = 0.62 + 0.38 * eyeLevel;
          eyes.current.scale.set(s, s, 1);
        }

        if (smile.current) {
          smile.current.visible = smileLevel > 0.01;
          // Widens and deepens together — a flat line becoming a curve.
          smile.current.scale.set(0.55 + 0.45 * smileLevel, 0.3 + 0.7 * smileLevel, 1);
        }
      },
    }),
    [material],
  );

  useEffect(
    () => () => {
      geometry.eye.dispose();
      geometry.arc.dispose();
    },
    [geometry],
  );
  useEffect(() => () => material.dispose(), [material]);

  return (
    <group position={[0, 0, BODY.faceZ]}>
      <group ref={eyes} visible={false}>
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            geometry={geometry.eye}
            material={material}
            position={[side * EYE_X, EYE_Y, 0]}
            scale={[1, 1.16, 0.5]}
          />
        ))}
      </group>

      {/* The arc is drawn from angle 0, so it is rotated until its midpoint
          sits at the bottom of its circle — that is what makes it a smile.
          The mesh is then lifted by SMILE_LIFT so the arc's two *ends* sit on
          the group's origin: scaling the group in y then pulls the middle down
          while the corners stay put, which is a line becoming a curve rather
          than a curve getting bigger. */}
      <group ref={smile} visible={false} position={[0, -SMILE_LIFT + SMILE_DROP, 0]}>
        <mesh
          geometry={geometry.arc}
          material={material}
          position={[0, SMILE_LIFT, 0]}
          rotation={[0, 0, -Math.PI / 2 - FACE.smileArc / 2]}
          scale={[1, 1, 0.55]}
        />
      </group>
    </group>
  );
}
