import { PhoneCall } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { ApplyForCourse } from "@/components/student/ApplyForCourse";
import { BackButton } from "@/components/ui/BackButton";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSite, telHref } from "@/lib/content";
import { getCourses } from "@/lib/courses";

export const metadata: Metadata = { title: "Apply for a course" };

const one = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) ?? "";

/** A signed-in student asks for another course; the office confirms it. New students are
 *  admitted by the office in the admin console, never on the website. */
export default async function ApplyPage({
  searchParams,
}: PageProps<"/student/apply">) {
  await connection(); // request-time: don't fetch the API during the build
  const [site, courses, params] = await Promise.all([
    getSite(),
    getCourses(),
    searchParams,
  ]);
  const requested = one(params.course);
  const initialCourse = courses.some((c) => c.slug === requested)
    ? requested
    : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-3">
        <BackButton href="/student/courses" label="My Courses" />
        <div>
          <h1 className="type-h1 m-0">Apply for a course</h1>
          <p className="text-ink-muted mt-1 mb-0">
            Choose a course and confirm. The office confirms your seat within
            one working day.
          </p>
        </div>
      </div>
      {site.allow_registration ? (
        <ApplyForCourse
          courses={courses}
          initialCourse={initialCourse}
          registrationFee={site.registration_fee}
        />
      ) : (
        <Card>
          <EmptyState
            icon={<PhoneCall />}
            title="Course requests are closed right now"
            text="Call or visit the institute, and the office will add you to the course."
            action={
              site.phones[0] ? (
                <ButtonLink href={telHref(site.phones[0])}>
                  Call {site.phones[0]}
                </ButtonLink>
              ) : (
                <ButtonLink href="/#contact">Contact Us</ButtonLink>
              )
            }
          />
        </Card>
      )}
    </div>
  );
}
