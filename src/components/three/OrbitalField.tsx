"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * The growth object's body: several thousand points travelling on a woven set
 * of tilted circular orbits.
 *
 * Each successive ring is tilted by the golden angle, so the orbits never
 * align into an "atom model" or a "planet" — they interleave into a soft,
 * layered shell that reads as cycles within cycles. Inner orbits run faster
 * than outer ones, which is what makes the whole thing feel alive rather than
 * rigidly rotating.
 *
 * Everything is computed on the GPU from static attributes: one draw call, no
 * per-frame CPU work, no geometry updates.
 */

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uDpr;
  uniform float uBreath;

  attribute float aRadius;
  attribute float aAngle;
  attribute float aSpeed;
  attribute vec2  aTilt;    // rotation about X, then about Z
  attribute vec3  aJitter;
  attribute float aScale;
  attribute float aShade;   // 0 at the core, 1 at the rim

  varying float vShade;
  varying float vDepth;

  mat3 rotX(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat3(1.0, 0.0, 0.0,  0.0, c, s,  0.0, -s, c);
  }

  mat3 rotZ(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat3(c, s, 0.0,  -s, c, 0.0,  0.0, 0.0, 1.0);
  }

  void main() {
    // Travel along the orbit. Inner rings carry more speed.
    float theta = aAngle + uTime * aSpeed;
    vec3 p = vec3(cos(theta) * aRadius, 0.0, sin(theta) * aRadius);

    // Thickness, so each ring is a band rather than a wire.
    p += aJitter;

    // Weave: tilt this ring out of the shared plane.
    p = rotZ(aTilt.y) * rotX(aTilt.x) * p;

    // Collective breathing.
    p *= uBreath;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    // Physical pixels; tuned so a mid-field point is 2-3 CSS px — fine dust.
    gl_PointSize = uSize * aScale * uDpr * (8.0 / max(-mv.z, 0.001));

    vShade = aShade;
    vDepth = clamp((-mv.z - 5.0) / 8.0, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColorCore;
  uniform vec3 uColorRim;
  uniform float uOpacity;
  uniform float uDawn;

  varying float vShade;
  varying float vDepth;

  void main() {
    // Soft round point — no texture, no alpha map.
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, d);
    alpha *= alpha;

    // Warm at the centre, wine violet at the rim; the whole field warms as
    // the page moves from night toward dawn.
    float t = clamp(vShade - uDawn * 0.45, 0.0, 1.0);
    vec3 col = mix(uColorCore, uColorRim, smoothstep(0.0, 1.0, t));

    // Distant points recede instead of crowding the composition.
    float depthFade = 1.0 - vDepth * 0.45;

    gl_FragColor = vec4(col, alpha * uOpacity * depthFade);
  }
`;

type OrbitalFieldProps = {
  /** Points per ring × ring count. */
  rings: number;
  perRing: number;
  size?: number;
  opacity?: number;
  /** 0 = night, 1 = dawn. Driven by scroll. */
  dawnRef: React.RefObject<number>;
  reduced: boolean;
};

/** Deterministic hash so the field is identical on every render and reload. */
const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function OrbitalField({
  rings,
  perRing,
  size = 3.6,
  opacity = 0.9,
  dawnRef,
  reduced,
}: OrbitalFieldProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const elapsed = useRef(0);

  // The ratio the renderer actually used, not the device's — the Canvas caps it.
  const dpr = useThree((s) => s.viewport.dpr);
  useEffect(() => {
    if (materialRef.current) materialRef.current.uniforms.uDpr.value = dpr;
  }, [dpr]);

  const attrs = useMemo(() => {
    const count = rings * perRing;
    const radius = new Float32Array(count);
    const angle = new Float32Array(count);
    const speed = new Float32Array(count);
    const tilt = new Float32Array(count * 2);
    const jitter = new Float32Array(count * 3);
    const scale = new Float32Array(count);
    const shade = new Float32Array(count);

    const rMin = 1.2;
    const rMax = 3.0;

    let i = 0;
    for (let ring = 0; ring < rings; ring += 1) {
      const t = rings === 1 ? 0 : ring / (rings - 1);
      // Nested radii — rings spreading outward like ripples from the centre.
      const r = rMin + (rMax - rMin) * Math.pow(t, 1.1);

      // A shared viewing tilt, opened very slightly ring by ring so the set
      // reads as one bowl rather than a flat disc, plus a small progressive
      // precession in plane. The offset between rings is what draws the eye
      // around the form — too much variation and it collapses into dust.
      const tiltX = 1.1 + ring * 0.052;
      const tiltZ = ring * 0.15;

      // Inner orbits run faster — differential rotation reads as "alive".
      const spd = 0.085 - t * 0.056;

      for (let k = 0; k < perRing; k += 1) {
        const seed = ring * 1009 + k;

        radius[i] = r;
        angle[i] = (k / perRing) * Math.PI * 2;
        speed[i] = spd;

        tilt[i * 2] = tiltX;
        tilt[i * 2 + 1] = tiltZ;

        // Tight band thickness — each orbit must stay a line of light.
        jitter[i * 3] = (rand(seed + 1) - 0.5) * 0.05;
        jitter[i * 3 + 1] = (rand(seed + 2) - 0.5) * 0.045;
        jitter[i * 3 + 2] = (rand(seed + 3) - 0.5) * 0.05;

        scale[i] = 0.4 + rand(seed + 4) * 0.8;
        shade[i] = t; // 0 inner → 1 outer

        i += 1;
      }
    }

    return { radius, angle, speed, tilt, jitter, scale, shade };
  }, [rings, perRing]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: size },
      uDpr: { value: 1 },
      uBreath: { value: 1 },
      uOpacity: { value: opacity },
      uDawn: { value: 0 },
      uColorCore: { value: new THREE.Color("#ffd18f") }, // honey, at the centre
      uColorRim: { value: new THREE.Color("#d081b4") }, // lifted wine violet, at the rim
    }),
    [size, opacity],
  );

  useFrame((_, delta) => {
    const mat = materialRef.current;
    if (!mat) return;

    if (!reduced) {
      const d = Math.min(delta, 0.05);
      elapsed.current += d;
      mat.uniforms.uTime.value = elapsed.current;
      mat.uniforms.uBreath.value = 1 + Math.sin(elapsed.current * 0.32) * 0.022;
    }

    // Ease toward the scroll-driven warmth so colour never snaps.
    const target = dawnRef.current ?? 0;
    mat.uniforms.uDawn.value +=
      (target - mat.uniforms.uDawn.value) * Math.min(delta * 2, 1);
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[new Float32Array(attrs.radius.length * 3), 3]} />
        <bufferAttribute attach="attributes-aRadius" args={[attrs.radius, 1]} />
        <bufferAttribute attach="attributes-aAngle" args={[attrs.angle, 1]} />
        <bufferAttribute attach="attributes-aSpeed" args={[attrs.speed, 1]} />
        <bufferAttribute attach="attributes-aTilt" args={[attrs.tilt, 2]} />
        <bufferAttribute attach="attributes-aJitter" args={[attrs.jitter, 3]} />
        <bufferAttribute attach="attributes-aScale" args={[attrs.scale, 1]} />
        <bufferAttribute attach="attributes-aShade" args={[attrs.shade, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
