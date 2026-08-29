import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified: new Date("2026-08-28"),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
