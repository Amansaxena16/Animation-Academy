"use client";

import { Award, Download, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Form";
import { Pager, Table } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { downloadAdminCertificate, PAGE_SIZE, useAdminPage } from "@/lib/admin";
import { formatDateLong, titleCase } from "@/lib/format";
import type { AdminCertificate } from "@/types/admin";

const THIS_YEAR = new Date().getFullYear();

function DownloadButton({ code }: { code: string }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="sm"
      variant="secondary"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await downloadAdminCertificate(code);
        } catch {
          toast({ title: "Download failed", tone: "danger" });
        } finally {
          setBusy(false);
        }
      }}
    >
      <Download aria-hidden /> PDF
    </Button>
  );
}

export default function CertificatesPage() {
  const [q, setQ] = useState("");
  const [year, setYear] = useState("");
  const [page, setPage] = useState(1);
  const { data, isPending, isError } = useAdminPage<AdminCertificate>(
    "certificates",
    {
      q: q.trim() || undefined,
      year: year || undefined,
      page,
    },
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/admin", label: "Dashboard" }}
        title="Certificates"
        text={
          <>
            Issued when a course is completed (from Enrollments). Anyone can
            check one at <Link href="/verify">/verify</Link>.
          </>
        }
      />
      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <Input
          type="search"
          aria-label="Search certificates"
          icon={<Search />}
          placeholder="Certificate ID, student name or code"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <Select
          aria-label="Year"
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All years</option>
          {Array.from({ length: 6 }, (_, i) => THIS_YEAR - i).map((y) => (
            <option key={y}>{y}</option>
          ))}
        </Select>
      </div>
      {isError && (
        <Alert tone="danger">
          Certificates didn&apos;t load. Refresh the page to try again.
        </Alert>
      )}
      <Card className="overflow-hidden">
        {isPending || !data ? (
          <div className="flex flex-col gap-3 p-6">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : (
          <>
            <Table
              caption="Certificates"
              rows={data.results}
              rowKey={(c) => c.code}
              empty={
                <EmptyState
                  icon={<Award />}
                  title="No certificates"
                  text="Complete an active enrollment to issue one."
                />
              }
              columns={[
                {
                  key: "code",
                  header: "Certificate",
                  render: (c) => <span className="type-mono">{c.code}</span>,
                },
                {
                  key: "student",
                  header: "Student",
                  render: (c) => (
                    <Link
                      href={`/admin/students/${c.student.code}`}
                      className="text-ink touch:min-h-11 flex flex-col justify-center no-underline hover:underline"
                    >
                      {titleCase(c.student.name)}
                      <small className="type-mono text-ink-muted block text-xs">
                        {c.student.code}
                      </small>
                    </Link>
                  ),
                },
                {
                  key: "course",
                  header: "Course",
                  render: (c) => c.course.name,
                },
                {
                  key: "issued",
                  optional: true,
                  header: "Issued",
                  render: (c) => (
                    <span>
                      {formatDateLong(c.issued_on)}
                      {c.issued_by && (
                        <small className="text-ink-muted block text-xs">
                          by {titleCase(c.issued_by)}
                        </small>
                      )}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  header: "Actions",
                  actions: true,
                  render: (c) => <DownloadButton code={c.code} />,
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
