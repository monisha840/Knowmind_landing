"use client";

import { useEffect, useState } from "react";

/**
 * Can this browser give three.js a context it can actually use?
 *
 * Not the same question as "is there WebGL". three.js dropped WebGL 1 in
 * r163, so a browser offering only WebGL 1 passes a naive probe and then
 * throws inside the renderer's constructor — asynchronously, where no error
 * boundary can catch it, leaving a permanently blank canvas on the page.
 *
 * So the probe asks the specific question: `webgl2`, or nothing.
 *
 * The result is cached for the page's lifetime and the probe context is
 * explicitly released, because browsers allow only a handful of live WebGL
 * contexts and one of them is about to be needed for real.
 */
let cached: boolean | null = null;

function detect(): boolean {
  if (cached !== null) return cached;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    cached = Boolean(gl);
    if (gl) gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    cached = false;
  }
  return cached;
}

/** `null` while probing, so callers can hold the fallback rather than flash. */
export function useWebGL2Support(): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => setSupported(detect()), []);
  return supported;
}
