import { BadgeCheck } from "lucide-react";
import Link from "next/link";

import { CourseArt } from "@/components/ui/CourseArt";
import { feeHeadline } from "@/lib/format";
import type { Course } from "@/types/course";

/** Decorative: animation keyframe tracks (the logo's orange diamonds) behind a real course. */
export function HeroArt({ course }: { course: Course | undefined }) {
  const fee = course && feeHeadline(course);
  return (
    <div className="relative hidden aspect-[10/11] w-full max-w-[460px] justify-self-end lg:block">
      <div className="bg-navy absolute inset-0 overflow-hidden rounded-xl shadow-lg">
        <svg viewBox="0 0 400 440" className="size-full" aria-hidden>
          <rect
            x="230"
            y="110"
            width="140"
            height="170"
            rx="16"
            fill="#285098"
          />
          <rect
            x="250"
            y="300"
            width="120"
            height="100"
            rx="16"
            fill="#f08030"
          />
          {[120, 190, 260, 330].map((y, row) => (
            <g key={y}>
              <line
                x1="40"
                y1={y}
                x2="210"
                y2={y}
                stroke="#3d73c4"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {[
                [90, 170],
                [60, 140, 200],
                [110, 190],
                [80, 160],
              ][row].map((x) => (
                <path
                  key={x}
                  d={`M${x} ${y - 7}l7 7-7 7-7-7Z`}
                  fill="#f08030"
                />
              ))}
            </g>
          ))}
        </svg>
      </div>

      <div className="border-line bg-surface-raised absolute top-8 -left-10 flex items-center gap-3 rounded-lg border px-4 py-3 shadow-md">
        <span className="bg-success-soft text-success-ink grid size-10 place-items-center rounded-md">
          <BadgeCheck className="size-5" aria-hidden />
        </span>
        <div>
          <b className="block text-sm">ISO 9001:2000</b>
          <span className="text-ink-muted text-[13px]">
            Certified institute
          </span>
        </div>
      </div>

      {course && fee && (
        <Link
          href={`/courses/${course.slug}`}
          className="border-line bg-surface-raised text-ink absolute -bottom-8 -left-12 w-[260px] overflow-hidden rounded-lg border no-underline shadow-lg transition-transform hover:-translate-y-0.5"
        >
          <div className="bg-navy aspect-[16/8]">
            <CourseArt category={course.category} className="block size-full" />
          </div>
          <div className="flex flex-col gap-1.5 px-4 py-3.5">
            <span className="text-accent-ink text-[11px] leading-4 font-bold tracking-[0.08em] uppercase">
              {course.kind} · {course.duration_label}
            </span>
            <b className="font-display text-[15px] leading-5">{course.name}</b>
            <span className="text-sm">
              <b className="font-display text-brand-ink">{fee.amount}</b>{" "}
              <span className="text-ink-muted">{fee.unit}</span>
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}
