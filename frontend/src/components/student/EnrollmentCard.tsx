import { Award, CalendarDays, Clock } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { feeLong, formatDateLong } from "@/lib/format";
import { enrollmentTone } from "@/lib/status";
import { STATUS_NOTE } from "@/lib/student";
import type { MyEnrollment } from "@/types/student";

/** One application or enrolled course, as the student sees it. */
export function EnrollmentCard({
  enrollment,
  compact,
}: {
  enrollment: MyEnrollment;
  compact?: boolean;
}) {
  const { course } = enrollment;
  return (
    <Card className={cn("flex flex-col gap-3", compact ? "p-4" : "p-5")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-accent-ink text-[11px] leading-4 font-bold tracking-[0.08em] uppercase">
            {course.kind} · {course.duration_label}
          </span>
          <h3 className="type-h3 m-0">
            <Link
              href={`/courses/${course.slug}`}
              className="text-ink hover:text-brand-ink no-underline"
            >
              {course.name}
            </Link>
          </h3>
        </div>
        <Badge tone={enrollmentTone[enrollment.status]} dot>
          {enrollment.status}
        </Badge>
      </div>

      <div className="text-ink-muted flex flex-wrap gap-x-5 gap-y-1 text-[13px] [&_svg]:size-[15px]">
        <span className="inline-flex items-center gap-1.5">
          Application{" "}
          <span className="type-mono text-ink">{enrollment.code}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays aria-hidden /> Applied{" "}
          {formatDateLong(enrollment.applied_at)}
        </span>
        {course.schedule &&
          enrollment.status !== "Completed" &&
          enrollment.status !== "Cancelled" && (
            <span className="inline-flex items-center gap-1.5">
              <Clock aria-hidden /> {course.schedule}
              {course.next_batch_start && enrollment.status === "Pending" && (
                <> · next batch {course.next_batch_start}</>
              )}
            </span>
          )}
      </div>

      {!compact && (
        <p className="text-ink-muted m-0 text-sm">{feeLong(course)}</p>
      )}

      {enrollment.certificate_code ? (
        <p className="bg-success-soft text-success-ink m-0 inline-flex items-center gap-2 self-start rounded-md px-3 py-2 text-sm font-semibold">
          <Award className="size-4" aria-hidden />
          Certificate{" "}
          <span className="type-mono">{enrollment.certificate_code}</span>
        </p>
      ) : (
        <p className="text-ink-muted m-0 text-sm">
          {STATUS_NOTE[enrollment.status]}
        </p>
      )}
    </Card>
  );
}
