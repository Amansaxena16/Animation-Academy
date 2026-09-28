/* eslint-disable @next/next/no-img-element -- course images come from the API's media host */
"use client";

import { ExternalLink, ImagePlus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import {
  CourseForm,
  toPayload,
  type CourseErrors,
  type CourseValues,
} from "@/components/admin/CourseForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { CourseArt } from "@/components/ui/CourseArt";
import { Skeleton } from "@/components/ui/EmptyState";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useAdmin, useAdminAction } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import type { AdminCourse } from "@/types/admin";
import type { CourseCategory } from "@/types/course";

const valuesFrom = (c: AdminCourse): CourseValues => ({
  name: c.name,
  slug: c.slug ?? "",
  kind: c.kind,
  category: c.category,
  level: c.level ?? "Beginner",
  status: c.status ?? "Draft",
  duration_label: c.duration_label,
  months: String(c.months),
  monthly_fee: String(c.monthly_fee),
  first_month_fee: c.first_month_fee == null ? "" : String(c.first_month_fee),
  description: c.description,
  tag: c.tag ?? "",
  featured: c.featured ?? false,
  schedule: c.schedule ?? "",
  next_batch_start: c.next_batch_start ?? "",
  order: String(c.order ?? 0),
  groups: c.syllabus.map((g) => ({
    title: g.title ?? "",
    duration: g.duration ?? "",
    tools: g.tools ?? "",
    topics: g.items.join("\n"),
  })),
});

export default function EditCoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isPending, error } = useAdmin<AdminCourse>(`courses/${slug}/`);
  if (error)
    return (
      <Alert tone="danger" title="Course not found">
        <Link href="/admin/courses">Back to Courses</Link>
      </Alert>
    );
  if (isPending || !data) return <Skeleton className="h-96 rounded-lg" />;
  return <EditCourse key={data.updated_at} course={data} />;
}

function EditCourse({ course }: { course: AdminCourse }) {
  const router = useRouter();
  const toast = useToast();
  const slug = course.slug!;
  const [values, setValues] = useState(() => valuesFrom(course));
  const [errors, setErrors] = useState<CourseErrors>({});
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const save = useAdminAction<CourseValues, AdminCourse>(
    "PATCH",
    () => `courses/${slug}/`,
    (v) => toPayload(v, false),
  );
  const remove = useAdminAction<void>("DELETE", () => `courses/${slug}/`);
  const image = useAdminAction<FormData | { image: null }, AdminCourse>(
    "POST",
    () => `courses/${slug}/image/`,
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      await save.mutateAsync(values);
      toast({
        title: "Course saved",
        text: "The website shows the change now.",
      });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errors).length) {
        setErrors(
          Object.fromEntries(
            Object.entries(err.errors).map(([k, v]) => [k, v[0]]),
          ),
        );
        toast({ title: "Check the highlighted fields", tone: "danger" });
      } else toast({ title: "Couldn't save", tone: "danger" });
    }
  };

  const upload = async (file: File | null) => {
    setUploading(true);
    try {
      if (file) {
        const form = new FormData();
        form.append("image", file);
        await image.mutateAsync(form);
      } else {
        await image.mutateAsync({ image: null });
      }
      toast({ title: file ? "Image updated" : "Image removed" });
    } catch (err) {
      toast({
        title: "Upload failed",
        text:
          err instanceof ApiError
            ? (err.field("image") ?? err.detail)
            : undefined,
        tone: "danger",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <PageHeader
          back={{ href: "/admin/courses", label: "Courses" }}
          title={course.name}
          text={`${course.enrollment_count} enrollment${course.enrollment_count === 1 ? "" : "s"} · ${course.status}`}
          actions={
            course.status === "Published" && (
              <ButtonLink
                href={`/courses#course-${slug}`}
                variant="secondary"
                target="_blank"
              >
                <ExternalLink aria-hidden /> View on Website
              </ButtonLink>
            )
          }
        />
      </div>

      <Card>
        <CardHeader title="Image" />
        <CardBody className="flex flex-wrap items-center gap-5">
          <div className="bg-navy aspect-[16/10] w-56 overflow-hidden rounded-md">
            {course.image ? (
              <img
                src={course.image}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <CourseArt
                category={course.category as CourseCategory}
                className="block size-full"
              />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-ink-muted m-0 max-w-sm text-sm">
              A real photo of the lab or student work. JPEG or PNG up to 5 MB;
              it&apos;s resized automatically. Without one, the artwork shown
              here is used.
            </p>
            <div className="flex gap-2">
              <label className="border-line-strong bg-surface-raised text-ink hover:border-ink inline-flex h-[34px] cursor-pointer items-center gap-2 rounded-md border px-3 text-[13px] font-semibold">
                <ImagePlus className="size-[18px]" aria-hidden />
                {uploading ? "Uploading…" : course.image ? "Replace" : "Upload"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) void upload(file);
                  }}
                />
              </label>
              {course.image && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => upload(null)}
                  disabled={uploading}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <CourseForm
          values={values}
          errors={errors}
          onChange={(p) => setValues((v) => ({ ...v, ...p }))}
          creating={false}
        />
        <div className="flex flex-wrap justify-between gap-3">
          <Button variant="danger" onClick={() => setDeleting(true)}>
            <Trash2 aria-hidden /> Delete Course
          </Button>
          <Button type="submit" size="lg" loading={save.isPending}>
            Save Changes
          </Button>
        </div>
      </form>

      <ConfirmModal
        open={deleting}
        title={`Delete ${course.name}?`}
        text={
          course.enrollment_count
            ? "Students have applied for this course, so it can't be deleted. Set it to Draft to hide it from the website instead."
            : "It's removed from the website and the admin permanently."
        }
        confirmLabel="Delete Course"
        loading={remove.isPending}
        onCancel={() => setDeleting(false)}
        onConfirm={async () => {
          try {
            await remove.mutateAsync();
            toast({ title: "Course deleted", tone: "info" });
            router.push("/admin/courses");
          } catch (err) {
            setDeleting(false);
            toast({
              title: "Not deleted",
              text: err instanceof ApiError ? err.detail : undefined,
              tone: "danger",
            });
          }
        }}
      />
    </div>
  );
}
