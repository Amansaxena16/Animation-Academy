import { PhoneCall } from "lucide-react";
import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSite, telHref } from "@/lib/content";
import { getCourses } from "@/lib/courses";

import { AdmissionForm } from "./AdmissionForm";

export const metadata: Metadata = {
  title: "Apply for admission",
  description:
    "Apply online for a course at Animation Academy, Nehru Nagar, Kanpur. The same details as the institute's admission form, in four short steps.",
};

const one = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) ?? "";

export default async function AdmissionPage({
  searchParams,
}: PageProps<"/admission">) {
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
    <>
      <section className="border-line bg-surface-raised border-b">
        <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-6 md:py-14">
          <span className="type-overline text-accent-ink">Admission</span>
          <h1 className="type-display mt-3 mb-0">Apply for admission</h1>
          <p className="type-body-lg text-ink-muted mt-4 mb-0 max-w-[640px]">
            The same details as the institute&apos;s paper admission form, in
            four short steps. It takes about five minutes; the office confirms
            your seat within one working day.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-10 md:px-6 md:py-12">
        {site.allow_registration ? (
          <AdmissionForm
            courses={courses}
            initialCourse={initialCourse}
            registrationFee={site.registration_fee}
          />
        ) : (
          <Card>
            <EmptyState
              icon={<PhoneCall />}
              title="Online registration is closed right now"
              text="Admissions are still open at the institute. Call us or visit, and the office will help you apply."
              action={
                site.phones[0] ? (
                  <ButtonLink href={telHref(site.phones[0])}>
                    Call {site.phones[0]}
                  </ButtonLink>
                ) : (
                  <ButtonLink href="/contact">Contact Us</ButtonLink>
                )
              }
            />
          </Card>
        )}
      </section>
    </>
  );
}
