import * as THREE from "three";

import { CAVITY } from "./constants";
import { sampleSpline, smoothstep } from "./math";

/**
 * The tube kernel.
 *
 * Kept apart from the component so it is plain, testable geometry: build a
 * fixed-topology tube once, then sweep it along a set of control points as
 * often as you like without allocating anything.
 */

/* -------------------------------------------------------------------------- */
/*  Tube built once, rewritten in place                                        */
/* -------------------------------------------------------------------------- */

export function createTube(tubular: number, radial: number) {
  const rings = tubular + 1;
  const vertexCount = rings * radial;

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const indices = new Uint16Array(tubular * radial * 6);

  // Winding is CCW seen from outside the tube, so the default FrontSide
  // material shows the outside and culls the inside.
  let k = 0;
  for (let i = 0; i < tubular; i += 1) {
    for (let j = 0; j < radial; j += 1) {
      const j2 = (j + 1) % radial;
      const a = i * radial + j;
      const b = i * radial + j2;
      const c = (i + 1) * radial + j2;
      const d = (i + 1) * radial + j;
      indices[k++] = a;
      indices[k++] = b;
      indices[k++] = d;
      indices[k++] = b;
      indices[k++] = c;
      indices[k++] = d;
    }
  }

  const geometry = new THREE.BufferGeometry();
  const positionAttr = new THREE.BufferAttribute(positions, 3);
  const normalAttr = new THREE.BufferAttribute(normals, 3);
  positionAttr.setUsage(THREE.DynamicDrawUsage);
  normalAttr.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", positionAttr);
  geometry.setAttribute("normal", normalAttr);
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  // Fixed and generous: the strand is contained inside the cranial cavity, so
  // it never leaves this sphere, and skipping the per-frame recompute keeps the
  // update loop allocation-free.
  geometry.boundingSphere = new THREE.Sphere(
    new THREE.Vector3(CAVITY.x, CAVITY.y, CAVITY.zClear),
    1.2,
  );

  // Cross-section, and the taper that closes both ends.
  const cos = new Float32Array(radial);
  const sin = new Float32Array(radial);
  for (let j = 0; j < radial; j += 1) {
    const a = (j / radial) * Math.PI * 2;
    cos[j] = Math.cos(a);
    sin[j] = Math.sin(a);
  }
  const taper = new Float32Array(rings);
  for (let i = 0; i < rings; i += 1) {
    const u = i / tubular;
    taper[i] = 0.14 + 0.86 * smoothstep(0, 0.05, u) * smoothstep(1, 0.945, u);
  }

  return {
    geometry,
    positions,
    normals,
    positionAttr,
    normalAttr,
    centers: new Float32Array(rings * 3),
    cos,
    sin,
    taper,
    rings,
    tubular,
    radial,
  };
}

export type Tube = ReturnType<typeof createTube>;

/**
 * Sweep the tube along the current control points.
 *
 * Frames are carried along the curve by projecting the previous normal onto
 * each new cross-section plane — rotation-minimising, so there is no
 * reference-up flip when the thread doubles back on itself, which in the
 * tangle it does constantly.
 */
export function sweep(tube: Tube, pts: Float32Array, radius: number) {
  const { centers, positions, normals, cos, sin, taper, rings, tubular, radial } = tube;
  const count = pts.length / 3;

  for (let i = 0; i < rings; i += 1) {
    sampleSpline(pts, count, i / tubular, centers, i * 3);
  }

  // Seed the frame with whichever axis is least parallel to the first tangent.
  let tx = centers[3] - centers[0];
  let ty = centers[4] - centers[1];
  let tz = centers[5] - centers[2];
  let len = Math.hypot(tx, ty, tz) || 1;
  tx /= len;
  ty /= len;
  tz /= len;

  const ax = Math.abs(tx);
  const ay = Math.abs(ty);
  const az = Math.abs(tz);
  let ux = 0;
  let uy = 0;
  let uz = 0;
  if (ax <= ay && ax <= az) ux = 1;
  else if (ay <= az) uy = 1;
  else uz = 1;

  let dot = ux * tx + uy * ty + uz * tz;
  let nx = ux - tx * dot;
  let ny = uy - ty * dot;
  let nz = uz - tz * dot;
  len = Math.hypot(nx, ny, nz) || 1;
  nx /= len;
  ny /= len;
  nz /= len;

  for (let i = 0; i < rings; i += 1) {
    const o = i * 3;

    if (i > 0) {
      // Central difference where possible — smoother than a forward one, and
      // it keeps the tube from pinching at sharp turns in the tangle.
      const prev = (i - 1) * 3;
      const next = i < rings - 1 ? (i + 1) * 3 : o;
      tx = centers[next] - centers[prev];
      ty = centers[next + 1] - centers[prev + 1];
      tz = centers[next + 2] - centers[prev + 2];
      len = Math.hypot(tx, ty, tz) || 1;
      tx /= len;
      ty /= len;
      tz /= len;

      dot = nx * tx + ny * ty + nz * tz;
      nx -= tx * dot;
      ny -= ty * dot;
      nz -= tz * dot;
      len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;
    }

    const bx = ty * nz - tz * ny;
    const by = tz * nx - tx * nz;
    const bz = tx * ny - ty * nx;

    const r = radius * taper[i];
    const cx = centers[o];
    const cy = centers[o + 1];
    const cz = centers[o + 2];

    for (let j = 0; j < radial; j += 1) {
      const c = cos[j];
      const s = sin[j];
      const dx = nx * c + bx * s;
      const dy = ny * c + by * s;
      const dz = nz * c + bz * s;
      const v = (i * radial + j) * 3;
      positions[v] = cx + dx * r;
      positions[v + 1] = cy + dy * r;
      positions[v + 2] = cz + dz * r;
      normals[v] = dx;
      normals[v + 1] = dy;
      normals[v + 2] = dz;
    }
  }
}
