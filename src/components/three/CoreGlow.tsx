"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * The warm centre of the growth object — the 1%.
 *
 * A sphere shaded by view angle rather than by lights: brightest where it
 * faces the camera, fading to nothing at its silhouette. Additively blended,
 * so it reads as a soft ball of light with no visible edge and needs no
 * lighting rig at all.
 */

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uInner;
  uniform vec3 uOuter;
  uniform float uOpacity;

  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    float facing = clamp(dot(normalize(vNormal), normalize(vView)), 0.0, 1.0);

    // Bright core, quick falloff — a light source, not a lit object.
    float alpha = pow(facing, 4.5);
    vec3 col = mix(uOuter, uInner, pow(facing, 1.7));

    gl_FragColor = vec4(col, alpha * uOpacity);
  }
`;

type CoreGlowProps = {
  radius?: number;
  dawnRef: React.RefObject<number>;
  reduced: boolean;
};

export function CoreGlow({ radius = 0.55, dawnRef, reduced }: CoreGlowProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);

  const uniforms = useMemo(
    () => ({
      uInner: { value: new THREE.Color("#ffe6b8") },
      uOuter: { value: new THREE.Color("#c9761f") },
      uOpacity: { value: 0.5 },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (!materialRef.current || !meshRef.current) return;

    if (!reduced) {
      elapsed.current += Math.min(delta, 0.05);
      // Breathes slightly out of phase with the orbits, so the whole object
      // never pulses as one flat unit.
      const breath = 1 + Math.sin(elapsed.current * 0.28 + 1.2) * 0.045;
      meshRef.current.scale.setScalar(breath);
    }

    // The centre brightens as the page moves toward dawn.
    materialRef.current.uniforms.uOpacity.value = 0.6 + (dawnRef.current ?? 0) * 0.3;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 48, 48]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
