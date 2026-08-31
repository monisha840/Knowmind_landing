"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useRef } from "react";
import * as THREE from "three";

import type { Pointer } from "@/lib/hooks";
import { CAMERA, type Tier, TIERS } from "./constants";
import { Character } from "./Character";

/**
 * The renderer.
 *
 * Transparent, three lights, no post-processing, no environment map, no shadow
 * maps. The page owns the background; this only draws the character on top of
 * it.
 */

type KnowMindCanvasProps = {
  tier: Tier;
  progressRef: RefObject<number>;
  pointer: RefObject<Pointer>;
  reduced: boolean;
  align: "center" | "right";
  /** False when the section is off screen — the loop parks rather than idling. */
  active: boolean;
  onReady: () => void;
  onFail: () => void;
};

/* -------------------------------------------------------------------------- */
/*  Lighting                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Three lights, chosen to describe form rather than to dazzle.
 *
 * The key is pure white and the sky fill all but neutral, on purpose: a warm
 * key eats the blue channel of every purple in the scene, and wine violet with
 * its blue eaten is just red. All the warmth in this picture comes from the
 * honey the character turns, none of it from the lamps.
 *
 * The ground half of the hemisphere is deep purple rather than black, so the
 * shadow side stays a colour — the page behind it is nearly black already.
 */
function Lighting() {
  return (
    <>
      <hemisphereLight color="#fdfaf6" groundColor="#2b1442" intensity={1.75} />
      <directionalLight position={[3.4, 4.6, 5.2]} intensity={2.15} color="#ffffff" />
      <directionalLight position={[4.8, 0.4, -4.2]} intensity={2.6} color="#a8709a" />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Adaptive resolution                                                        */
/* -------------------------------------------------------------------------- */

/**
 * One-way, one-time downgrade.
 *
 * If the first few seconds of real rendering cannot hold a usable frame rate,
 * resolution comes down and stays down. It never climbs back up: a visitor
 * feels a drop far more than they notice sharper edges.
 */
function AdaptiveResolution({ dprMax }: { dprMax: number }) {
  const setDpr = useThree((state) => state.setDpr);
  const guard = useRef({ frames: 0, elapsed: 0, done: false });

  useFrame((_, delta) => {
    const g = guard.current;
    if (g.done || delta > 0.4) return; // ignore the first frame after a stall
    g.frames += 1;
    g.elapsed += delta;
    if (g.elapsed < 2.5) return;

    const fps = g.frames / g.elapsed;
    g.frames = 0;
    g.elapsed = 0;
    if (fps < 34) {
      g.done = true;
      setDpr(Math.max(1, Math.min(window.devicePixelRatio || 1, dprMax) * 0.7));
    }
  });

  return null;
}

/* -------------------------------------------------------------------------- */
/*  Context loss                                                               */
/* -------------------------------------------------------------------------- */

/**
 * A lost GPU context leaves a black rectangle behind. Rather than let that sit
 * on the page, the section is handed back to its static fallback.
 */
function ContextGuard({ onLost }: { onLost: () => void }) {
  const gl = useThree((state) => state.gl);
  const handler = useRef(onLost);
  handler.current = onLost;

  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      handler.current();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl]);

  return null;
}

/* -------------------------------------------------------------------------- */

export function KnowMindCanvas({
  tier,
  progressRef,
  pointer,
  reduced,
  align,
  active,
  onReady,
  onFail,
}: KnowMindCanvasProps) {
  const settings = TIERS[tier];

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, settings.dprMax]}
      camera={{
        position: [0, 0.22, 6.9],
        fov: CAMERA.fov,
        near: CAMERA.near,
        far: CAMERA.far,
      }}
      gl={{
        alpha: true,
        antialias: settings.antialias,
        stencil: false,
        depth: true,
        powerPreference: tier === "high" ? "high-performance" : "default",
      }}
      // The canvas is pinned, not scrolled — re-measuring on scroll would be
      // pure waste, and it is the single biggest scroll cost r3f adds.
      resize={{ scroll: false }}
      style={{ pointerEvents: "none" }}
      onCreated={({ gl, scene }) => {
        // Neutral over ACES: the brand's honey and wine survive it intact.
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.setClearAlpha(0);
        scene.background = null;
        onReady();
      }}
    >
      <Lighting />
      <ContextGuard onLost={onFail} />
      <AdaptiveResolution dprMax={settings.dprMax} />
      <Character
        progressRef={progressRef}
        pointer={pointer}
        tier={tier}
        reduced={reduced}
        align={align}
      />
    </Canvas>
  );
}
