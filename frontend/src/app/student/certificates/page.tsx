"use client";

import { Award, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";
import { formatDateLong } from "@/lib/format";
import { useCertificates } from "@/lib/student";

export default function CertificatesPage() {
  const { data, isPending, isError } = useCertificates();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="type-h1 m-0">Certificates</h1>
        <p className="text-ink-muted mt-1 mb-0">
          Download or print your certificates, and share a link anyone can use
          to check them.
        </p>
      </div>

      {isError && (
        <Alert tone="danger">
          Your certificates didn&apos;t load. Refresh the page to try again.
        </Alert>
      )}

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
      ) : data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((c) => (
            <Link
              key={c.code}
              href={`/student/certificates/${c.code}`}
              className="text-ink no-underline"
            >
              <Card hover className="flex items-center gap-4 p-5">
                <span className="bg-accent-soft text-accent-ink grid size-14 shrink-0 place-items-center rounded-md">
                  <Award className="size-7" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <b className="type-h3 block">{c.course.name}</b>
                  <span className="text-ink-muted text-[13px]">
                    <span className="type-mono">{c.code}</span> · issued{" "}
                    {formatDateLong(c.issued_on)}
                  </span>
                </div>
                <ChevronRight
                  className="text-ink-muted size-5 shrink-0"
                  aria-hidden
                />
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<Award />}
            title="No certificates yet"
            text="When the office marks a course as completed, its certificate appears here."
            action={
              <ButtonLink href="/student/courses" variant="secondary">
                My Courses
              </ButtonLink>
            }
          />
        </Card>
      )}
    </div>
  );
}
