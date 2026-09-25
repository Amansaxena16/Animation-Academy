"use client";

import { ArrowLeft, ArrowRight, CircleCheck, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FeeBox } from "@/components/ui/CourseCard";
import {
  Checkbox,
  Field,
  Input,
  PhotoUpload,
  Select,
  Textarea,
} from "@/components/ui/Form";
import { Stepper } from "@/components/ui/Stepper";
import { api, ApiError, type Schemas } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { inr, todayISO } from "@/lib/format";
import type { Course } from "@/types/course";

import {
  API_STEPS,
  checkStep,
  clearDraft,
  EMPLOYMENT,
  emptyValues,
  FIELD_STEP,
  GENDERS,
  loadDraft,
  saveDraft,
  stepData,
  STEPS,
  type Errors,
  type Values,
} from "./admission";

type Result = Schemas["AdmissionResult"];

const firstError = (errors: Errors) =>
  Object.keys(errors).find((k) => errors[k as keyof Errors]);

export function AdmissionForm({
  courses,
  initialCourse,
  registrationFee,
}: {
  courses: Course[];
  initialCourse: string;
  registrationFee: number;
}) {
  const { startSession } = useAuth();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(() =>
    emptyValues(initialCourse),
  );
  const [photo, setPhoto] = useState<File | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const top = useRef<HTMLDivElement>(null);

  // Restore a draft from this tab (browser storage is an external system; runs once).
  useEffect(() => {
    const draft = loadDraft();
    if (!draft) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from sessionStorage
    setValues((v) => ({
      ...v,
      ...draft,
      password: "",
      confirm: "",
      course: initialCourse || draft.course || "",
    }));
  }, [initialCourse]);

  useEffect(() => {
    if (!result) saveDraft(values);
  }, [values, result]);

  // Bring the success card into view once it has replaced the form.
  useEffect(() => {
    if (result)
      top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  const course = courses.find((c) => c.slug === values.course);

  const set = <K extends keyof Values>(field: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };
  const text =
    (field: keyof Values) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      set(field, e.target.value as never);

  const setQual = (
    row: number,
    key: "year" | "board" | "subject" | "percentage",
    value: string,
  ) => {
    setValues((v) => ({
      ...v,
      qualifications: v.qualifications.map((q, i) =>
        i === row ? { ...q, [key]: value } : q,
      ),
    }));
    if (errors.qualifications)
      setErrors((e) => ({ ...e, qualifications: undefined }));
  };

  const scrollTop = () =>
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const apiErrors = (err: unknown): Errors | null => {
    if (!(err instanceof ApiError)) {
      setFailure(
        "Couldn't reach the server. Check your connection and try again.",
      );
      return null;
    }
    if (err.status === 429) {
      setFailure(
        "Too many attempts from this connection. Please wait a little, or call the institute.",
      );
      return null;
    }
    if (err.status === 403) {
      setFailure(err.detail);
      return null;
    }
    const mapped = Object.fromEntries(
      Object.entries(err.errors).map(([k, v]) => [k, v[0]]),
    ) as Errors;
    if (!firstError(mapped)) setFailure(err.detail);
    return mapped;
  };

  const next = async () => {
    setFailure(null);
    const local = checkStep(step, values);
    if (firstError(local)) return setErrors(local);

    setBusy(true);
    try {
      await api("/admissions/validate/", {
        method: "POST",
        auth: false,
        body: { step: API_STEPS[step], data: stepData(step, values) },
      });
      setErrors({});
      setStep((s) => s + 1);
      scrollTop();
    } catch (err) {
      const mapped = apiErrors(err);
      if (mapped) setErrors(mapped);
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setFailure(null);
    const local = checkStep(3, values);
    if (firstError(local)) return setErrors(local);

    const form = new FormData();
    for (const [key, value] of Object.entries(values)) {
      if (key === "confirm") continue;
      if (key === "qualifications") form.append(key, JSON.stringify(value));
      else form.append(key, String(value));
    }
    if (photo) form.append("photo", photo);

    setBusy(true);
    try {
      const res = await api<Result>("/admissions/", {
        method: "POST",
        auth: false,
        body: form,
      });
      startSession({ access: res.access, user: res.user });
      clearDraft();
      setResult(res);
    } catch (err) {
      const mapped = apiErrors(err);
      if (mapped) {
        setErrors(mapped);
        const field = firstError(mapped);
        if (field && FIELD_STEP[field] !== undefined)
          setStep(FIELD_STEP[field]);
        scrollTop();
      }
    } finally {
      setBusy(false);
    }
  };

  if (result)
    return (
      <div ref={top} className="scroll-mt-24">
        <Success result={result} registrationFee={registrationFee} />
      </div>
    );

  return (
    <div ref={top} className="grid scroll-mt-24 gap-8 lg:grid-cols-[1fr_340px]">
      <Card pad className="flex flex-col gap-8">
        <Stepper steps={[...STEPS]} current={step} />
        {failure && <Alert tone="danger">{failure}</Alert>}

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 3) void next();
            else void submit();
          }}
          className="flex flex-col gap-6"
        >
          {step === 0 && (
            <section className="flex flex-col gap-5">
              <h2 className="type-h2 m-0">Create your login</h2>
              <p className="text-ink-muted -mt-4 mb-0 text-sm">
                You&apos;ll use this to see your admission status and download
                certificates.
              </p>
              <Field label="Email" required error={errors.email}>
                {(p) => (
                  <Input
                    {...p}
                    type="email"
                    autoComplete="email"
                    value={values.email}
                    onChange={text("email")}
                    placeholder="name@example.com"
                  />
                )}
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Password"
                  required
                  help="At least 8 characters."
                  error={errors.password}
                >
                  {(p) => (
                    <div className="relative">
                      <Input
                        {...p}
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={values.password}
                        onChange={text("password")}
                        className="pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="text-ink-muted hover:text-ink absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-sm"
                      >
                        {showPassword ? (
                          <EyeOff className="size-[18px]" />
                        ) : (
                          <Eye className="size-[18px]" />
                        )}
                      </button>
                    </div>
                  )}
                </Field>
                <Field label="Confirm password" required error={errors.confirm}>
                  {(p) => (
                    <Input
                      {...p}
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={values.confirm}
                      onChange={text("confirm")}
                    />
                  )}
                </Field>
              </div>
              <p className="text-ink-muted m-0 text-sm">
                Already applied before?{" "}
                <Link href="/login" className="text-navy-ink font-semibold">
                  Log in
                </Link>{" "}
                and apply for another course from your dashboard.
              </p>
            </section>
          )}

          {step === 1 && (
            <section className="flex flex-col gap-5">
              <h2 className="type-h2 m-0">Personal details</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Name (in capitals)"
                  required
                  help="As it should appear on your certificate."
                  error={errors.name}
                  className="sm:col-span-2"
                >
                  {(p) => (
                    <Input
                      {...p}
                      autoComplete="name"
                      value={values.name}
                      onChange={(e) =>
                        set("name", e.target.value.toUpperCase())
                      }
                      placeholder="e.g. NISHA BHATT"
                    />
                  )}
                </Field>
                <Field
                  label="Father's name"
                  required
                  error={errors.father_name}
                >
                  {(p) => (
                    <Input
                      {...p}
                      value={values.father_name}
                      onChange={(e) =>
                        set("father_name", e.target.value.toUpperCase())
                      }
                    />
                  )}
                </Field>
                <Field label="Date of birth" required error={errors.dob}>
                  {(p) => (
                    <Input
                      {...p}
                      type="date"
                      max={todayISO()}
                      value={values.dob}
                      onChange={text("dob")}
                    />
                  )}
                </Field>
                <Field label="Mobile" required error={errors.mobile}>
                  {(p) => (
                    <Input
                      {...p}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={values.mobile}
                      onChange={text("mobile")}
                      placeholder="98110 45236"
                    />
                  )}
                </Field>
                <Field
                  label="Phone"
                  help="Home or office landline, if any."
                  error={errors.phone}
                >
                  {(p) => (
                    <Input
                      {...p}
                      type="tel"
                      inputMode="tel"
                      value={values.phone}
                      onChange={text("phone")}
                    />
                  )}
                </Field>
                <Field label="Gender" error={errors.gender}>
                  {(p) => (
                    <Select
                      {...p}
                      value={values.gender}
                      onChange={text("gender")}
                    >
                      <option value="">Prefer not to say</option>
                      {GENDERS.map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field
                  label="Address"
                  required
                  error={errors.address}
                  className="sm:col-span-2"
                >
                  {(p) => (
                    <Textarea
                      {...p}
                      rows={2}
                      autoComplete="street-address"
                      value={values.address}
                      onChange={text("address")}
                      placeholder="House number, street and area"
                      className="min-h-0"
                    />
                  )}
                </Field>
                <Field label="Pincode" required error={errors.pincode}>
                  {(p) => (
                    <Input
                      {...p}
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={6}
                      value={values.pincode}
                      onChange={text("pincode")}
                      placeholder="208012"
                    />
                  )}
                </Field>
                <Field label="City" error={errors.city}>
                  {(p) => (
                    <Input
                      {...p}
                      autoComplete="address-level2"
                      value={values.city}
                      onChange={text("city")}
                    />
                  )}
                </Field>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-ink text-sm font-semibold">Photo</span>
                <PhotoUpload
                  value={photo}
                  onChange={setPhoto}
                  error={errors.photo}
                />
                <span className="text-ink-muted text-[13px]">
                  Optional now — you can also bring one to the office.
                </span>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="flex flex-col gap-4">
              <h2 className="type-h2 m-0">Educational qualification</h2>
              <p className="text-ink-muted -mt-3 mb-0 text-sm">
                Fill in what you&apos;ve passed. High School is required; leave
                the others empty if they don&apos;t apply.
              </p>
              {errors.qualifications && (
                <Alert tone="danger">{errors.qualifications}</Alert>
              )}
              <div className="flex flex-col gap-3">
                <div className="text-ink-muted hidden grid-cols-[150px_90px_1fr_1fr_80px] gap-3 text-xs font-semibold tracking-[0.04em] uppercase md:grid">
                  <span>Examination</span>
                  <span>Year</span>
                  <span>Board / University</span>
                  <span>Subject</span>
                  <span>%</span>
                </div>
                {values.qualifications.map((q, i) => (
                  <div
                    key={q.exam}
                    className="border-line grid grid-cols-2 items-center gap-3 rounded-md border p-3 md:grid-cols-[150px_90px_1fr_1fr_80px] md:border-0 md:p-0"
                  >
                    <b className="col-span-2 text-sm md:col-span-1">
                      {q.exam}
                      {i === 0 && (
                        <span className="text-danger-ink ml-0.5">*</span>
                      )}
                    </b>
                    <Input
                      aria-label={`${q.exam} year`}
                      placeholder="Year"
                      inputMode="numeric"
                      maxLength={4}
                      value={q.year}
                      onChange={(e) => setQual(i, "year", e.target.value)}
                    />
                    <Input
                      aria-label={`${q.exam} percentage`}
                      placeholder="%"
                      inputMode="decimal"
                      value={q.percentage}
                      onChange={(e) => setQual(i, "percentage", e.target.value)}
                      className="md:order-last"
                    />
                    <Input
                      aria-label={`${q.exam} board or university`}
                      placeholder="Board / University"
                      value={q.board}
                      onChange={(e) => setQual(i, "board", e.target.value)}
                      className="col-span-2 md:col-span-1"
                    />
                    <Input
                      aria-label={`${q.exam} subject`}
                      placeholder="Subject"
                      value={q.subject}
                      onChange={(e) => setQual(i, "subject", e.target.value)}
                      className="col-span-2 md:col-span-1"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="flex flex-col gap-5">
              <h2 className="type-h2 m-0">Course</h2>
              <Field label="Course applied for" required error={errors.course}>
                {(p) => (
                  <Select
                    {...p}
                    value={values.course}
                    onChange={text("course")}
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
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Duration of course">
                  {(p) => (
                    <Input
                      {...p}
                      value={course?.duration_label ?? ""}
                      readOnly
                      disabled
                      placeholder="—"
                    />
                  )}
                </Field>
                <Field
                  label="Employment status"
                  required
                  error={errors.employment}
                >
                  {(p) => (
                    <Select
                      {...p}
                      value={values.employment}
                      onChange={text("employment")}
                    >
                      <option value="">Choose one</option>
                      {EMPLOYMENT.map((e) => (
                        <option key={e}>{e}</option>
                      ))}
                    </Select>
                  )}
                </Field>
              </div>
              <div className="bg-accent-soft flex flex-col gap-3 rounded-md p-4">
                <b className="text-ink">
                  No refund allowed after confirmation of admission.
                </b>
                <Checkbox
                  label="I have read this and my details above are correct."
                  checked={values.accept_no_refund}
                  onChange={(e) => set("accept_no_refund", e.target.checked)}
                  aria-invalid={errors.accept_no_refund ? true : undefined}
                />
                {errors.accept_no_refund && (
                  <span className="text-danger-ink text-[13px]">
                    {errors.accept_no_refund}
                  </span>
                )}
              </div>
            </section>
          )}

          <div className="border-line flex flex-wrap items-center justify-between gap-3 border-t pt-6">
            {step > 0 ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setErrors({});
                  setFailure(null);
                  setStep((s) => s - 1);
                  scrollTop();
                }}
                disabled={busy}
              >
                <ArrowLeft aria-hidden /> Back
              </Button>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <Button type="submit" loading={busy}>
                Continue <ArrowRight aria-hidden />
              </Button>
            ) : (
              <Button type="submit" variant="accent" size="lg" loading={busy}>
                Submit Application
              </Button>
            )}
          </div>
        </form>
      </Card>

      <aside className="flex flex-col gap-4 self-start lg:sticky lg:top-24">
        <Card pad className="flex flex-col gap-4">
          <span className="type-overline text-accent-ink">
            You&apos;re applying for
          </span>
          {course ? (
            <>
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
            </>
          ) : (
            <p className="text-ink-muted m-0 text-sm">
              Choose a course in the last step, or{" "}
              <Link href="/courses" className="text-navy-ink font-semibold">
                compare courses
              </Link>{" "}
              first.
            </p>
          )}
          <p className="text-ink-muted m-0 text-[13px]">
            One-time registration of {inr(registrationFee)}, then monthly fees.
            You pay at the institute after the office confirms your seat.
          </p>
        </Card>
        <ol
          className={cn(
            "text-ink-muted m-0 flex list-none flex-col gap-2 p-0 text-[13px]",
          )}
        >
          {[
            "Apply online (this form)",
            "The office calls within one working day",
            "Confirm and pay at the institute",
          ].map((t, i) => (
            <li key={t} className="flex items-center gap-2">
              <span className="bg-surface-sunken text-ink grid size-6 place-items-center rounded-full text-xs font-bold">
                {i + 1}
              </span>
              {t}
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}

function Success({
  result,
  registrationFee,
}: {
  result: Result;
  registrationFee: number;
}) {
  return (
    <Card
      pad
      className="mx-auto flex max-w-[640px] flex-col items-center gap-5 py-10 text-center"
    >
      <span className="bg-success-soft text-success-ink grid size-16 place-items-center rounded-full">
        <CircleCheck className="size-8" aria-hidden />
      </span>
      <div>
        <h2 className="type-h1 m-0">Application received</h2>
        <p className="text-ink-muted mt-2 mb-0">
          Your application for <b className="text-ink">{result.course.name}</b>{" "}
          is with the office. They&apos;ll call you within one working day to
          confirm your seat.
        </p>
      </div>
      <dl className="bg-surface-sunken m-0 grid w-full gap-3 rounded-md p-4 text-left sm:grid-cols-2">
        <div>
          <dt className="text-ink-muted text-[13px]">Your student ID</dt>
          <dd className="type-mono text-ink m-0 text-base">
            {result.student_code}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted text-[13px]">Application number</dt>
          <dd className="type-mono text-ink m-0 text-base">
            {result.enrollment_code}
          </dd>
        </div>
      </dl>
      <ul className="text-ink-muted m-0 flex list-disc flex-col gap-1 pl-5 text-left text-sm">
        <li>Bring a passport-size photo and your marksheets when you visit.</li>
        <li>
          The {inr(registrationFee)} registration and the first month&apos;s fee
          are paid at the institute after confirmation.
        </li>
        <li>
          You&apos;re signed in — your dashboard shows the status of this
          application.
        </li>
      </ul>
      <ButtonLink href="/student" size="lg">
        Go to My Dashboard
      </ButtonLink>
    </Card>
  );
}
