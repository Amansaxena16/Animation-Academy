// Search-engine data: the site's public address and schema.org JSON-LD for Google's rich results.
import { INSTITUTE } from "@/lib/site";
import type { Site } from "@/types/content";
import type { CourseDetail } from "@/types/course";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const ORG_ID = `${SITE_URL}/#organization`;

export function organizationLd(site: Site) {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": ORG_ID,
    name: "Animation Academy",
    alternateName: INSTITUTE.runByFull,
    description: INSTITUTE.tagline,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/aa-social.png`,
    email: site.email || undefined,
    telephone: site.phones.map((p) => `+91${p.replace(/\D/g, "").slice(-10)}`),
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address || "107/235 Nehru Nagar",
      addressLocality: "Kanpur",
      addressRegion: "Uttar Pradesh",
      addressCountry: "IN",
    },
  };
}

export function courseLd(course: CourseDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.name,
    description: course.description,
    url: `${SITE_URL}/courses#course-${course.slug}`,
    provider: {
      "@type": "EducationalOrganization",
      "@id": ORG_ID,
      name: "Animation Academy",
    },
    offers: {
      "@type": "Offer",
      category: "Paid",
      price: course.total_fee,
      priceCurrency: "INR",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Onsite",
      courseWorkload: `P${course.months}M`,
      location: { "@id": ORG_ID },
    },
  };
}
