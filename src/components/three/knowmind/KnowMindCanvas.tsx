"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useRef } from "react";
import * as THREE from "three";

import type { Pointer } from "@/lib/hooks";
import { CAMERA, MOTION, type Tier, TIERS } from "./constants";
import { HeadScene } from "./HeadScene";

/**
 * The renderer.
 *
 * Transparent, three lights, no post-processing, no environment map. The page
 * owns the background; this only draws the heads on top of it.
 */

type KnowMindCanvasProps = {
  tier: Tier;
  progressRef: RefObject<number>;
  pointer: RefObject<Pointer>;
  reduced: boolean;
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
 * key eats the blue channel of every purple in the scene, and deep purple with
 * its blue eaten is just brown. All the warmth in this picture comes from the
 * honey the thread turns, none of it from the lamps.
 *
 * The rim sits behind and to the face's side, which is the one light a profile
 * cannot do without: the heads are a deep purple only a shade off the page
 * behind them, and without an edge along the brow and the nose they would read
 * as holes rather than as sculpture. The ground half of the hemisphere is deep
 * purple rather than black, so the shadow side stays a colour.
 */
function Lighting({ shadows }: { shadows: boolean }) {
  return (
    <>
      <hemisphereLight color="#fdfaf6" groundColor="#2b1442" intensity={1.0} />
      <directionalLight
        position={[4.6, 5.2, 3.4]}
        intensity={3.1}
        color="#ffffff"
        castShadow={shadows}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-camera-near={0.5}
        shadow-camera-far={22}
        shadow-normalBias={0.02}
        shadow-radius={3}
      />
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
  active,
  onReady,
  onFail,
}: KnowMindCanvasProps) {
  const settings = TIERS[tier];

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, settings.dprMax]}
      shadows={settings.shadows ? "soft" : false}
      camera={{
        position: [0, 0, MOTION.cameraNear],
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
      <Lighting shadows={settings.shadows} />
      <ContextGuard onLost={onFail} />
      <AdaptiveResolution dprMax={settings.dprMax} />
      <HeadScene progressRef={progressRef} pointer={pointer} tier={tier} reduced={reduced} />
    </Canvas>
  );
}
