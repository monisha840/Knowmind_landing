import type { MetadataRoute } from "next";

import { PROGRAM_URL } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: PROGRAM_URL,
      lastModified: new Date("2026-08-31"),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
