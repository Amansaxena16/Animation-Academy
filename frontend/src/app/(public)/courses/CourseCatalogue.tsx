"use client";

import { Search, SearchX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { CourseCard } from "@/components/ui/CourseCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Form";
import { cn } from "@/lib/cn";
import type { Category, Course } from "@/types/course";

export interface CatalogueFilters {
  q: string;
  category: string;
  level: string;
  fee: string;
}

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

/** Monthly fee bands. The PDM counts at its ₹3,000 monthly fee. */
const FEES = [
  { key: "lt800", label: "Under ₹800 a month", test: (f: number) => f < 800 },
  {
    key: "800-1000",
    label: "₹800 – ₹1,000 a month",
    test: (f: number) => f >= 800 && f <= 1000,
  },
  {
    key: "gt1000",
    label: "Over ₹1,000 a month",
    test: (f: number) => f > 1000,
  },
];

const EMPTY: CatalogueFilters = { q: "", category: "", level: "", fee: "" };

function matches(course: Course, f: CatalogueFilters) {
  const q = f.q.trim().toLowerCase();
  if (
    q &&
    ![course.name, course.description, course.category, course.kind].some((t) =>
      t.toLowerCase().includes(q),
    )
  )
    return false;
  if (f.category && course.category !== f.category) return false;
  if (f.level && course.level !== f.level) return false;
  const band = FEES.find((b) => b.key === f.fee);
  if (band && !band.test(course.monthly_fee)) return false;
  return true;
}

export function CourseCatalogue({
  courses,
  categories,
  initial,
}: {
  courses: Course[];
  categories: Category[];
  initial: CatalogueFilters;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<CatalogueFilters>(initial);
  const shown = useMemo(
    () => courses.filter((c) => matches(c, filters)),
    [courses, filters],
  );
  const active = Object.values(filters).some(Boolean);

  // Filters live in the URL so a filtered list can be shared or bookmarked.
  const update = (patch: Partial<CatalogueFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    const params = new URLSearchParams(
      Object.entries(next).filter(([, v]) => v),
    );
    const query = params.toString();
    router.replace(query ? `/courses?${query}` : "/courses", { scroll: false });
  };

  const chip = (selected: boolean) =>
    cn(
      "inline-flex h-9 items-center gap-1.5 rounded-pill border px-3.5 text-[13px] font-semibold transition-colors",
      selected
        ? "border-navy bg-navy text-on-navy"
        : "border-line bg-surface-raised text-ink hover:border-line-strong",
    );

  return (
    <section className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-10 md:px-6 md:py-12">
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 md:grid-cols-[1fr_200px_220px]">
          <Input
            type="search"
            aria-label="Search courses"
            icon={<Search />}
            placeholder="Try “Tally” or “CorelDraw”"
            value={filters.q}
            onChange={(e) => update({ q: e.target.value })}
          />
          <Select
            aria-label="Level"
            value={filters.level}
            onChange={(e) => update({ level: e.target.value })}
          >
            <option value="">All levels</option>
            {LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </Select>
          <Select
            aria-label="Monthly fee"
            value={filters.fee}
            onChange={(e) => update({ fee: e.target.value })}
          >
            <option value="">Any fee</option>
            {FEES.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </Select>
        </div>
        <div
          role="group"
          aria-label="Category"
          className="flex flex-wrap gap-2"
        >
          <button
            type="button"
            aria-pressed={!filters.category}
            className={chip(!filters.category)}
            onClick={() => update({ category: "" })}
          >
            All
            <span className="opacity-70">{courses.length}</span>
          </button>
          {categories
            .filter((c) => c.count > 0)
            .map((c) => (
              <button
                key={c.value}
                type="button"
                aria-pressed={filters.category === c.value}
                className={chip(filters.category === c.value)}
                onClick={() =>
                  update({
                    category: filters.category === c.value ? "" : c.value,
                  })
                }
              >
                {c.label}
                <span className="opacity-70">{c.count}</span>
              </button>
            ))}
        </div>
      </div>

      <div
        className="text-ink-muted flex items-center justify-between gap-3 text-sm"
        aria-live="polite"
      >
        <span>
          Showing <b className="text-ink">{shown.length}</b> of {courses.length}{" "}
          courses
        </span>
        {active && (
          <Button variant="ghost" size="sm" onClick={() => update(EMPTY)}>
            Clear Filters
          </Button>
        )}
      </div>

      {shown.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<SearchX />}
          title="No course matches"
          text="Try a different word, or clear the filters to see every course. Our counsellor can also help you choose."
          action={<Button onClick={() => update(EMPTY)}>Clear Filters</Button>}
        />
      )}
    </section>
  );
}
