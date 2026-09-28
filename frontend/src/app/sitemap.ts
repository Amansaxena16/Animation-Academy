import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

// Home (one page: courses, about, admission, contact), all courses, and verification.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, priority: 1, changeFrequency: "weekly" },
    { url: `${SITE_URL}/courses`, priority: 0.9, changeFrequency: "weekly" },
    { url: `${SITE_URL}/verify`, priority: 0.4, changeFrequency: "yearly" },
  ];
}
