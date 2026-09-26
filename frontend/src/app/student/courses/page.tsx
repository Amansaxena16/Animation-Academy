"use client";

import { BookOpen, Plus } from "lucide-react";
import { useState } from "react";

import { EnrollmentCard } from "@/components/student/EnrollmentCard";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";
import { SegmentedControl } from "@/components/ui/Tabs";
import { useEnrollments } from "@/lib/student";
import type { EnrollmentStatus } from "@/types/student";

type Filter = "all" | EnrollmentStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "Pending", label: "Pending" },
  { key: "Active", label: "Active" },
  { key: "Completed", label: "Completed" },
];

const EMPTY: Record<Filter, string> = {
  all: "You haven't applied for a course yet.",
  Pending: "Nothing is waiting for confirmation.",
  Active: "You're not studying a course right now.",
  Completed: "Completed courses and their certificates will appear here.",
  Cancelled: "",
};

export default function MyCoursesPage() {
  const { data, isPending, isError, refetch } = useEnrollments();
  const [filter, setFilter] = useState<Filter>("all");
  const shown = (data ?? []).filter(
    (e) => filter === "all" || e.status === filter,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="type-h1 m-0">My courses</h1>
          <p className="text-ink-muted mt-1 mb-0">
            Every course you&apos;ve applied for, and where it stands.
          </p>
        </div>
        <ButtonLink href="/admission">
          <Plus aria-hidden /> Apply for a Course
        </ButtonLink>
      </div>

      <SegmentedControl
        label="Filter by status"
        items={FILTERS}
        active={filter}
        onChange={setFilter}
      />

      {isError && (
        <Alert tone="danger" title="Your courses didn't load">
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
        <div className="flex flex-col gap-4">
          <Skeleton className="h-36 rounded-lg" />
          <Skeleton className="h-36 rounded-lg" />
        </div>
      ) : shown.length ? (
        <div className="flex flex-col gap-4">
          {shown.map((e) => (
            <EnrollmentCard key={e.code} enrollment={e} />
          ))}
        </div>
      ) : (
        !isError && (
          <Card>
            <EmptyState
              icon={<BookOpen />}
              title="Nothing here"
              text={EMPTY[filter]}
              action={<ButtonLink href="/courses">Browse Courses</ButtonLink>}
            />
          </Card>
        )
      )}
    </div>
  );
}
