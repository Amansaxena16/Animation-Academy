"use client";

import { ArrowRight, BookOpen, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FeeBox } from "@/components/ui/CourseCard";
import { Skeleton } from "@/components/ui/EmptyState";
import { Field, Select } from "@/components/ui/Form";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { feeLong, inr, titleCase } from "@/lib/format";
import { useApply } from "@/lib/student";
import type { Course } from "@/types/course";

import { AdmissionForm } from "./AdmissionForm";

interface Props {
  courses: Course[];
  initialCourse: string;
  registrationFee: number;
}

/** /admission for someone who is already signed in: a student applies for another course in
 *  one step; staff are pointed to the console. Falls back to the full form if the session
 *  turns out to have ended. */
export function ApplyAsStudent(props: Props) {
  const { status, user, ensureSession } = useAuth();

  useEffect(() => {
    void ensureSession();
  }, [ensureSession]);

  if (status === "idle" || status === "loading")
    return <Skeleton className="h-72 rounded-lg" />;
  if (!user) return <AdmissionForm {...props} />;
  if (user.role === "admin") {
    return (
      <Alert title="You're signed in as institute staff">
        Students apply here themselves. To add a student yourself, use the admin
        console.
      </Alert>
    );
  }
  return <ApplyCard {...props} name={titleCase(user.name)} />;
}

function ApplyCard({
  courses,
  initialCourse,
  registrationFee,
  name,
}: Props & { name: string }) {
  const router = useRouter();
  const toast = useToast();
  const apply = useApply();
  const [slug, setSlug] = useState(initialCourse);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const course = courses.find((c) => c.slug === slug);

  const confirm = async () => {
    if (!course) return;
    setError(null);
    try {
      await apply.mutateAsync(course.slug);
      toast({
        title: "Admission requested",
        text: `${course.name} is awaiting confirmation.`,
      });
      router.push("/student/courses");
    } catch (err) {
      setConfirming(false);
      if (err instanceof ApiError && err.status === 409) {
        toast({
          title: "Already applied",
          text: "Find it under My Courses.",
          tone: "info",
        });
        router.push("/student/courses");
      } else if (err instanceof ApiError) {
        setError(err.field("course") ?? err.detail);
      } else {
        setError(
          "Couldn't reach the server. Check your connection and try again.",
        );
      }
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <Card pad className="flex flex-col gap-5">
        <div>
          <h2 className="type-h2 m-0">Apply for another course</h2>
          <p className="text-ink-muted mt-1 mb-0">
            You&apos;re signed in as <b className="text-ink">{name}</b>, so
            there&apos;s no form to fill in again — choose the course and
            confirm.
          </p>
        </div>
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label="Course" required>
          {(p) => (
            <Select
              {...p}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            >
              <option value="">Choose a course</option>
              {courses.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} — {c.duration_label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="accent"
            size="lg"
            disabled={!course}
            onClick={() => setConfirming(true)}
          >
            Apply Now <ArrowRight aria-hidden />
          </Button>
          <ButtonLink href="/student/courses" variant="secondary" size="lg">
            <BookOpen aria-hidden /> My Courses
          </ButtonLink>
        </div>
      </Card>

      <aside className="flex flex-col gap-4 self-start">
        {course ? (
          <Card pad className="flex flex-col gap-4">
            <span className="type-overline text-accent-ink">
              You&apos;re applying for
            </span>
            <div>
              <b className="type-h3 block">{course.name}</b>
              <span className="text-ink-muted text-sm">
                {course.kind} · {course.duration_label}
                {course.next_batch_start && (
                  <> · next batch {course.next_batch_start}</>
                )}
              </span>
            </div>
            <FeeBox fee={course} registrationFee={registrationFee} />
          </Card>
        ) : (
          <Card pad className="text-ink-muted text-sm">
            Choose a course to see its fees and next batch.
          </Card>
        )}
      </aside>

      <ConfirmModal
        open={confirming && !!course}
        tone="accent"
        icon={<ShieldCheck />}
        title={course ? `Apply for ${course.name}?` : ""}
        text={
          course && (
            <>
              {feeLong(course)}, plus the one-time {inr(registrationFee)}{" "}
              registration if you haven&apos;t paid it yet.
              {course.next_batch_start && (
                <> The next batch starts {course.next_batch_start}.</>
              )}{" "}
              The office confirms your seat within one working day.{" "}
              <b className="text-ink">
                No refund is allowed after confirmation of admission.
              </b>
            </>
          )
        }
        confirmLabel="Confirm Admission"
        loading={apply.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={confirm}
      />
    </div>
  );
}
