"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  CourseForm,
  emptyCourse,
  toPayload,
  type CourseErrors,
  type CourseValues,
} from "@/components/admin/CourseForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAdminAction } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import type { AdminCourse } from "@/types/admin";

export default function NewCoursePage() {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState<CourseValues>(emptyCourse);
  const [errors, setErrors] = useState<CourseErrors>({});
  const create = useAdminAction<CourseValues, AdminCourse>(
    "POST",
    () => "courses/",
    (v) => toPayload(v, true),
  );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      const course = await create.mutateAsync(values);
      toast({
        title: "Course added",
        text:
          course.status === "Draft"
            ? "Saved as a draft — publish it when ready."
            : "It's on the website now.",
      });
      router.push(`/admin/courses/${course.slug}`);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errors).length) {
        setErrors(
          Object.fromEntries(
            Object.entries(err.errors).map(([k, v]) => [k, v[0]]),
          ),
        );
        toast({ title: "Check the highlighted fields", tone: "danger" });
      } else toast({ title: "Couldn't add the course", tone: "danger" });
    }
  };

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/courses"
          className="text-ink-muted hover:text-navy-ink inline-flex items-center gap-1.5 text-sm no-underline"
        >
          <ArrowLeft className="size-4" aria-hidden /> Courses
        </Link>
        <PageHeader
          title="Add a course"
          text="Save as Draft to prepare it before it shows on the website."
        />
      </div>
      <CourseForm
        values={values}
        errors={errors}
        onChange={(p) => setValues((v) => ({ ...v, ...p }))}
        creating
      />
      <div className="flex justify-end gap-3">
        <ButtonLink href="/admin/courses" variant="secondary">
          Cancel
        </ButtonLink>
        <Button type="submit" size="lg" loading={create.isPending}>
          Add Course
        </Button>
      </div>
    </form>
  );
}
