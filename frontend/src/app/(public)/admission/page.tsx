import { PhoneCall } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { cookies } from "next/headers";

import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSite, telHref } from "@/lib/content";
import { getCourses } from "@/lib/courses";

import { AdmissionForm } from "./AdmissionForm";
import { ApplyAsStudent } from "./ApplyAsStudent";

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
  await connection(); // request-time: don't fetch the API during the build
  const [site, courses, params, jar] = await Promise.all([
    getSite(),
    getCourses(),
    searchParams,
    cookies(),
  ]);
  // The role cookie (not a credential) says to offer the signed-in flow; ApplyAsStudent
  // restores and checks the real session before anything is sent.
  const signedIn = Boolean(jar.get("aa_session")?.value);
  const Form = signedIn ? ApplyAsStudent : AdmissionForm;
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
            {signedIn
              ? "Choose a course and confirm — your details are already on record. The office confirms your seat within one working day."
              : "The same details as the institute's paper admission form, in four short steps. It takes about five minutes; the office confirms your seat within one working day."}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-10 md:px-6 md:py-12">
        {site.allow_registration ? (
          <Form
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
