/* eslint-disable @next/next/no-img-element -- course images come from the API's media host */
import { Clock, Layers } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/cn";
import { feeHeadline, feeSubline, type CourseFee } from "@/lib/format";
import type { Course } from "@/types/course";

import { Badge } from "./Badge";
import { ButtonLink } from "./Button";
import { Card } from "./Card";
import { CourseArt } from "./CourseArt";

/** "₹800/month" with the total and registration in secondary text. Never a total alone. */
export function Price({
  fee,
  registrationFee,
  large,
}: {
  fee: CourseFee;
  registrationFee?: number;
  large?: boolean;
}) {
  const { amount, unit } = feeHeadline(fee);
  return (
    <div className="min-w-0">
      <span
        className={cn(
          "font-display text-brand-ink inline-flex items-baseline gap-[3px] font-bold",
          large ? "text-[26px] leading-[30px]" : "text-xl leading-6",
        )}
      >
        {amount}
        <em className="text-ink-muted font-sans text-[13px] leading-[18px] font-medium not-italic">
          {unit}
        </em>
      </span>
      <div className="text-ink-muted text-[13px] leading-[18px]">
        {feeSubline(fee, registrationFee)}
      </div>
    </div>
  );
}

/** A standalone fee panel for the course page. */
export function FeeBox({
  fee,
  registrationFee,
}: {
  fee: CourseFee;
  registrationFee?: number;
}) {
  return (
    <div className="bg-brand-soft flex flex-col gap-1 rounded-md px-4 py-3.5">
      <span className="type-overline text-brand-ink">Fees</span>
      <Price fee={fee} registrationFee={registrationFee} large />
      <span className="text-ink-muted text-[13px]">
        Course length: {fee.duration_label}
      </span>
    </div>
  );
}

/** Enroll Now: the student portal's one-step course request. Visitors who aren't signed in are
 *  sent to Login first and come back here; new students are admitted by the office. */
export const applyHref = (slug: string) => `/student/apply?course=${slug}`;

interface CourseCardProps {
  course: Course;
  registrationFee?: number;
  /** Where Enroll Now goes; the student's course request by default. */
  enrollHref?: string;
}

export function CourseCard({
  course,
  registrationFee,
  enrollHref,
}: CourseCardProps) {
  const href = `/#course-${course.slug}`;
  return (
    <Card hover className="group relative flex h-full flex-col overflow-hidden">
      <div className="bg-surface-sunken border-line relative aspect-[16/10] overflow-hidden border-b">
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
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-brand-ink text-[11px] leading-4 font-bold tracking-[0.1em] uppercase">
            {course.kind} · {course.duration_label}
          </span>
          <Badge tone="outline" pill>
            {course.level}
          </Badge>
        </div>
        <h3 className="font-display text-ink m-0 text-xl leading-[27px] font-semibold tracking-[-0.015em]">
          <Link
            href={href}
            className="hover:text-brand-ink text-inherit no-underline after:absolute after:inset-0 focus-visible:outline-none"
          >
            {course.name}
          </Link>
        </h3>
        <p className="text-ink-muted m-0 line-clamp-2 text-sm leading-[22px]">
          {course.description}
        </p>
        <div className="text-ink-muted flex flex-wrap gap-x-3.5 gap-y-1.5 text-[13px] [&_svg]:size-[15px]">
          <span className="inline-flex items-center gap-[5px]">
            <Clock aria-hidden />
            {course.duration_label}
          </span>
          <span className="inline-flex items-center gap-[5px]">
            <Layers aria-hidden />
            {course.category}
          </span>
        </div>
        <div className="mt-auto pt-1.5">
          <Price fee={course} registrationFee={registrationFee} />
        </div>
        {/* relative + z-10 keeps the buttons above the card-wide title link */}
        <div className="relative z-10 flex gap-2">
          <ButtonLink
            href={href}
            variant="secondary"
            size="sm"
            className="flex-1"
          >
            View Details
          </ButtonLink>
          <ButtonLink
            href={enrollHref ?? applyHref(course.slug)}
            variant="accent"
            size="sm"
            className="flex-1"
          >
            Enroll Now
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}
