"use client";

import {
  Award,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Mail,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";

import { EnrollmentActions } from "@/components/admin/EnrollmentActions";
import { PageHeader } from "@/components/admin/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { CellUser, Table } from "@/components/ui/Table";
import { useAdminDashboard } from "@/lib/admin";
import { useAuth } from "@/lib/auth";
import { formatDateShort, num, titleCase } from "@/lib/format";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data, isPending, isError } = useAdminDashboard();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Good day, ${titleCase(user?.name ?? "").split(" ")[0]}`}
        text="What needs attention at the institute today."
      />

      {isError && (
        <Alert tone="danger">
          The dashboard didn&apos;t load. Refresh the page to try again.
        </Alert>
      )}

      {isPending || !data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[124px] rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard
              icon={<ClipboardList />}
              tone="amber"
              value={num(data.counts.pending_admissions)}
              label="Admissions waiting"
            />
            <StatCard
              icon={<BookOpen />}
              tone="blue"
              value={num(data.counts.active_enrollments)}
              label="Students studying now"
            />
            <StatCard
              icon={<Users />}
              value={num(data.counts.students)}
              label="Students on record"
            />
            <StatCard
              icon={<TrendingUp />}
              tone="green"
              value={num(data.counts.admissions_this_month)}
              label="Applications this month"
            />
            <StatCard
              icon={<Award />}
              tone="green"
              value={num(data.counts.certificates)}
              label="Certificates issued"
            />
            <StatCard
              icon={<Mail />}
              tone="amber"
              value={num(data.counts.unhandled_messages)}
              label="Messages to answer"
            />
          </div>

          <Card className="overflow-hidden">
            <CardHeader
              title="Admissions waiting for you"
              actions={
                <ButtonLink
                  href="/admin/enrollments?status=Pending"
                  variant="ghost"
                  size="sm"
                >
                  See All
                </ButtonLink>
              }
            />
            <Table
              caption="Pending admissions"
              rows={data.pending}
              rowKey={(e) => e.code}
              empty={
                <EmptyState
                  icon={<ClipboardList />}
                  title="All caught up"
                  text="New applications from the website appear here."
                />
              }
              columns={[
                {
                  key: "student",
                  header: "Student",
                  render: (e) => (
                    <Link
                      href={`/admin/students/${e.student.code}`}
                      className="text-ink touch:min-h-11 flex items-center no-underline"
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
                  render: (e) => e.course.name,
                },
                {
                  key: "mobile",
                  optional: true,
                  header: "Mobile",
                  render: (e) => (
                    <a
                      href={`tel:+91${e.student.mobile}`}
                      className="touch:min-h-11 inline-flex items-center"
                    >
                      {e.student.mobile}
                    </a>
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
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Messages from the website"
                actions={
                  <ButtonLink href="/admin/messages" variant="ghost" size="sm">
                    All Messages
                  </ButtonLink>
                }
              />
              {data.recent_messages.length ? (
                <ul className="m-0 flex list-none flex-col p-0">
                  {data.recent_messages.map((m) => (
                    <li
                      key={m.id}
                      className="border-line border-t px-6 py-4 first:border-t-0"
                    >
                      <div className="flex justify-between gap-3">
                        <b className="text-sm">{m.name}</b>
                        <span className="text-ink-muted text-[13px]">
                          {formatDateShort(m.created_at)}
                        </span>
                      </div>
                      <p className="text-ink-muted m-0 line-clamp-2 text-sm">
                        {m.message}
                      </p>
                      {m.phone && (
                        <a
                          href={`tel:+91${m.phone}`}
                          className="text-navy-ink touch:min-h-11 inline-flex items-center self-start text-[13px] font-semibold"
                        >
                          Call {m.phone}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-ink-muted m-0 px-6 py-5 text-sm">
                  No unanswered messages.
                </p>
              )}
            </Card>
            <Card>
              <CardHeader
                title="Coming up"
                actions={
                  <ButtonLink
                    href="/admin/announcements"
                    variant="ghost"
                    size="sm"
                  >
                    Announcements
                  </ButtonLink>
                }
              />
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
                          {formatDateShort(a.date)} · {a.category}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-ink-muted m-0 px-6 py-5 text-sm">
                  No published notices from today onwards.
                </p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
