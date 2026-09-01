import type { MetadataRoute } from "next";

import { PROGRAM_URL } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: PROGRAM_URL,
      /* Build time, not a date typed by hand. The page is statically
         generated, so this is stamped whenever the site is deployed — which is
         the only moment its content can actually have changed. The previous
         hardcoded date went stale the first time anything shipped after it. */
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
