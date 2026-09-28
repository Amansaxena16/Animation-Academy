import type { MetadataRoute } from "next";
import { connection } from "next/server";

import { getCourses } from "@/lib/courses";
import { SITE_URL } from "@/lib/seo";

const PAGES = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/courses", priority: 0.9, changeFrequency: "weekly" },
  { path: "/updates", priority: 0.6, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.7, changeFrequency: "yearly" },
  { path: "/verify", priority: 0.4, changeFrequency: "yearly" },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection(); // request-time: the course list comes from the API
  // If the API is down the fixed pages are still listed.
  const courses = await getCourses().catch(() => []);
  return [
    ...PAGES.map((p) => ({
      url: `${SITE_URL}${p.path}`,
      priority: p.priority,
      changeFrequency: p.changeFrequency,
    })),
    ...courses.map((c) => ({
      url: `${SITE_URL}/courses/${c.slug}`,
      priority: 0.8,
      changeFrequency: "monthly" as const,
    })),
  ];
}
