"use client";

import {
  Award,
  BookOpen,
  CalendarDays,
  CircleCheck,
  Hourglass,
  Plus,
  UserRound,
} from "lucide-react";

import { EnrollmentCard } from "@/components/student/EnrollmentCard";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { useAuth } from "@/lib/auth";
import { formatDateShort, titleCase } from "@/lib/format";
import { useDashboard } from "@/lib/student";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data, isPending, isError, refetch } = useDashboard();
  const firstName = titleCase(user?.name ?? "").split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="type-h1 m-0">Welcome, {firstName}</h1>
          <p className="text-ink-muted mt-1 mb-0">
            Student ID{" "}
            <span className="type-mono text-ink">{user?.student_code}</span>
          </p>
        </div>
        <ButtonLink href="/admission" variant="secondary">
          <Plus aria-hidden /> Apply for a Course
        </ButtonLink>
      </div>

      {isError && (
        <Alert tone="danger" title="Your dashboard didn't load">
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 -ml-3"
            onClick={() => refetch()}
          >
            Try Again
          </Button>
        </Alert>
      )}

      {isPending ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[124px] rounded-lg" />
          ))}
        </div>
      ) : (
        data && (
          <>
            {data.counts.pending > 0 && (
              <Alert
                title={
                  data.counts.pending === 1
                    ? "Your application is with the office"
                    : "Your applications are with the office"
                }
              >
                They&apos;ll call you within one working day to confirm your
                seat. Fees are paid at the institute after confirmation.
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                icon={<Hourglass />}
                tone="amber"
                value={data.counts.pending}
                label="Awaiting confirmation"
              />
              <StatCard
                icon={<BookOpen />}
                tone="blue"
                value={data.counts.active}
                label="Studying now"
              />
              <StatCard
                icon={<CircleCheck />}
                tone="green"
                value={data.counts.completed}
                label="Completed"
              />
              <StatCard
                icon={<Award />}
                value={data.counts.certificates}
                label="Certificates"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
              <section className="flex flex-col gap-4">
                <h2 className="type-h2 m-0">Your courses</h2>
                {data.current.length ? (
                  data.current.map((e) => (
                    <EnrollmentCard key={e.code} enrollment={e} />
                  ))
                ) : (
                  <Card>
                    <EmptyState
                      icon={<BookOpen />}
                      title="No current courses"
                      text="When you apply for a course, its admission status and batch timings show here."
                      action={
                        <ButtonLink href="/courses">Browse Courses</ButtonLink>
                      }
                    />
                  </Card>
                )}
              </section>

              <aside className="flex flex-col gap-4">
                <Card>
                  <CardHeader title="Coming up at the institute" />
                  {data.upcoming.length ? (
                    <ul className="m-0 flex list-none flex-col p-0">
                      {data.upcoming.map((a) => (
                        <li
                          key={a.id}
                          className="border-line flex gap-3 border-t px-6 py-4 first:border-t-0"
                        >
                          <CalendarDays
                            className="text-accent-ink mt-0.5 size-[18px] shrink-0"
                            aria-hidden
                          />
                          <div>
                            <b className="block text-sm">{a.title}</b>
                            <span className="text-ink-muted text-[13px]">
                              {formatDateShort(a.date)} · {a.text}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-ink-muted m-0 px-6 py-5 text-sm">
                      No holidays or events in the coming weeks.
                    </p>
                  )}
                </Card>
                <Card pad className="flex flex-col gap-3">
                  <h3 className="type-h3 m-0">Keep your details up to date</h3>
                  <p className="text-ink-muted m-0 text-sm">
                    The office uses your mobile number to confirm admissions and
                    batch changes.
                  </p>
                  <ButtonLink
                    href="/student/profile"
                    variant="secondary"
                    size="sm"
                    className="self-start"
                  >
                    <UserRound aria-hidden /> My Profile
                  </ButtonLink>
                </Card>
              </aside>
            </div>
          </>
        )
      )}
    </div>
  );
}
