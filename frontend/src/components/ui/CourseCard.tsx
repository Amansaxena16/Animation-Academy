/* eslint-disable @next/next/no-img-element -- course images come from the API's media host */
import { Clock, Layers } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/cn";
import { feeHeadline, feeLong, feeSubline, type CourseFee } from "@/lib/format";
import { levelTone } from "@/lib/status";
import type { CourseSummary } from "@/types/course";

import { Badge } from "./Badge";
import { ButtonLink } from "./Button";
import { Card } from "./Card";
import { CourseArt } from "./CourseArt";

/** "₹800/month" with the total and registration in secondary text. Never a total alone. */
export function Price({ fee, registrationFee, large }: { fee: CourseFee; registrationFee?: number; large?: boolean }) {
  const { amount, unit } = feeHeadline(fee);
  return (
    <div className="min-w-0">
      <span
        className={cn(
          "inline-flex items-baseline gap-[3px] font-display font-bold text-brand-ink",
          large ? "text-[26px] leading-[30px]" : "text-xl leading-6",
        )}
      >
        {amount}
        <em className="font-sans text-[13px] leading-[18px] font-medium text-ink-muted not-italic">{unit}</em>
      </span>
      <div className="text-[13px] leading-[18px] text-ink-muted">{feeSubline(fee, registrationFee)}</div>
    </div>
  );
}

/** A standalone fee panel for the course page. */
export function FeeBox({ fee, registrationFee }: { fee: CourseFee; registrationFee?: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-brand-soft px-4 py-3.5">
      <span className="type-overline text-brand-ink">Fees</span>
      <Price fee={fee} registrationFee={registrationFee} large />
      <span className="text-[13px] text-ink-muted">{feeLong(fee)}</span>
    </div>
  );
}

interface CourseCardProps {
  course: CourseSummary;
  registrationFee?: number;
  /** Where Enroll Now goes; the admission form by default. */
  enrollHref?: string;
}

export function CourseCard({ course, registrationFee, enrollHref }: CourseCardProps) {
  const href = `/courses/${course.slug}`;
  return (
    <Card hover className="group relative flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden bg-navy">
        {course.image ? (
          <img
            src={course.image}
            alt=""
            className="block size-full object-cover transition-transform duration-400 group-hover:scale-[1.04]"
          />
        ) : (
          <CourseArt
            category={course.category}
            className="block size-full transition-transform duration-400 group-hover:scale-[1.04]"
          />
        )}
        {course.tag && (
          <Badge tone="accent" className="absolute top-3 left-3">
            {course.tag}
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 px-5 pt-[18px] pb-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] leading-4 font-bold tracking-[0.08em] text-accent-ink uppercase">
            {course.kind} · {course.durationLabel}
          </span>
          <Badge tone={levelTone[course.level]}>{course.level}</Badge>
        </div>
        <h3 className="m-0 font-display text-[17px] leading-6 font-semibold text-ink">
          <Link href={href} className="text-inherit no-underline after:absolute after:inset-0 hover:text-brand-ink focus-visible:outline-none">
            {course.name}
          </Link>
        </h3>
        <p className="m-0 line-clamp-2 text-sm leading-[22px] text-ink-muted">{course.description}</p>
        <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[13px] text-ink-muted [&_svg]:size-[15px]">
          <span className="inline-flex items-center gap-[5px]">
            <Clock aria-hidden />
            {course.durationLabel}
          </span>
          <span className="inline-flex items-center gap-[5px]">
            <Layers aria-hidden />
            {course.category}
          </span>
        </div>
        <div className="mt-auto border-t border-line pt-3.5">
          <Price fee={course} registrationFee={registrationFee} />
        </div>
        {/* relative + z-10 keeps the buttons above the card-wide title link */}
        <div className="relative z-10 flex gap-2">
          <ButtonLink href={href} variant="secondary" size="sm" className="flex-1">
            View Details
          </ButtonLink>
          <ButtonLink href={enrollHref ?? `/admission?course=${course.slug}`} variant="accent" size="sm" className="flex-1">
            Enroll Now
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}
