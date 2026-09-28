import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

// The public site is one page (courses are sections of it), plus certificate verification.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, priority: 1, changeFrequency: "weekly" },
    { url: `${SITE_URL}/verify`, priority: 0.4, changeFrequency: "yearly" },
  ];
}
