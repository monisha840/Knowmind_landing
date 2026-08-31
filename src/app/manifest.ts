import type { MetadataRoute } from "next";

import { PROGRAM_PATH, programDetails, siteConfig } from "@/lib/config";

/**
 * Web app manifest.
 *
 * Only what a marketing site actually needs: the name, the brand colours the
 * page already uses, and the KnowMind mark generated from
 * `public/knowmind_logo.png` by `npm run icons`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — ${siteConfig.program}`,
    short_name: siteConfig.name,
    description: `${siteConfig.programSubtitle} · ${programDetails.dateLabel} · ${programDetails.timeLabel}`,
    start_url: PROGRAM_PATH,
    display: "browser",
    background_color: "#0c0410",
    theme_color: "#0c0410",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
