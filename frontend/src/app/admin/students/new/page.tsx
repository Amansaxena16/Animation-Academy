"use client";

import { ArrowLeft, Copy, UserCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import {
  emptyStudent,
  errorsFrom,
  StudentForm,
  type StudentErrors,
  type StudentValues,
} from "@/components/admin/StudentForm";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Select } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import { useAdmin, useAdminAction } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import { titleCase } from "@/lib/format";
import type { AdminCourse, AdminStudentCreated } from "@/types/admin";

export default function NewStudentPage() {
  const toast = useToast();
  const [values, setValues] = useState<StudentValues>(emptyStudent);
  const [course, setCourse] = useState("");
  const [errors, setErrors] = useState<StudentErrors>({});
  const [created, setCreated] = useState<AdminStudentCreated | null>(null);
  const { data: courses } = useAdmin<AdminCourse[]>("courses/", {
    status: "Published",
  });
  const create = useAdminAction<Record<string, unknown>, AdminStudentCreated>(
    "POST",
    () => "students/",
  );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const { status: _ignored, ...body } = values;
    void _ignored;
    try {
      setCreated(await create.mutateAsync({ ...body, course: course || null }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errors).length) {
        setErrors(errorsFrom(err.errors));
        toast({ title: "Check the highlighted fields", tone: "danger" });
      } else {
        toast({
          title: "Couldn't add the student",
          text: "Check your connection and try again.",
          tone: "danger",
        });
      }
    }
  };

  if (created) {
    const s = created.student;
    return (
      <Card
        pad
        className="mx-auto flex max-w-[620px] flex-col items-center gap-5 py-10 text-center"
      >
        <span className="bg-success-soft text-success-ink grid size-16 place-items-center rounded-full">
          <UserCheck className="size-8" aria-hidden />
        </span>
        <div>
          <h1 className="type-h1 m-0">{titleCase(s.name)} is added</h1>
          <p className="text-ink-muted mt-2 mb-0">
            Student ID <span className="type-mono text-ink">{s.code}</span>
            {s.enrollments[0] && (
              <> · enrolled in {s.enrollments[0].course.name}</>
            )}
          </p>
        </div>
        <div className="bg-accent-soft w-full rounded-md p-4 text-left">
          <b className="block">Temporary password — shown only once</b>
          <p className="text-ink-muted mt-1 mb-3 text-sm">
            Give it to the student with their login email ({s.email}). They can
            change it under My Profile.
          </p>
          <div className="flex items-center gap-2">
            <code className="type-mono bg-surface-raised border-line flex-1 rounded-md border px-3 py-2 text-base">
              {created.temporary_password}
            </code>
            <Button
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard
                  .writeText(created.temporary_password)
                  .catch(() => {});
                toast({ title: "Password copied" });
              }}
            >
              <Copy aria-hidden /> Copy
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <ButtonLink href={`/admin/students/${s.code}`}>
            Open Student
          </ButtonLink>
          <Button
            variant="secondary"
            onClick={() => {
              setCreated(null);
              setValues(emptyStudent());
              setCourse("");
            }}
          >
            Add Another
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/students"
          className="text-ink-muted hover:text-navy-ink inline-flex items-center gap-1.5 text-sm no-underline"
        >
          <ArrowLeft className="size-4" aria-hidden /> Students
        </Link>
        <PageHeader
          title="Add a student"
          text="For someone applying at the office. The record is active straight away, and a temporary password is created for their login."
        />
      </div>
      {Object.keys(errors).length > 0 && (
        <Alert tone="danger">
          Some fields need attention — see the messages below.
        </Alert>
      )}
      <StudentForm
        values={values}
        errors={errors}
        onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
        extra={
          <Field
            label="Enroll in a course"
            help="Optional. Added as Active (already confirmed)."
            error={errors.course}
          >
            {(p) => (
              <Select
                {...p}
                value={course}
                onChange={(e) => setCourse(e.target.value)}
              >
                <option value="">Not now</option>
                {courses?.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name} — {c.duration_label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        }
      />
      <div className="flex justify-end gap-3">
        <ButtonLink href="/admin/students" variant="secondary">
          Cancel
        </ButtonLink>
        <Button type="submit" size="lg" loading={create.isPending}>
          Add Student
        </Button>
      </div>
    </form>
  );
}
