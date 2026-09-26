"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/Form";
import { courseTotal, inr } from "@/lib/format";

export const KINDS = [
  "Diploma",
  "Certificate",
  "PG Diploma",
  "Professional Diploma",
];
export const CATEGORIES = [
  "Programming",
  "Accounting",
  "Design",
  "Web Designing",
  "Computer Basics",
  "Multimedia",
];
export const LEVELS = ["Beginner", "Intermediate", "Advanced"];

/** A syllabus group as edited here: topics as one text block, one per line. */
export interface GroupDraft {
  title: string;
  duration: string;
  tools: string;
  topics: string;
}

export interface CourseValues {
  name: string;
  slug: string;
  kind: string;
  category: string;
  level: string;
  status: string;
  duration_label: string;
  months: string;
  monthly_fee: string;
  first_month_fee: string;
  description: string;
  tag: string;
  featured: boolean;
  schedule: string;
  next_batch_start: string;
  order: string;
  groups: GroupDraft[];
}

export type CourseErrors = Partial<
  Record<keyof CourseValues | "syllabus", string>
>;

export const emptyCourse = (): CourseValues => ({
  name: "",
  slug: "",
  kind: "Diploma",
  category: "Computer Basics",
  level: "Beginner",
  status: "Draft",
  duration_label: "6 Months",
  months: "6",
  monthly_fee: "",
  first_month_fee: "",
  description: "",
  tag: "",
  featured: false,
  schedule: "",
  next_batch_start: "",
  order: "10",
  groups: [{ title: "", duration: "", tools: "", topics: "" }],
});

/** The body the API expects. */
export function toPayload(v: CourseValues, creating: boolean) {
  return {
    name: v.name,
    ...(creating && v.slug.trim() ? { slug: v.slug.trim() } : {}),
    kind: v.kind,
    category: v.category,
    level: v.level,
    status: v.status,
    duration_label: v.duration_label,
    months: Number(v.months),
    monthly_fee: Number(v.monthly_fee),
    first_month_fee: v.first_month_fee.trim()
      ? Number(v.first_month_fee)
      : null,
    description: v.description,
    tag: v.tag,
    featured: v.featured,
    schedule: v.schedule,
    next_batch_start: v.next_batch_start,
    order: Number(v.order || 0),
    syllabus: v.groups.map((g) => ({
      title: g.title,
      duration: g.duration,
      tools: g.tools,
      items: g.topics.split("\n"),
    })),
  };
}

export function CourseForm({
  values,
  errors,
  onChange,
  creating,
}: {
  values: CourseValues;
  errors: CourseErrors;
  onChange: (patch: Partial<CourseValues>) => void;
  creating: boolean;
}) {
  const text =
    (field: keyof CourseValues) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      onChange({ [field]: e.target.value });
  const setGroup = (i: number, patch: Partial<GroupDraft>) =>
    onChange({
      groups: values.groups.map((g, j) => (j === i ? { ...g, ...patch } : g)),
    });

  const fee = {
    monthly_fee: Number(values.monthly_fee) || 0,
    months: Number(values.months) || 0,
    duration_label: values.duration_label,
    first_month_fee: values.first_month_fee.trim()
      ? Number(values.first_month_fee)
      : null,
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader title="Course" />
        <CardBody className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Name"
            required
            help="Exactly as the prospectus prints it."
            error={errors.name}
            className="sm:col-span-2"
          >
            {(p) => (
              <Input
                {...p}
                value={values.name}
                onChange={text("name")}
                placeholder="DCA — Accounting"
              />
            )}
          </Field>
          <Field
            label="Web address"
            help={
              creating
                ? "Leave empty to make one from the name."
                : "Fixed once created, so shared links keep working."
            }
            error={errors.slug}
          >
            {(p) => (
              <Input
                {...p}
                value={values.slug}
                onChange={text("slug")}
                disabled={!creating}
                placeholder="dca-accounting"
                className="font-mono"
              />
            )}
          </Field>
          <Field
            label="Status"
            help="Draft is hidden from the website."
            error={errors.status}
          >
            {(p) => (
              <Select {...p} value={values.status} onChange={text("status")}>
                <option>Published</option>
                <option>Draft</option>
              </Select>
            )}
          </Field>
          <Field label="Kind" error={errors.kind}>
            {(p) => (
              <Select {...p} value={values.kind} onChange={text("kind")}>
                {KINDS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Category" error={errors.category}>
            {(p) => (
              <Select
                {...p}
                value={values.category}
                onChange={text("category")}
              >
                {CATEGORIES.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Level" error={errors.level}>
            {(p) => (
              <Select {...p} value={values.level} onChange={text("level")}>
                {LEVELS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field
            label="Tag"
            help='Optional badge, e.g. "Most enrolled".'
            error={errors.tag}
          >
            {(p) => <Input {...p} value={values.tag} onChange={text("tag")} />}
          </Field>
          <Field
            label="Description"
            required
            help="One or two sentences for course cards."
            error={errors.description}
            className="sm:col-span-2"
          >
            {(p) => (
              <Textarea
                {...p}
                rows={2}
                className="min-h-0"
                value={values.description}
                onChange={text("description")}
              />
            )}
          </Field>
          <Checkbox
            label="Show on the home page (featured)"
            checked={values.featured}
            onChange={(e) => onChange({ featured: e.target.checked })}
            className="sm:col-span-2"
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Duration and fees" />
        <CardBody className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field
            label="Duration (as printed)"
            required
            error={errors.duration_label}
          >
            {(p) => (
              <Input
                {...p}
                value={values.duration_label}
                onChange={text("duration_label")}
                placeholder="6 Months"
              />
            )}
          </Field>
          <Field label="Months" required error={errors.months}>
            {(p) => (
              <Input
                {...p}
                type="number"
                min={1}
                value={values.months}
                onChange={text("months")}
              />
            )}
          </Field>
          <Field label="Monthly fee (₹)" required error={errors.monthly_fee}>
            {(p) => (
              <Input
                {...p}
                type="number"
                min={0}
                value={values.monthly_fee}
                onChange={text("monthly_fee")}
              />
            )}
          </Field>
          <Field
            label="First-month fee (₹)"
            help="Only if month one costs more."
            error={errors.first_month_fee}
          >
            {(p) => (
              <Input
                {...p}
                type="number"
                min={0}
                value={values.first_month_fee}
                onChange={text("first_month_fee")}
              />
            )}
          </Field>
          <p className="text-ink-muted m-0 text-sm sm:col-span-2 lg:col-span-4">
            Total over the course:{" "}
            <b className="text-ink">{inr(courseTotal(fee))}</b>, plus the
            one-time registration.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Next batch" />
        <CardBody className="grid gap-5 sm:grid-cols-3">
          <Field label="Timings" error={errors.schedule}>
            {(p) => (
              <Input
                {...p}
                value={values.schedule}
                onChange={text("schedule")}
                placeholder="Mon–Fri, 10–11 AM"
              />
            )}
          </Field>
          <Field label="Starts" error={errors.next_batch_start}>
            {(p) => (
              <Input
                {...p}
                value={values.next_batch_start}
                onChange={text("next_batch_start")}
                placeholder="6 Oct 2026"
              />
            )}
          </Field>
          <Field
            label="Order on the website"
            help="Lower comes first."
            error={errors.order}
          >
            {(p) => (
              <Input
                {...p}
                type="number"
                min={0}
                value={values.order}
                onChange={text("order")}
              />
            )}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Syllabus"
          actions={
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                onChange({
                  groups: [
                    ...values.groups,
                    { title: "", duration: "", tools: "", topics: "" },
                  ],
                })
              }
            >
              <Plus aria-hidden /> Add Semester
            </Button>
          }
        />
        <CardBody className="flex flex-col gap-5">
          <p className="text-ink-muted m-0 text-sm">
            One topic per line. Most courses need a single untitled group; use
            semesters (with a title, duration and tools) for courses like the
            Professional Diploma in Multimedia.
          </p>
          {errors.syllabus && (
            <p className="text-danger-ink m-0 text-sm">{errors.syllabus}</p>
          )}
          {values.groups.map((g, i) => (
            <div
              key={i}
              className="border-line flex flex-col gap-3 rounded-md border p-4"
            >
              {values.groups.length > 1 && (
                <div className="grid gap-3 sm:grid-cols-[1fr_140px_1fr_auto] sm:items-end">
                  <Field label={`Semester ${i + 1} title`}>
                    {(p) => (
                      <Input
                        {...p}
                        value={g.title}
                        onChange={(e) => setGroup(i, { title: e.target.value })}
                        placeholder="Sem-I — Graphic Designing"
                      />
                    )}
                  </Field>
                  <Field label="Duration">
                    {(p) => (
                      <Input
                        {...p}
                        value={g.duration}
                        onChange={(e) =>
                          setGroup(i, { duration: e.target.value })
                        }
                        placeholder="3 Months"
                      />
                    )}
                  </Field>
                  <Field label="Tools">
                    {(p) => (
                      <Input
                        {...p}
                        value={g.tools}
                        onChange={(e) => setGroup(i, { tools: e.target.value })}
                        placeholder="Photoshop, Illustrator"
                      />
                    )}
                  </Field>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove semester ${i + 1}`}
                    onClick={() =>
                      onChange({
                        groups: values.groups.filter((_, j) => j !== i),
                      })
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              )}
              <Field label="Topics" help="One per line.">
                {(p) => (
                  <Textarea
                    {...p}
                    rows={Math.min(
                      12,
                      Math.max(4, g.topics.split("\n").length + 1),
                    )}
                    value={g.topics}
                    onChange={(e) => setGroup(i, { topics: e.target.value })}
                    placeholder={
                      "Computer Fundamental\nWindows 7\nTally Prime with GST"
                    }
                  />
                )}
              </Field>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
