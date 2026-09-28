"use client";

import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";
import { Table } from "@/components/ui/Table";
import { SegmentedControl } from "@/components/ui/Tabs";
import { useAdmin } from "@/lib/admin";
import { feeLong } from "@/lib/format";
import { courseStatusTone } from "@/lib/status";
import type { AdminCourse } from "@/types/admin";

export default function CoursesPage() {
  const [status, setStatus] = useState<"All" | "Published" | "Draft">("All");
  const { data, isPending, isError } = useAdmin<AdminCourse[]>("courses/", {
    status: status === "All" ? undefined : status,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/admin", label: "Dashboard" }}
        title="Courses"
        text="What the website shows, with fees and syllabus. Changes appear on the website straight away."
        actions={
          <ButtonLink href="/admin/courses/new">
            <Plus aria-hidden /> Add Course
          </ButtonLink>
        }
      />
      <SegmentedControl
        label="Filter by status"
        items={[
          { key: "All", label: "All" },
          { key: "Published", label: "Published" },
          { key: "Draft", label: "Draft" },
        ]}
        active={status}
        onChange={setStatus}
      />
      {isError && (
        <Alert tone="danger">
          Courses didn&apos;t load. Refresh the page to try again.
        </Alert>
      )}
      <Card className="overflow-hidden">
        {isPending || !data ? (
          <div className="flex flex-col gap-3 p-6">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          <Table
            caption="Courses"
            rows={data}
            rowKey={(c) => c.slug ?? c.name}
            empty={
              <EmptyState
                icon={<BookOpen />}
                title="No courses"
                text="Add the first course to show it on the website."
              />
            }
            columns={[
              {
                key: "name",
                header: "Course",
                render: (c) => (
                  <Link
                    href={`/admin/courses/${c.slug}`}
                    className="text-ink min-w-[200px] font-semibold no-underline hover:underline"
                  >
                    {c.name}
                    <small className="text-ink-muted block font-normal">
                      {c.kind} · {c.category}
                      {c.featured && " · featured"}
                    </small>
                  </Link>
                ),
              },
              {
                key: "fee",
                header: "Fees",
                render: (c) => <span className="text-sm">{feeLong(c)}</span>,
              },
              {
                key: "enrolled",
                header: "Enrollments",
                render: (c) => c.enrollment_count,
              },
              {
                key: "status",
                header: "Status",
                render: (c) => (
                  <Badge tone={courseStatusTone[c.status ?? "Draft"]} dot>
                    {c.status}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                actions: true,
                render: (c) => (
                  <ButtonLink
                    href={`/admin/courses/${c.slug}`}
                    variant="ghost"
                    size="sm"
                  >
                    Edit
                  </ButtonLink>
                ),
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
