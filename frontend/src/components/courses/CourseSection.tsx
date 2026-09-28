"use client";

/* eslint-disable @next/next/no-img-element -- course images come from the API's media host */
import { ChevronDown, Clock, Layers, MessageSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CourseArt } from "@/components/ui/CourseArt";
import { Price } from "@/components/ui/CourseCard";
import { cn } from "@/lib/cn";
import { enquireAbout } from "@/lib/enquire";
import type { Category, CourseDetail } from "@/types/course";

import { Syllabus } from "./Syllabus";

const chip = (on: boolean) =>
  cn(
    "touch:min-h-11 rounded-pill border px-4 py-2 text-sm font-semibold transition-colors",
    on
      ? "border-brand bg-brand text-on-brand"
      : "border-line text-ink-muted hover:border-line-hover hover:text-ink",
  );

/** Every published course on the home page: a category filter, and cards that open in place
 *  to show the syllabus (there are no separate course pages). /#course-<slug> opens one. */
export function CourseSection({
  courses,
  categories,
  registrationFee,
}: {
  courses: CourseDetail[];
  categories: Category[];
  registrationFee: number;
}) {
  const [category, setCategory] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const shown = useMemo(
    () => courses.filter((c) => !category || c.category === category),
    [courses, category],
  );

  // A link such as /#course-dtp (old course pages redirect here) opens that course, on load
  // and when the hash changes later.
  useEffect(() => {
    const openFromHash = () => {
      const slug = window.location.hash.match(/^#course-(.+)$/)?.[1];
      if (!slug || !courses.some((c) => c.slug === slug)) return;
      setCategory("");
      setOpen(slug);
      requestAnimationFrame(() =>
        document.getElementById(`course-${slug}`)?.scrollIntoView(),
      );
    };
    const frame = requestAnimationFrame(openFromHash);
    window.addEventListener("hashchange", openFromHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", openFromHash);
    };
  }, [courses]);

  return (
    <div className="flex flex-col gap-8">
      <div
        role="group"
        aria-label="Filter by category"
        className="flex flex-wrap gap-2"
      >
        <button
          type="button"
          aria-pressed={!category}
          className={chip(!category)}
          onClick={() => setCategory("")}
        >
          All · {courses.length}
        </button>
        {categories
          .filter((c) => c.count > 0)
          .map((c) => (
            <button
              key={c.value}
              type="button"
              aria-pressed={category === c.value}
              className={chip(category === c.value)}
              onClick={() => setCategory(c.value)}
            >
              {c.label} · {c.count}
            </button>
          ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((course) => (
          <CourseTile
            key={course.slug}
            course={course}
            registrationFee={registrationFee}
            open={open === course.slug}
            onToggle={() =>
              setOpen((o) => (o === course.slug ? null : course.slug))
            }
          />
        ))}
      </div>
    </div>
  );
}

function CourseTile({
  course,
  registrationFee,
  open,
  onToggle,
}: {
  course: CourseDetail;
  registrationFee: number;
  open: boolean;
  onToggle: () => void;
}) {
  const panel = `syllabus-${course.slug}`;
  return (
    <Card
      id={`course-${course.slug}`}
      className={cn(
        "flex scroll-mt-28 flex-col overflow-hidden",
        open && "sm:col-span-2 lg:col-span-3",
      )}
    >
      <div className={cn("flex flex-col", open && "lg:flex-row")}>
        <div
          className={cn(
            "bg-surface-sunken border-line relative aspect-[16/9] overflow-hidden border-b",
            open && "lg:aspect-auto lg:w-[38%] lg:border-r lg:border-b-0",
          )}
        >
          {course.image ? (
            <img
              src={course.image}
              alt=""
              className="block size-full object-cover"
            />
          ) : (
            <CourseArt category={course.category} className="block size-full" />
          )}
          {course.tag && (
            <Badge tone="accent" className="absolute top-3 left-3">
              {course.tag}
            </Badge>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-brand-ink text-xs leading-4 font-bold tracking-[0.1em] uppercase">
              {course.kind} · {course.duration_label}
            </span>
            <Badge tone="outline" pill>
              {course.level}
            </Badge>
          </div>
          <h3 className="font-display text-ink m-0 text-xl leading-[27px] font-semibold tracking-[-0.015em]">
            {course.name}
          </h3>
          <p
            className={cn(
              "text-ink-muted m-0 text-sm leading-[22px]",
              !open && "line-clamp-2",
            )}
          >
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
            {course.schedule && <span>{course.schedule}</span>}
          </div>
          <div className="mt-auto pt-1.5">
            <Price fee={course} registrationFee={registrationFee} />
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              aria-expanded={open}
              aria-controls={panel}
              onClick={onToggle}
            >
              {open ? "Hide Syllabus" : "Syllabus"}
              <ChevronDown
                aria-hidden
                className={cn("transition-transform", open && "rotate-180")}
              />
            </Button>
            {/* A plain anchor: the browser jumps to the form itself (Next's Link scrolled back). */}
            <a
              href="#admission"
              className={cn(
                buttonClasses({ variant: "accent", size: "sm" }),
                "flex-1",
              )}
              onClick={() => enquireAbout(course.slug)}
            >
              <MessageSquare aria-hidden /> Enquire
            </a>
          </div>
        </div>
      </div>
      {open && (
        <div id={panel} className="border-line bg-surface border-t p-5 md:p-6">
          <h4 className="type-overline text-brand-ink mt-0 mb-4">
            Syllabus · {course.name}
          </h4>
          <Syllabus groups={course.syllabus} />
        </div>
      )}
    </Card>
  );
}
