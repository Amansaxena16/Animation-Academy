import type { Metadata } from "next";
import { connection } from "next/server";

import { CourseSection } from "@/components/courses/CourseSection";
import { PublicPageHead } from "@/components/layout/PublicPageHead";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSite } from "@/lib/content";
import { getCategories, getCourseDetails } from "@/lib/courses";
import { courseLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Courses and fees",
  description:
    "Every course at Animation Academy, Kanpur, with monthly fees and the full syllabus: computer basics, Tally with GST, DTP, web design, programming and the Professional Diploma in Multimedia.",
  alternates: { canonical: "/courses" },
};

/** All courses: a category filter, and cards that open in place to show the syllabus.
 *  Enquire goes to the message form on the home page with the course filled in. */
export default async function CoursesPage() {
  await connection(); // request-time: don't fetch the API during the build
  const [site, courses, categories] = await Promise.all([
    getSite(),
    getCourseDetails(),
    getCategories(),
  ]);

  return (
    <>
      {courses.map((c) => (
        <JsonLd key={c.slug} data={courseLd(c)} />
      ))}
      <PublicPageHead
        overline="Courses and fees"
        title={`All ${courses.length} courses`}
      >
        Fees are paid month by month, after a one-time registration. Open a
        course to see its syllabus.
      </PublicPageHead>
      <section className="mx-auto max-w-[1200px] px-4 py-10 md:px-6 md:py-14">
        <CourseSection
          courses={courses}
          categories={categories}
          registrationFee={site.registration_fee}
          formOnPage={false}
        />
      </section>
    </>
  );
}
