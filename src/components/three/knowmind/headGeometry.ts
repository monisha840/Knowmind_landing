import * as THREE from "three";

import { HEAD, HEAD_PROFILE } from "./constants";
import { clamp01, smootherstep } from "./math";

/**
 * How many smoothing passes erase the face. Enough that the diffusion length
 * comfortably exceeds the width of the nose in samples.
 */
const FEATURE_PASSES = 300;

/**
 * The head, lofted from its profile.
 *
 * A closed Catmull-Rom curve is drawn through the profile landmarks, then that
 * outline is swept across the head's width, shrinking toward the head's own
 * axis as it goes. The shrink follows a superellipse rather than a circle, so
 * the form stays full out to about three-quarters of its width and only then
 * rounds off — which is the cross-section a skull actually has, and the
 * difference between a sculpted head and a flat cut-out.
 *
 * Built once and shared by all three heads. They are the same mind, so they are
 * quite literally the same geometry object.
 */
export function buildHeadGeometry(samples: number, slices: number): THREE.BufferGeometry {
  /* -- the outline ------------------------------------------------------- */
  const curve = new THREE.CatmullRomCurve3(
    HEAD_PROFILE.map(([x, y]) => new THREE.Vector3(x, y, 0)),
    true,
    "centripetal",
    0.5,
  );

  const outline = new Float32Array(samples * 2);
  // How wide the form is at each point of the outline. A head is far wider than
  // the neck under it; a single width for both gives a slab with a face on it.
  const width = new Float32Array(samples);
  const scratch = new THREE.Vector3();
  for (let i = 0; i < samples; i += 1) {
    curve.getPoint(i / samples, scratch);
    outline[i * 2] = scratch.x;
    outline[i * 2 + 1] = scratch.y;
    const t = clamp01(
      (scratch.y - HEAD.neckTaperTo) / (HEAD.neckTaperFrom - HEAD.neckTaperTo),
    );
    width[i] = HEAD.neckWidth + (1 - HEAD.neckWidth) * (t * t * (3 - 2 * t));
  }

  /* -- the same outline with its features smoothed away ------------------ */
  //
  // A head has a nose in the middle and none at all at the sides. Sweeping one
  // outline across the whole width gives every slice its own nose, and those
  // stack into a ridge fanning back from the face — which is what a naive loft
  // of a profile always looks like, and it does not look like a head.
  //
  // So a second outline is derived by repeatedly averaging each point with its
  // neighbours. Diffusion erases anything narrower than it runs long, which
  // takes out the nose, the lips and the chin notch and leaves the skull, the
  // jaw and the neck. Because it is the *same* points, moved, the two outlines
  // stay in register and one can be blended into the other per slice.
  const side = Float32Array.from(outline);
  const scratchPass = new Float32Array(side.length);
  for (let pass = 0; pass < FEATURE_PASSES; pass += 1) {
    for (let i = 0; i < samples; i += 1) {
      const prev = ((i - 1 + samples) % samples) * 2;
      const next = ((i + 1) % samples) * 2;
      scratchPass[i * 2] = 0.25 * side[prev] + 0.5 * side[i * 2] + 0.25 * side[next];
      scratchPass[i * 2 + 1] = 0.25 * side[prev + 1] + 0.5 * side[i * 2 + 1] + 0.25 * side[next + 1];
    }
    side.set(scratchPass);
  }

  /* -- the loft ---------------------------------------------------------- */
  const rings = slices + 1;
  const positions = new Float32Array(samples * rings * 3);
  const n = HEAD.sectionExponent;

  for (let j = 0; j < rings; j += 1) {
    // Slices are distributed by sine rather than evenly, so they bunch up where
    // the form curves hardest — at the sides — instead of being wasted across
    // the flat middle.
    const s = (j / slices) * 2 - 1;
    const v = Math.sin((s * Math.PI) / 2);
    const av = Math.abs(v);
    const k = av >= 1 ? 0 : Math.pow(1 - Math.pow(av, n), 1 / n);
    const drop = (1 - k) * HEAD.verticalShrink;
    const z = HEAD.halfWidth * v;

    // Features are full strength on the centre plane and gone by not quite half
    // way out — which is where a nose actually stops. Fading them across the
    // whole width instead builds a long smooth ramp from the nose back to the
    // ear, and that ramp catches the light and reads as a face turned toward
    // you rather than a profile.
    const flat = smootherstep(0, 0.5, av);

    for (let i = 0; i < samples; i += 1) {
      const o = (j * samples + i) * 3;
      const px = outline[i * 2] + (side[i * 2] - outline[i * 2]) * flat;
      const py = outline[i * 2 + 1] + (side[i * 2 + 1] - outline[i * 2 + 1]) * flat;
      positions[o] = HEAD.axisX + (px - HEAD.axisX) * k;
      positions[o + 1] = py + (HEAD.axisY - py) * drop;
      positions[o + 2] = z * width[i];
    }
  }

  /* -- the grid, wrapped around the profile and open across the width ----- */
  const indices = new Uint16Array(samples * slices * 6);
  let w = 0;
  for (let j = 0; j < slices; j += 1) {
    for (let i = 0; i < samples; i += 1) {
      const i2 = (i + 1) % samples;
      const a = j * samples + i;
      const b = j * samples + i2;
      const c = (j + 1) * samples + i2;
      const d = (j + 1) * samples + i;
      // Wound so the normals face out of the head. The profile is authored
      // clockwise in the xy plane, which reverses the usual order here.
      indices[w++] = a;
      indices[w++] = d;
      indices[w++] = b;
      indices[w++] = b;
      indices[w++] = d;
      indices[w++] = c;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  // Centre the form on its own origin so it leans about its middle, not its feet.
  geometry.translate(-HEAD.pivotX, -HEAD.pivotY, 0);
  geometry.computeBoundingSphere();

  return geometry;
}
