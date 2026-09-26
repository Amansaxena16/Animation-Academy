"use client";

import { Award, Ban, Check, Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Form";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { downloadAdminCertificate, useAdminAction } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import { titleCase } from "@/lib/format";
import type { AdminEnrollment } from "@/types/admin";

type Pending = "reject" | "complete" | null;

/** The office's actions on one enrollment, by status:
 *  Pending → Approve / Reject · Active → Complete & issue / Cancel · Completed → PDF. */
export function EnrollmentActions({
  enrollment,
  compact,
}: {
  enrollment: AdminEnrollment;
  compact?: boolean;
}) {
  const toast = useToast();
  const [confirm, setConfirm] = useState<Pending>(null);
  const [reason, setReason] = useState("");
  const [downloading, setDownloading] = useState(false);
  const name = titleCase(enrollment.student.name);
  const course = enrollment.course.name;

  const approve = useAdminAction<void>(
    "POST",
    () => `enrollments/${enrollment.code}/approve/`,
    () => undefined,
  );
  const reject = useAdminAction<string>(
    "POST",
    () => `enrollments/${enrollment.code}/reject/`,
    (r) => ({ reason: r }),
  );
  const complete = useAdminAction<void>(
    "POST",
    () => `enrollments/${enrollment.code}/complete/`,
    () => undefined,
  );

  const run = async (
    action: () => Promise<unknown>,
    title: string,
    text: string,
  ) => {
    try {
      await action();
      toast({ title, text });
      setConfirm(null);
      setReason("");
    } catch (err) {
      setConfirm(null);
      toast({
        title: "That didn't work",
        text:
          err instanceof ApiError
            ? err.detail
            : "Check your connection and try again.",
        tone: "danger",
      });
    }
  };

  const size = compact ? "sm" : "md";
  const isPending = enrollment.status === "Pending";

  return (
    <>
      {isPending && (
        <>
          <Button
            size={size}
            loading={approve.isPending}
            onClick={() =>
              run(
                () => approve.mutateAsync(),
                "Admission confirmed",
                `${name} is now active in ${course}.`,
              )
            }
          >
            <Check aria-hidden /> Approve
          </Button>
          <Button
            size={size}
            variant="secondary"
            onClick={() => setConfirm("reject")}
          >
            <Ban aria-hidden /> Reject
          </Button>
        </>
      )}
      {enrollment.status === "Active" && (
        <>
          <Button
            size={size}
            variant="navy"
            onClick={() => setConfirm("complete")}
          >
            <Award aria-hidden /> Complete
          </Button>
          <Button
            size={size}
            variant="ghost"
            onClick={() => setConfirm("reject")}
          >
            Cancel
          </Button>
        </>
      )}
      {enrollment.certificate_code && (
        <Button
          size={size}
          variant="secondary"
          loading={downloading}
          onClick={async () => {
            setDownloading(true);
            try {
              await downloadAdminCertificate(enrollment.certificate_code!);
            } catch {
              toast({ title: "Download failed", tone: "danger" });
            } finally {
              setDownloading(false);
            }
          }}
        >
          <Download aria-hidden /> PDF
        </Button>
      )}

      <ConfirmModal
        open={confirm === "reject"}
        title={
          isPending
            ? `Reject ${name}'s application?`
            : `Cancel ${name}'s enrollment?`
        }
        text={
          <div className="flex flex-col gap-3">
            <span>
              {course} ({enrollment.code}) will be marked cancelled.{" "}
              {isPending ? "Let them know by phone." : ""}
            </span>
            <Field
              label="Reason (optional)"
              help="Kept on the record, e.g. “Batch full”."
            >
              {(p) => (
                <Textarea
                  {...p}
                  rows={2}
                  className="min-h-0"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              )}
            </Field>
          </div>
        }
        confirmLabel={isPending ? "Reject Admission" : "Cancel Enrollment"}
        loading={reject.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() =>
          run(
            () => reject.mutateAsync(reason),
            isPending ? "Admission rejected" : "Enrollment cancelled",
            `${name} · ${course}`,
          )
        }
      />
      <ConfirmModal
        open={confirm === "complete"}
        tone="primary"
        icon={<Award />}
        title={`Mark ${course} as completed?`}
        text={`${name} will be marked complete and a certificate issued in their name. They can download it from their dashboard, and anyone can verify it.`}
        confirmLabel="Complete & Issue"
        loading={complete.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() =>
          run(
            () => complete.mutateAsync(),
            "Course completed",
            `Certificate issued to ${name}.`,
          )
        }
      />
    </>
  );
}
