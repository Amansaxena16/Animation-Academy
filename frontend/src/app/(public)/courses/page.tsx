import type { Metadata } from "next";
import { connection } from "next/server";

import { PublicPageHead } from "@/components/layout/PublicPageHead";
import { getCategories, getCourses } from "@/lib/courses";
import { getSite } from "@/lib/content";

import { CourseCatalogue, type CatalogueFilters } from "./CourseCatalogue";

export const metadata: Metadata = {
  title: "Courses and fees",
  description:
    "Computer, accounting, design, web and multimedia courses in Nehru Nagar, Kanpur, with monthly fees — from CCC and DCA to the 18-month Professional Diploma in Multimedia.",
};

const one = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) ?? "";

export default async function CoursesPage({
  searchParams,
}: PageProps<"/courses">) {
  await connection(); // render per request; the API data itself is cached (lib/courses.ts)
  const [courses, categories, site, params] = await Promise.all([
    getCourses(),
    getCategories(),
    getSite(),
    searchParams,
  ]);

  const initial: CatalogueFilters = {
    q: one(params.q),
    category: one(params.category),
    level: one(params.level),
    fee: one(params.fee),
  };

  return (
    <>
      <PublicPageHead overline="Courses and fees" title="Our courses">
        {courses.length} courses, from computer fundamentals to an
        eighteen-month multimedia diploma. Fees are paid month by month after a
        one-time ₹{site.registration_fee} registration.
      </PublicPageHead>
      <CourseCatalogue
        registrationFee={site.registration_fee}
        courses={courses}
        categories={categories}
        initial={initial}
      />
    </>
  );
}
