"use client";

import { Search, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Form";
import { CellUser, Pager, Table } from "@/components/ui/Table";
import { SegmentedControl } from "@/components/ui/Tabs";
import { PAGE_SIZE, useAdminPage } from "@/lib/admin";
import { formatDateShort, titleCase } from "@/lib/format";
import { studentTone } from "@/lib/status";
import type { AdminStudentRow } from "@/types/admin";

const STATUSES = ["All", "Pending", "Active", "Graduated", "Inactive"] as const;

export default function StudentsPage() {
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("All");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const { data, isPending, isError } = useAdminPage<AdminStudentRow>(
    "students",
    {
      status: status === "All" ? undefined : status,
      q: q.trim() || undefined,
      page,
    },
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/admin", label: "Dashboard" }}
        title="Students"
        text="Everyone who has applied online or been added at the office."
        actions={
          <ButtonLink href="/admin/students/new">
            <UserPlus aria-hidden /> Add Student
          </ButtonLink>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          label="Filter by status"
          items={STATUSES.map((s) => ({ key: s, label: s }))}
          active={status}
          onChange={(s) => {
            setStatus(s);
            setPage(1);
          }}
        />
        <Input
          type="search"
          aria-label="Search students"
          icon={<Search />}
          placeholder="Name, AA-STU code, mobile or email"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          className="min-w-[280px]"
        />
      </div>

      {isError && (
        <Alert tone="danger">
          Students didn&apos;t load. Refresh the page to try again.
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
          <>
            <Table
              caption="Students"
              rows={data.results}
              rowKey={(s) => s.code}
              empty={
                <EmptyState
                  icon={<Users />}
                  title="No students found"
                  text="Try another name, code or mobile number."
                />
              }
              columns={[
                {
                  key: "student",
                  header: "Student",
                  render: (s) => (
                    <Link
                      href={`/admin/students/${s.code}`}
                      className="text-ink no-underline"
                    >
                      <CellUser
                        avatar={
                          <Avatar
                            name={titleCase(s.name)}
                            src={s.photo}
                            size="sm"
                          />
                        }
                        name={titleCase(s.name)}
                        sub={s.code}
                      />
                    </Link>
                  ),
                },
                {
                  key: "contact",
                  header: "Contact",
                  render: (s) => (
                    <div className="min-w-[160px]">
                      <a href={`tel:+91${s.mobile}`} className="block">
                        {s.mobile}
                      </a>
                      <small className="text-ink-muted">{s.email}</small>
                    </div>
                  ),
                },
                { key: "city", header: "City", render: (s) => s.city },
                {
                  key: "courses",
                  header: "Courses",
                  render: (s) => s.enrollment_count,
                },
                {
                  key: "status",
                  header: "Status",
                  render: (s) => (
                    <Badge tone={studentTone[s.status]} dot>
                      {s.status}
                    </Badge>
                  ),
                },
                {
                  key: "joined",
                  header: "Joined",
                  render: (s) => formatDateShort(s.joined_at),
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
