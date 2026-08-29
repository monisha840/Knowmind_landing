"use client";

import { useEffect, useState } from "react";

import type { Tier } from "./constants";

/**
 * A practical capability guess, made once.
 *
 * Not a benchmark and not user-agent sniffing — cores, memory, pointer type
 * and viewport, plus one check for a software rasteriser, which is the single
 * strongest signal that full quality would be a mistake.
 */
function detectTier(): Tier {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;

  if (isSoftwareRenderer()) return "low";

  const coarse =
    typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  const handheld = coarse || window.innerWidth < 768;

  if (handheld) return cores >= 6 && memory >= 4 ? "medium" : "low";
  if (cores <= 2 || memory <= 2) return "low";
  if (cores <= 4 || memory <= 4) return "medium";
  return "high";
}

/**
 * SwiftShader / llvmpipe mean the GPU is the CPU. The probe context is
 * explicitly thrown away so it never counts against the browser's small
 * per-page limit on live WebGL contexts.
 */
function isSoftwareRenderer(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") as WebGLRenderingContext | null;
    if (!gl) return false;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const name = ext
      ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
      : String(gl.getParameter(gl.RENDERER));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /swiftshader|llvmpipe|softwarerasterizer|angle \(software/i.test(name);
  } catch {
    return false;
  }
}

/**
 * `null` until the probe has run — callers hold the static fallback rather
 * than mounting a canvas they may have to rebuild a frame later.
 */
export function usePerformanceTier(override?: Tier | "auto"): Tier | null {
  const [tier, setTier] = useState<Tier | null>(null);

  useEffect(() => {
    if (override && override !== "auto") {
      setTier(override);
      return;
    }
    setTier(detectTier());
  }, [override]);

  return tier;
}
