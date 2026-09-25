import type { Metadata } from "next";
import { connection } from "next/server";

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
      <section className="border-line bg-surface-raised border-b">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-6 md:py-16">
          <span className="type-overline text-accent-ink">
            Courses and fees
          </span>
          <h1 className="type-display mt-3 mb-0">Our courses</h1>
          <p className="type-body-lg text-ink-muted mt-4 mb-0 max-w-[620px]">
            {courses.length} courses, from computer fundamentals to an
            eighteen-month multimedia diploma. Fees are paid month by month
            after a one-time ₹{site.registration_fee} registration.
          </p>
        </div>
      </section>
      <CourseCatalogue
        registrationFee={site.registration_fee}
        courses={courses}
        categories={categories}
        initial={initial}
      />
    </>
  );
}
