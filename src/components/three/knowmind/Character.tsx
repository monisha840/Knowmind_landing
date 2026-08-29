"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { Pointer } from "@/lib/hooks";
import { lerpHueShort } from "./color";
import {
  BODY,
  CHAOS_TO_FLOW,
  FIT,
  FLOW_TO_CLARITY,
  MOTION,
  type Tier,
  TIERS,
} from "./constants";
import { Face, type FaceHandle } from "./Face";
import { clamp, damp, smoothstep } from "./math";
import { MoteField, type MoteHandle } from "./MoteField";
import { visualAt } from "./states";
import { ThreadSystem, type ThreadHandle } from "./ThreadSystem";

/**
 * The character, and the one place per-frame work happens.
 *
 * Everything below this point is driven from a single `useFrame`: React never
 * re-renders while the visitor scrolls. Scroll progress arrives as a ref, is
 * converted to a continuous stage in 0..2, damped so a flick of the wheel still
 * reads as a transformation rather than a jump cut, and then handed to the
 * thread, the face and the materials.
 *
 * The stage is a pure function of progress with nothing latched, so scrolling
 * back up runs the whole thing in reverse — clarity, flow, chaos — without any
 * special handling.
 *
 * The body, arms and legs never change shape. Only the thread reorganises and
 * the colours warm, which is what makes this one character settling rather than
 * three models cross-fading.
 */

type CharacterProps = {
  progressRef: RefObject<number>;
  pointer: RefObject<Pointer>;
  tier: Tier;
  reduced: boolean;
  /** Where the character sits in a full-bleed canvas. Ignored below 1024px. */
  align: "center" | "right";
};

function limbGeometry(
  path: readonly (readonly [number, number, number])[] | readonly (readonly number[])[],
  mirror: boolean,
  segments: number,
  radial: number,
) {
  const curve = new THREE.CatmullRomCurve3(
    path.map(([x, y, z]) => new THREE.Vector3(mirror ? -x : x, y, z)),
  );
  return new THREE.TubeGeometry(curve, segments, BODY.limbRadius, radial, false);
}

/** The far end of a limb path, where a hand or a foot goes. */
const ARM_TIP = BODY.armPath[BODY.armPath.length - 1];
const LEG_TIP = BODY.legPath[BODY.legPath.length - 1];

/* -------------------------------------------------------------------------- */

export function Character({ progressRef, pointer, tier, reduced, align }: CharacterProps) {
  const settings = TIERS[tier];
  const { size, camera } = useThree();

  const root = useRef<THREE.Group>(null);
  const armRight = useRef<THREE.Group>(null);
  const armLeft = useRef<THREE.Group>(null);

  const thread = useRef<ThreadHandle | null>(null);
  const face = useRef<FaceHandle | null>(null);
  const motes = useRef<MoteHandle | null>(null);

  /* -- geometry ---------------------------------------------------------- */

  const geometry = useMemo(() => {
    const radial = Math.max(4, settings.radial - 2);
    return {
      head: new THREE.SphereGeometry(
        BODY.radius,
        settings.headSegments[0],
        settings.headSegments[1],
      ),
      armRight: limbGeometry(BODY.armPath, false, settings.limbSegments, radial),
      armLeft: limbGeometry(BODY.armPath, true, settings.limbSegments, radial),
      legRight: limbGeometry(BODY.legPath, false, settings.limbSegments, radial),
      legLeft: limbGeometry(BODY.legPath, true, settings.limbSegments, radial),
      hand: new THREE.SphereGeometry(BODY.handRadius, 10, 8),
      foot: new THREE.SphereGeometry(BODY.footRadius, 12, 8),
    };
  }, [settings.headSegments, settings.limbSegments, settings.radial]);

  /* -- materials --------------------------------------------------------- */

  const materials = useMemo(
    () => ({
      head: new THREE.MeshStandardMaterial({
        color: new THREE.Color("#2a0f22"),
        emissive: new THREE.Color("#feb737"),
        emissiveIntensity: 0,
        roughness: 0.78,
        metalness: 0,
      }),
      limb: new THREE.MeshStandardMaterial({
        color: new THREE.Color("#1e0e2e"),
        roughness: 0.62,
        metalness: 0.04,
      }),
    }),
    [],
  );

  useEffect(
    () => () => {
      Object.values(geometry).forEach((g) => g.dispose());
    },
    [geometry],
  );
  useEffect(
    () => () => {
      Object.values(materials).forEach((m) => m.dispose());
    },
    [materials],
  );

  /* -- per-frame state, deliberately outside React ----------------------- */

  const live = useMemo(
    () => ({
      stage: -1, // -1 means "not yet initialised", so the first frame snaps
      time: 0,
      yaw: 0,
      pitch: 0,
      from: new THREE.Color(),
      to: new THREE.Color(),
    }),
    [],
  );

  useFrame((_, rawDelta) => {
    // Clamp: a backgrounded tab hands back one enormous delta on return, and
    // an un-clamped damp would teleport straight past the transition.
    const dt = Math.min(rawDelta, 0.05);
    const progress = progressRef.current ?? 0;

    /* -- scroll → a continuous position between the three states --------- */
    const target =
      smoothstep(CHAOS_TO_FLOW[0], CHAOS_TO_FLOW[1], progress) +
      smoothstep(FLOW_TO_CLARITY[0], FLOW_TO_CLARITY[1], progress);

    if (live.stage < 0) live.stage = target; // land correctly on a mid-page refresh
    else live.stage = damp(live.stage, target, reduced ? 9 : MOTION.stageLambda, dt);
    const stage = live.stage;

    if (!reduced) live.time += dt;
    const time = live.time;

    /* -- the parts ------------------------------------------------------- */
    thread.current?.update(stage, time, dt);
    face.current?.update(stage);
    motes.current?.update(stage, time);

    // Near-black plum warms to wine violet, then wine violet turns honey.
    // Taken the short way round the hue wheel, so the path runs through red and
    // orange rather than through the cyan a linear hue lerp would give.
    const second = stage > 1;
    const t = second ? stage - 1 : stage;
    live.from.set(second ? "#6d2f58" : "#2a0f22");
    live.to.set(second ? "#feb737" : "#6d2f58");
    lerpHueShort(materials.head.color, live.from, live.to, t, second ? 0.38 : 0);
    materials.head.emissiveIntensity = visualAt("headEmissive", stage);
    materials.head.roughness = visualAt("headRoughness", stage);

    live.from.set(second ? "#4c1c3c" : "#2b1442");
    live.to.set(second ? "#5a2348" : "#4c1c3c");
    materials.limb.color.copy(live.from).lerp(live.to, t);

    /* -- posture --------------------------------------------------------- */
    const arm = visualAt("arm", stage);
    const sway = reduced ? 0 : Math.sin(time * 0.55) * 0.035;
    if (armRight.current) armRight.current.rotation.z = arm + sway;
    if (armLeft.current) armLeft.current.rotation.z = -arm - sway;

    /* -- camera ---------------------------------------------------------- */
    const camZ = visualAt("cameraZ", stage);
    camera.position.z = damp(camera.position.z, camZ, 2.6, dt);

    /* -- fit the character to whatever viewport it landed in ------------- */
    const visibleHeight =
      2 * Math.tan(((camera as THREE.PerspectiveCamera).fov * Math.PI) / 360) * camera.position.z;
    const visibleWidth = visibleHeight * (size.width / Math.max(size.height, 1));

    // Standing beside a column of copy, the character only has half the frame
    // to work with — so it is sized against that half, not the whole canvas.
    const sideBySide = align === "right" && size.width >= 1024;
    const usableWidth = sideBySide ? visibleWidth * 0.52 : visibleWidth;
    const fit = clamp(
      Math.min(visibleHeight / FIT.height, usableWidth / FIT.width),
      FIT.min,
      FIT.max,
    );

    // Aim a little above the geometric midpoint. The legs are thin and dark and
    // barely register, so the *visual* mass sits higher than the bounding box
    // says — centring on the box alone leaves the character looking like it is
    // floating.
    camera.position.y = 0.36 * fit;

    // Sit in the right half, but never so far that an arm leaves the frame.
    const offsetX = sideBySide
      ? Math.max(
          Math.min(visibleWidth * 0.24, 2.6, visibleWidth / 2 - (FIT.width / 2) * fit),
          0,
        )
      : 0;

    /* -- idle life ------------------------------------------------------- */
    if (root.current) {
      const targetYaw = reduced ? 0 : (pointer.current?.x ?? 0) * MOTION.pointerYaw;
      const targetPitch = reduced ? 0 : (pointer.current?.y ?? 0) * MOTION.pointerPitch;
      live.yaw = damp(live.yaw, targetYaw, MOTION.pointerLambda, dt);
      live.pitch = damp(live.pitch, targetPitch, MOTION.pointerLambda, dt);

      // A sway, not a spin — wider while tangled, almost still once clear, and
      // never enough to turn the face away.
      const drift = reduced ? 0 : Math.sin(time * 0.19) * visualAt("spin", stage);

      root.current.rotation.y = live.yaw + drift;
      root.current.rotation.x = live.pitch;
      root.current.position.x = damp(root.current.position.x, offsetX, 3, dt);
      root.current.position.y = reduced
        ? 0
        : Math.sin(time * MOTION.floatSpeed) * MOTION.floatAmplitude;

      const breath = reduced ? 1 : 1 + Math.sin(time * MOTION.breathSpeed) * MOTION.breathAmplitude;
      root.current.scale.setScalar(fit * breath);
    }
  });

  return (
    <group ref={root}>
      <group position={[0, BODY.y, 0]}>
        {/* The circular body. Flattened along z so it reads as a drawn circle
            given depth, rather than as a ball. */}
        <mesh geometry={geometry.head} material={materials.head} scale={[1, 1, BODY.depth]} />

        <Face handleRef={face} tier={tier} />

        <group ref={armRight} position={[BODY.armPivot[0], BODY.armPivot[1], BODY.armPivot[2]]}>
          <mesh geometry={geometry.armRight} material={materials.limb} />
          <mesh
            geometry={geometry.hand}
            material={materials.limb}
            position={[ARM_TIP[0], ARM_TIP[1], ARM_TIP[2]]}
          />
        </group>
        <group ref={armLeft} position={[-BODY.armPivot[0], BODY.armPivot[1], BODY.armPivot[2]]}>
          <mesh geometry={geometry.armLeft} material={materials.limb} />
          <mesh
            geometry={geometry.hand}
            material={materials.limb}
            position={[-ARM_TIP[0], ARM_TIP[1], ARM_TIP[2]]}
          />
        </group>

        {[1, -1].map((side) => (
          <group
            key={side}
            position={[side * BODY.legPivot[0], BODY.legPivot[1], BODY.legPivot[2]]}
          >
            <mesh
              geometry={side > 0 ? geometry.legRight : geometry.legLeft}
              material={materials.limb}
            />
            <mesh
              geometry={geometry.foot}
              material={materials.limb}
              position={[0, LEG_TIP[1] - 0.015, 0.055]}
              scale={[1.2, 0.5, 1.85]}
            />
          </group>
        ))}
      </group>

      <ThreadSystem handleRef={thread} tier={tier} />

      {settings.motes > 0 && <MoteField handleRef={motes} count={settings.motes} />}
    </group>
  );
}
