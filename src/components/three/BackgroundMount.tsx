"use client";

import dynamic from "next/dynamic";

/**
 * Client boundary for the 3D background.
 *
 * Keeping the dynamic import here means three.js and the scene never enter the
 * server bundle or the initial client chunk — content and typography paint
 * first, and the canvas arrives afterwards.
 */
const Background3D = dynamic(
  () => import("./Background3D").then((m) => m.Background3D),
  {
    ssr: false,
    // Reserve the layer so nothing shifts when the canvas mounts.
    loading: () => <div className="fixed inset-0 -z-10" aria-hidden />,
  },
);

export function BackgroundMount() {
  return <Background3D />;
}
