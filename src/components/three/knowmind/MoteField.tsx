"use client";

import { type RefObject, useEffect, useImperativeHandle, useMemo } from "react";
import * as THREE from "three";

import { BODY } from "./constants";

/**
 * Attention.
 *
 * A very small shell of drifting points around the character — scattered while
 * the thread is tangled, fewer and slower once it settles. One draw call, one
 * shader, no textures. Skipped entirely on the low tier.
 */

export type MoteHandle = { update(stage: number, time: number): void };

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSettle;
  uniform float uPixelRatio;

  attribute float aScale;
  attribute float aPhase;

  varying float vFade;

  void main() {
    vec3 p = position;

    // Slow orbit, each mote on its own phase; the whole shell draws in a
    // little as the character settles.
    float a = uTime * mix(0.10, 0.03, uSettle) + aPhase;
    float c = cos(a);
    float s = sin(a);
    p.xz = mat2(c, -s, s, c) * p.xz;
    p *= mix(1.0, 0.82, uSettle);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aScale * uPixelRatio * (7.0 / max(-mv.z, 0.001));

    // Motes behind the character recede rather than crowding it.
    vFade = clamp((-mv.z - 3.5) / 6.0, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;

  varying float vFade;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, alpha * alpha * uOpacity * (1.0 - vFade * 0.7));
  }
`;

type MoteFieldProps = {
  handleRef: RefObject<MoteHandle | null>;
  count: number;
};

export function MoteField({ handleRef, count }: MoteFieldProps) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);

    // Fibonacci shell — even coverage, no clumping at the poles.
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i += 1) {
      const y = 1 - (i / Math.max(count - 1, 1)) * 2;
      const ring = Math.sqrt(Math.max(1 - y * y, 0));
      const theta = golden * i;
      const jitter = Math.abs((Math.sin(i * 127.1) * 43758.5453) % 1);
      const r = 1.95 + jitter * 1.15;

      positions[i * 3] = Math.cos(theta) * ring * r;
      positions[i * 3 + 1] = y * r * 0.8 + BODY.y;
      positions[i * 3 + 2] = Math.sin(theta) * ring * r;
      scales[i] = 0.9 + Math.abs((Math.sin(i * 78.233) * 43758.5453) % 1) * 1.7;
      phases[i] = (i / count) * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, BODY.y, 0), 3.4);
    return geo;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uSettle: { value: 0 },
          uOpacity: { value: 0 },
          uColor: { value: new THREE.Color("#e6b44c") },
          uPixelRatio: {
            value: typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio, 2),
          },
        },
      }),
    [],
  );

  useImperativeHandle(
    handleRef,
    () => ({
      update(stage, time) {
        const settle = stage / 2;
        material.uniforms.uTime.value = time;
        material.uniforms.uSettle.value = settle;
        // Present but never loud: the motes are the quietest thing on screen.
        material.uniforms.uOpacity.value = 0.34 - settle * 0.18;
      },
    }),
    [material],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
