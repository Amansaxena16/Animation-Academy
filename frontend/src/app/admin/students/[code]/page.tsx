"use client";

import {
  ArrowLeft,
  Copy,
  KeyRound,
  Plus,
  UserCheck,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import {
  errorsFrom,
  StudentForm,
  type StudentErrors,
  type StudentValues,
} from "@/components/admin/StudentForm";
import { type Qualification } from "@/components/student/QualificationsTable";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/EmptyState";
import { Field, Select } from "@/components/ui/Form";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useAdmin, useAdminAction } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import { formatDateLong, formatDateShort, titleCase } from "@/lib/format";
import { enrollmentTone, studentTone } from "@/lib/status";
import type { AdminCourse, AdminStudent } from "@/types/admin";

export default function StudentPage() {
  const { code } = useParams<{ code: string }>();
  const { data, isPending, error } = useAdmin<AdminStudent>(
    `students/${code}/`,
  );

  if (error) {
    return (
      <Alert
        tone="danger"
        title={
          error instanceof ApiError && error.status === 404
            ? "Student not found"
            : "Didn't load"
        }
      >
        <Link href="/admin/students">Back to Students</Link>
      </Alert>
    );
  }
  if (isPending || !data) return <Skeleton className="h-96 rounded-lg" />;
  // Keyed on the saved record, so the form resets after each save.
  return <StudentRecord key={`${data.code}-${data.status}`} student={data} />;
}

const valuesFrom = (s: AdminStudent): StudentValues => ({
  email: s.email ?? "",
  name: s.name,
  father_name: s.father_name,
  dob: s.dob,
  gender: s.gender ?? "",
  mobile: s.mobile ?? "",
  phone: s.phone ?? "",
  address: s.address ?? "",
  pincode: s.pincode ?? "",
  city: s.city ?? "",
  state: s.state ?? "",
  country: s.country ?? "",
  employment: s.employment ?? "Student",
  qualifications: s.qualifications as Qualification[],
  status: s.status ?? "Active",
});

function StudentRecord({ student }: { student: AdminStudent }) {
  const toast = useToast();
  const name = titleCase(student.name);
  const [values, setValues] = useState(() => valuesFrom(student));
  const [errors, setErrors] = useState<StudentErrors>({});
  const [confirm, setConfirm] = useState<"reset" | "deactivate" | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [course, setCourse] = useState("");
  const [courseStatus, setCourseStatus] = useState("Active");

  const save = useAdminAction<StudentValues>(
    "PATCH",
    () => `students/${student.code}/`,
  );
  const reset = useAdminAction<void, { temporary_password: string }>(
    "POST",
    () => `students/${student.code}/reset-password/`,
    () => undefined,
  );
  const setStatus = useAdminAction<string>(
    "PATCH",
    () => `students/${student.code}/`,
    (status) => ({ status }),
  );
  const enroll = useAdminAction<{ course: string; status: string }>(
    "POST",
    () => "enrollments/",
    (b) => ({ ...b, student: student.code }),
  );
  const { data: courses } = useAdmin<AdminCourse[]>("courses/", {
    status: "Published",
  });

  const failed = (err: unknown, title: string) =>
    toast({
      title,
      text:
        err instanceof ApiError
          ? err.detail
          : "Check your connection and try again.",
      tone: "danger",
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      await save.mutateAsync(values);
      toast({
        title: "Student saved",
        text: `${titleCase(values.name)}'s record is up to date.`,
      });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errors).length) {
        setErrors(errorsFrom(err.errors));
        toast({ title: "Check the highlighted fields", tone: "danger" });
      } else failed(err, "Couldn't save");
    }
  };

  const inactive = student.status === "Inactive";

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/students"
        className="text-ink-muted hover:text-navy-ink inline-flex items-center gap-1.5 text-sm no-underline"
      >
        <ArrowLeft className="size-4" aria-hidden /> Students
      </Link>

      <Card pad className="flex flex-wrap items-center gap-5">
        <Avatar name={name} src={student.photo} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="type-h1 m-0">{name}</h1>
          <p className="text-ink-muted m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="type-mono text-ink">{student.code}</span>
            <Badge tone={studentTone[student.status ?? "Active"]} dot>
              {student.status}
            </Badge>
            <span>Joined {formatDateLong(student.joined_at)}</span>
            {student.mobile && (
              <a href={`tel:+91${student.mobile}`}>{student.mobile}</a>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setConfirm("reset")}>
            <KeyRound aria-hidden /> Reset Password
          </Button>
          {inactive ? (
            <Button
              variant="secondary"
              loading={setStatus.isPending}
              onClick={async () => {
                try {
                  await setStatus.mutateAsync("Active");
                  toast({
                    title: "Student reactivated",
                    text: `${name} can log in again.`,
                  });
                } catch (err) {
                  failed(err, "Couldn't reactivate");
                }
              }}
            >
              <UserCheck aria-hidden /> Reactivate
            </Button>
          ) : (
            <Button variant="danger" onClick={() => setConfirm("deactivate")}>
              <UserX aria-hidden /> Deactivate
            </Button>
          )}
        </div>
      </Card>

      {password && (
        <Alert tone="warning" title="New temporary password — shown only once">
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="type-mono bg-surface-raised border-line rounded-md border px-3 py-1.5 text-base">
              {password}
            </code>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(password).catch(() => {});
                toast({ title: "Password copied" });
              }}
            >
              <Copy aria-hidden /> Copy
            </Button>
            <span className="text-sm">
              They&apos;ve been signed out everywhere; they log in with this and
              can change it.
            </span>
          </div>
        </Alert>
      )}

      <Card>
        <CardHeader
          title="Courses"
          actions={
            <Link
              href={`/admin/enrollments?q=${student.code}`}
              className="text-navy-ink text-sm font-semibold"
            >
              Manage in Enrollments
            </Link>
          }
        />
        {student.enrollments.length > 0 && (
          <ul className="m-0 flex list-none flex-col p-0">
            {student.enrollments.map((e) => (
              <li
                key={e.code}
                className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3"
              >
                <div>
                  <b className="block text-sm">{e.course.name}</b>
                  <small className="text-ink-muted">
                    <span className="type-mono">{e.code}</span> · applied{" "}
                    {formatDateShort(e.applied_at)}
                    {e.certificate_code && (
                      <>
                        {" "}
                        · certificate{" "}
                        <span className="type-mono">{e.certificate_code}</span>
                      </>
                    )}
                  </small>
                </div>
                <Badge tone={enrollmentTone[e.status]} dot>
                  {e.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <CardBody className="grid items-end gap-3 sm:grid-cols-[1fr_210px_auto]">
          <Field label="Add to a course">
            {(p) => (
              <Select
                {...p}
                value={course}
                onChange={(e) => setCourse(e.target.value)}
              >
                <option value="">Choose a course</option>
                {courses?.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="As">
            {(p) => (
              <Select
                {...p}
                value={courseStatus}
                onChange={(e) => setCourseStatus(e.target.value)}
              >
                <option value="Active">Active (confirmed)</option>
                <option value="Pending">Pending</option>
              </Select>
            )}
          </Field>
          <Button
            variant="secondary"
            disabled={!course}
            loading={enroll.isPending}
            onClick={async () => {
              try {
                await enroll.mutateAsync({ course, status: courseStatus });
                toast({
                  title: "Enrolled",
                  text: `${name} added to ${courses?.find((c) => c.slug === course)?.name}.`,
                });
                setCourse("");
              } catch (err) {
                failed(err, "Couldn't enroll");
              }
            }}
          >
            <Plus aria-hidden /> Add
          </Button>
        </CardBody>
      </Card>

      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <StudentForm
          values={values}
          errors={errors}
          onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
          showStatus
        />
        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={save.isPending}>
            Save Changes
          </Button>
        </div>
      </form>

      <ConfirmModal
        open={confirm === "reset"}
        tone="primary"
        icon={<KeyRound />}
        title={`Reset ${name}'s password?`}
        text="A new temporary password is created and shown once. They're signed out on every device until they log in with it."
        confirmLabel="Reset Password"
        loading={reset.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          try {
            const res = await reset.mutateAsync();
            setPassword(res.temporary_password);
            setConfirm(null);
          } catch (err) {
            setConfirm(null);
            failed(err, "Couldn't reset the password");
          }
        }}
      />
      <ConfirmModal
        open={confirm === "deactivate"}
        title={`Deactivate ${name}?`}
        text="Their login is blocked and they're signed out. Their enrollments and certificates are kept, and certificates still verify. You can reactivate them later."
        confirmLabel="Deactivate Student"
        loading={setStatus.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          try {
            await setStatus.mutateAsync("Inactive");
            setConfirm(null);
            toast({ title: "Student deactivated", text: name, tone: "info" });
          } catch (err) {
            setConfirm(null);
            failed(err, "Couldn't deactivate");
          }
        }}
      />
    </div>
  );
}
