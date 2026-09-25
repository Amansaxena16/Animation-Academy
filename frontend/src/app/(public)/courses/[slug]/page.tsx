import {
  CalendarDays,
  Clock,
  GraduationCap,
  Layers,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CourseArt } from "@/components/ui/CourseArt";
import { CourseCard, FeeBox } from "@/components/ui/CourseCard";
import { getCourse, getCourses } from "@/lib/courses";
import { courseTotal, feeLong, inr } from "@/lib/format";
import { SITE } from "@/lib/site";
import { levelTone } from "@/lib/status";
import type { Course, CourseDetail } from "@/types/course";

import { CourseTabs } from "./CourseTabs";
import { Syllabus } from "./Syllabus";

export async function generateMetadata({
  params,
}: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  if (!course) return { title: "Course not found" };
  return {
    title: `${course.name} — ${course.duration_label}`,
    description: `${course.description} ${feeLong(course)}.`,
  };
}

/** Other courses in the same category first, then the same level. */
function related(all: Course[], course: CourseDetail) {
  const others = all.filter((c) => c.slug !== course.slug);
  const byCategory = others.filter((c) => c.category === course.category);
  const byLevel = others.filter(
    (c) => c.category !== course.category && c.level === course.level,
  );
  return [...byCategory, ...byLevel].slice(0, 3);
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="bg-brand-soft text-brand-ink grid size-10 shrink-0 place-items-center rounded-md [&_svg]:size-5">
        {icon}
      </span>
      <div>
        <div className="text-ink-muted text-[13px]">{label}</div>
        <div className="text-ink font-semibold">{value}</div>
      </div>
    </div>
  );
}

export default async function CoursePage({
  params,
}: PageProps<"/courses/[slug]">) {
  await connection();
  const { slug } = await params;
  const [course, all] = await Promise.all([getCourse(slug), getCourses()]);
  if (!course) notFound();

  const topics = course.syllabus.reduce((n, g) => n + g.items.length, 0);
  const enrollHref = `/admission?course=${course.slug}`;
  const more = related(all, course);

  const overview = (
    <div className="flex flex-col gap-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Fact icon={<Clock />} label="Duration" value={course.duration_label} />
        <Fact icon={<GraduationCap />} label="Level" value={course.level} />
        {course.schedule && (
          <Fact
            icon={<CalendarDays />}
            label="Batch timings"
            value={course.schedule}
          />
        )}
        {course.next_batch_start && (
          <Fact
            icon={<CalendarDays />}
            label="Next batch starts"
            value={course.next_batch_start}
          />
        )}
        <Fact
          icon={<Layers />}
          label="Syllabus"
          value={`${topics} topics${course.syllabus.length > 1 ? ` in ${course.syllabus.length} semesters` : ""}`}
        />
        <Fact
          icon={<Wrench />}
          label="Taught"
          value="In the lab, a machine for every student"
        />
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="type-h2 m-0">How the fees work</h2>
        <ul className="text-ink-muted marker:text-brand m-0 flex list-disc flex-col gap-1.5 pl-5">
          {course.first_month_fee != null ? (
            <li>
              <b className="text-ink">{inr(course.first_month_fee)}</b> at
              admission, then{" "}
              <b className="text-ink">{inr(course.monthly_fee)} a month</b> for
              the remaining {course.months - 1} months.
            </li>
          ) : (
            <li>
              <b className="text-ink">{inr(course.monthly_fee)} a month</b> for{" "}
              {course.duration_label.toLowerCase()}.
            </li>
          )}
          <li>
            A one-time registration fee of{" "}
            <b className="text-ink">{inr(SITE.registrationFee)}</b> when you
            join.
          </li>
          <li>
            {inr(courseTotal(course))} across the whole course, plus
            registration. You pay month by month, never in one lump sum.
          </li>
          <li>No refund is allowed after confirmation of admission.</li>
        </ul>
      </div>
    </div>
  );

  return (
    <>
      {/* DOM order header → fees → tabs suits phones; on desktop the fee card is a sticky right column. */}
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-10 md:px-6 lg:grid-cols-[1fr_380px] lg:grid-rows-[auto_1fr] lg:py-14">
        <header className="flex min-w-0 flex-col gap-4 lg:col-start-1">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Courses", href: "/courses" },
              { label: course.name },
            ]}
          />
          <span className="type-overline text-accent-ink">
            {course.kind} · {course.duration_label}
          </span>
          <h1 className="type-display m-0">{course.name}</h1>
          <p className="type-body-lg text-ink-muted m-0 max-w-[620px]">
            {course.description}
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge tone={levelTone[course.level]}>{course.level}</Badge>
            <Badge tone="info">{course.category}</Badge>
            {course.tag && <Badge tone="accent">{course.tag}</Badge>}
          </div>
        </header>
        <Card className="flex flex-col gap-4 self-start overflow-hidden lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="bg-navy aspect-[16/9] overflow-hidden">
            {course.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- course images come from the API's media host
              <img
                src={course.image}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <CourseArt
                category={course.category}
                className="block size-full"
              />
            )}
          </div>
          <div className="flex flex-col gap-4 px-5 pb-5">
            <FeeBox fee={course} registrationFee={SITE.registrationFee} />
            {course.next_batch_start && (
              <p className="text-ink-muted m-0 text-sm">
                Next batch:{" "}
                <b className="text-ink">{course.next_batch_start}</b>
                {course.schedule && <> · {course.schedule}</>}
              </p>
            )}
            <ButtonLink href={enrollHref} variant="accent" size="lg" block>
              Enroll Now
            </ButtonLink>
            <p className="text-ink-muted m-0 text-center text-[13px]">
              Questions? Call{" "}
              <a
                href={`tel:+91${SITE.phones[0]}`}
                className="text-navy-ink font-semibold"
              >
                {SITE.phones[0]}
              </a>
            </p>
          </div>
        </Card>
        <div className="min-w-0 lg:col-start-1">
          <CourseTabs
            overview={overview}
            syllabus={<Syllabus groups={course.syllabus} />}
          />
        </div>
      </div>

      {more.length > 0 && (
        <section className="border-line bg-surface-raised border-t">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-12 md:px-6">
            <h2 className="type-h2 m-0">You might also consider</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((c) => (
                <CourseCard key={c.slug} course={c} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
