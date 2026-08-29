import * as THREE from "three";

import { HEAD, HEAD_PROFILE, WINDOW } from "./constants";
import { clamp01, lerp, smootherstep } from "./math";

/**
 * The head, built as a stack of horizontal cross-sections.
 *
 * The obvious way to build a head from a profile is to sweep the outline across
 * the width, shrinking it as it goes. It does not work: every slice keeps its
 * own nose, and the sweep converges on a line rather than a point, which leaves
 * a crease running down the centre of the face and no interior at all. This
 * builds the head the way a head is actually shaped instead — one closed
 * section per height, each an oval spanning that height's front and back.
 *
 *   · the profile gives the front and the back of every section;
 *   · a width curve gives its half-width — widest across the parietal bone,
 *     narrower through the jaw, narrower again into the neck;
 *   · the section is a superellipse, narrowed toward the face, because a skull
 *     is fuller at the back than at the front;
 *   · the crown closes as a dome, and the base is capped flat — a deliberate
 *     sculptural cut rather than a head sitting on a cylinder;
 *   · and the near side of the vault is pressed inward into a shallow bowl, so
 *     the thread has somewhere to be that is genuinely inside the head.
 *
 * Built once and reused. The head is the constant in this piece.
 */
export function buildHeadGeometry(sections: number, around: number): THREE.BufferGeometry {
  /* -- the profile, split into its front and back chains ------------------ */
  const curve = new THREE.CatmullRomCurve3(
    HEAD_PROFILE.map(([x, y]) => new THREE.Vector3(x, y, 0)),
    true,
    "centripetal",
    0.5,
  );

  // Dense samples of the outline, so front and back can be read off at any
  // height without the control points' uneven spacing showing through.
  const dense = 1400;
  const ox = new Float32Array(dense);
  const oy = new Float32Array(dense);
  const scratch = new THREE.Vector3();
  for (let i = 0; i < dense; i += 1) {
    curve.getPoint(i / dense, scratch);
    ox[i] = scratch.x;
    oy[i] = scratch.y;
  }

  const yTop = HEAD_PROFILE[0][1];
  const yBase = Math.min(...HEAD_PROFILE.map((p) => p[1]));

  /** Front-most and back-most x of the outline at a given height. */
  const spanAt = (y: number): [number, number] => {
    let front = -Infinity;
    let back = Infinity;
    for (let i = 0; i < dense; i += 1) {
      const j = (i + 1) % dense;
      const a = oy[i];
      const b = oy[j];
      if ((a - y) * (b - y) > 0) continue; // the segment does not cross this height
      const t = Math.abs(b - a) < 1e-9 ? 0 : (y - a) / (b - a);
      const x = ox[i] + (ox[j] - ox[i]) * t;
      if (x > front) front = x;
      if (x < back) back = x;
    }
    return [back, front];
  };

  /* -- the stack --------------------------------------------------------- */
  const rings = sections + 1;
  const positions = new Float32Array(rings * around * 3);

  for (let s = 0; s < rings; s += 1) {
    // Sections bunch toward the crown and the jaw, where the form turns hardest.
    const t = s / sections;
    const y = lerp(yTop, yBase, t * t * (3 - 2 * t) * 0.5 + t * 0.5);

    const [back, front] = spanAt(y);
    const centre = (front + back) / 2;
    const half = Math.max((front - back) / 2, 1e-4);

    // Width: parietal, jaw and neck are three different measurements, and the
    // crown closes over the top as a dome rather than stopping flat.
    const jaw = smootherstep(HEAD.jawFrom, HEAD.jawTo, y);
    const neck = smootherstep(HEAD.neckFrom, HEAD.neckTo, y);
    const taper =
      HEAD.neckWidth + (HEAD.jawWidth - HEAD.neckWidth) * neck + (1 - HEAD.jawWidth) * jaw;
    const dome = clamp01((yTop - y) / HEAD.domeRange);
    const width = HEAD.halfWidth * taper * Math.sqrt(Math.max(dome * (2 - dome), 0));

    // The vault's near side is pressed inward for the thread to sit in — but
    // eased off again as the dome closes, where there is no longer enough width
    // to press into without breaking the silhouette at the crown.
    const vault =
      smootherstep(WINDOW.fromHeight, WINDOW.toHeight, y) *
      (1 - smootherstep(WINDOW.crownFrom, WINDOW.crownTo, y));

    for (let a = 0; a < around; a += 1) {
      const angle = (a / around) * Math.PI * 2;
      const c = Math.cos(angle);
      const sn = Math.sin(angle);

      // A superellipse, not a circle: a skull is squarer in section than an
      // ellipse and rounder than a box.
      const e = 2 / HEAD.sectionExponent;
      const fx = Math.sign(c) * Math.pow(Math.abs(c), e);
      const fz = Math.sign(sn) * Math.pow(Math.abs(sn), e);

      // Narrower toward the face than toward the back of the skull.
      const facing = Math.max(0, fx);
      const w = width * (1 - HEAD.faceNarrow * facing);

      const o = (s * around + a) * 3;
      positions[o] = centre + half * fx;
      positions[o + 1] = y;
      // Depth is a fraction of the local half-width rather than an absolute, so
      // the bowl can never be deeper than there is head to press it into.
      positions[o + 2] =
        w * fz -
        width * WINDOW.depth * vault * smootherstep(WINDOW.fromDepth, WINDOW.toDepth, fz);
    }
  }

  /* -- indices, plus a flat cap closing the base ------------------------- */
  const baseCentre = rings * around;
  const vertexCount = baseCentre + 1;
  const triangles = sections * around * 2 + around;
  const indices =
    vertexCount > 65535 ? new Uint32Array(triangles * 3) : new Uint16Array(triangles * 3);

  let w = 0;
  for (let s = 0; s < sections; s += 1) {
    for (let a = 0; a < around; a += 1) {
      const a2 = (a + 1) % around;
      const p0 = s * around + a;
      const p1 = s * around + a2;
      const p2 = (s + 1) * around + a2;
      const p3 = (s + 1) * around + a;
      indices[w++] = p0;
      indices[w++] = p1;
      indices[w++] = p3;
      indices[w++] = p1;
      indices[w++] = p2;
      indices[w++] = p3;
    }
  }

  const all = new Float32Array((vertexCount) * 3);
  all.set(positions);
  const [bBack, bFront] = spanAt(yBase + 1e-4);
  all[baseCentre * 3] = (bBack + bFront) / 2;
  all[baseCentre * 3 + 1] = yBase;
  all[baseCentre * 3 + 2] = 0;
  for (let a = 0; a < around; a += 1) {
    const a2 = (a + 1) % around;
    indices[w++] = sections * around + a2;
    indices[w++] = sections * around + a;
    indices[w++] = baseCentre;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(all, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  // Centre the form on its own origin so it leans about its middle, not its base.
  geometry.translate(-HEAD.pivotX, -HEAD.pivotY, 0);
  geometry.computeBoundingSphere();

  return geometry;
}
