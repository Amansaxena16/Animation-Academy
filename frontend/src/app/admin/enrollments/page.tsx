"use client";

import { ClipboardList, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { EnrollmentActions } from "@/components/admin/EnrollmentActions";
import { PageHeader } from "@/components/admin/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Form";
import { CellUser, Pager, Table } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { PAGE_SIZE, useAdmin, useAdminPage } from "@/lib/admin";
import { formatDateShort, titleCase } from "@/lib/format";
import { enrollmentTone } from "@/lib/status";
import type { AdminCourse, AdminEnrollment } from "@/types/admin";

const STATUSES = [
  "All",
  "Pending",
  "Active",
  "Completed",
  "Cancelled",
] as const;
type Status = (typeof STATUSES)[number];

function EnrollmentsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = STATUSES.find((s) => s === params.get("status")) ?? "All";
  const [status, setStatus] = useState<Status>(initial);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [course, setCourse] = useState("");
  const [page, setPage] = useState(1);

  const { data: courses } = useAdmin<AdminCourse[]>("courses/");
  const { data, isPending, isError, isFetching } =
    useAdminPage<AdminEnrollment>("enrollments", {
      status: status === "All" ? undefined : status,
      q: q.trim() || undefined,
      course: course || undefined,
      page,
    });

  const filter = (fn: () => void) => {
    fn();
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Enrollments"
        text="Applications and enrolled courses. Approve new admissions, and complete a course to issue its certificate."
      />

      <Tabs
        items={STATUSES.map((s) => ({ key: s, label: s }))}
        active={status}
        onChange={(s) =>
          filter(() => {
            setStatus(s);
            // Keep the tab in the address, so a refresh or a shared link opens the same list.
            router.replace(
              s === "All"
                ? "/admin/enrollments"
                : `/admin/enrollments?status=${s}`,
              { scroll: false },
            );
          })
        }
      />

      <div className="grid gap-3 md:grid-cols-[1fr_280px]">
        <Input
          type="search"
          aria-label="Search enrollments"
          icon={<Search />}
          placeholder="Student name, AA-STU code or EN number"
          value={q}
          onChange={(e) => filter(() => setQ(e.target.value))}
        />
        <Select
          aria-label="Course"
          value={course}
          onChange={(e) => filter(() => setCourse(e.target.value))}
        >
          <option value="">All courses</option>
          {courses?.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {isError && (
        <Alert tone="danger">
          Enrollments didn&apos;t load. Refresh the page to try again.
        </Alert>
      )}

      <Card
        className={
          isFetching && !isPending
            ? "overflow-hidden opacity-70 transition-opacity"
            : "overflow-hidden"
        }
      >
        {isPending || !data ? (
          <div className="flex flex-col gap-3 p-6">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          <>
            <Table
              caption="Enrollments"
              rows={data.results}
              rowKey={(e) => e.code}
              empty={
                <EmptyState
                  icon={<ClipboardList />}
                  title="Nothing here"
                  text={
                    q || course
                      ? "No enrollment matches these filters."
                      : "No enrollments with this status yet."
                  }
                />
              }
              columns={[
                {
                  key: "student",
                  header: "Student",
                  render: (e) => (
                    <Link
                      href={`/admin/students/${e.student.code}`}
                      className="text-ink no-underline"
                    >
                      <CellUser
                        avatar={
                          <Avatar
                            name={titleCase(e.student.name)}
                            src={e.student.photo}
                            size="sm"
                          />
                        }
                        name={titleCase(e.student.name)}
                        sub={e.student.code}
                      />
                    </Link>
                  ),
                },
                {
                  key: "course",
                  header: "Course",
                  render: (e) => (
                    <div className="min-w-[160px]">
                      <span className="block">{e.course.name}</span>
                      <small className="type-mono text-ink-muted">
                        {e.code}
                      </small>
                    </div>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (e) => (
                    <div className="flex flex-col items-start gap-1">
                      <Badge tone={enrollmentTone[e.status]} dot>
                        {e.status}
                      </Badge>
                      {e.status === "Cancelled" && e.note && (
                        <small className="text-ink-muted">{e.note}</small>
                      )}
                    </div>
                  ),
                },
                {
                  key: "applied",
                  header: "Applied",
                  render: (e) => formatDateShort(e.applied_at),
                },
                {
                  key: "actions",
                  header: "Actions",
                  actions: true,
                  render: (e) => <EnrollmentActions enrollment={e} compact />,
                },
              ]}
            />
            <Pager
              page={page}
              pageSize={PAGE_SIZE}
              count={data.count}
              onPage={setPage}
            />
          </>
        )}
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <EnrollmentsPage />
    </Suspense>
  );
}
