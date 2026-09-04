import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    /* `/admin` is private and lists personal data. Disallow is one of three
       independent measures — see the X-Robots-Tag header in next.config.ts and
       the `robots` metadata in src/app/admin/layout.tsx — and the only one a
       crawler reads before requesting the page. */
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
