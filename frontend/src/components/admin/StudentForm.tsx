"use client";

import type { ReactNode } from "react";

import {
  QualificationsTable,
  type Qualification,
} from "@/components/student/QualificationsTable";
import { Alert } from "@/components/ui/Alert";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { todayISO } from "@/lib/format";

export const EXAMS = [
  "High School",
  "Intermediate",
  "Graduation",
  "Post Graduation",
];
export const EMPLOYMENT = [
  "Student",
  "Unemployed",
  "Employed",
  "Self-employed",
  "Part-time",
];
const GENDERS = ["Male", "Female", "Other"];
const STATUSES = ["Pending", "Active", "Inactive", "Graduated"];

export interface StudentValues {
  email: string;
  name: string;
  father_name: string;
  dob: string;
  gender: string;
  mobile: string;
  phone: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
  employment: string;
  qualifications: Qualification[];
  status: string;
}

export type StudentErrors = Partial<
  Record<keyof StudentValues | "course", string>
>;

export const emptyStudent = (): StudentValues => ({
  email: "",
  name: "",
  father_name: "",
  dob: "",
  gender: "",
  mobile: "",
  phone: "",
  address: "",
  pincode: "",
  city: "Kanpur",
  state: "Uttar Pradesh",
  country: "India",
  employment: "Student",
  qualifications: EXAMS.map((exam) => ({
    exam,
    year: "",
    board: "",
    subject: "",
    percentage: "",
  })),
  status: "Active",
});

/** Every field the office can set on a student record (add and edit share it). */
export function StudentForm({
  values,
  errors,
  onChange,
  showStatus,
  extra,
}: {
  values: StudentValues;
  errors: StudentErrors;
  onChange: (patch: Partial<StudentValues>) => void;
  /** Edit only: the record status (Inactive blocks the login). */
  showStatus?: boolean;
  /** Extra card content at the end of "Account" (e.g. the course to enroll in). */
  extra?: ReactNode;
}) {
  const text =
    (field: keyof StudentValues, upper = false) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      onChange({
        [field]: upper ? e.target.value.toUpperCase() : e.target.value,
      });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader title="Identity" />
        <CardBody className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Name (in capitals)"
            required
            help="Printed on certificates."
            error={errors.name}
            className="sm:col-span-2"
          >
            {(p) => (
              <Input {...p} value={values.name} onChange={text("name", true)} />
            )}
          </Field>
          <Field label="Father's name" required error={errors.father_name}>
            {(p) => (
              <Input
                {...p}
                value={values.father_name}
                onChange={text("father_name", true)}
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
          <Field label="Gender" error={errors.gender}>
            {(p) => (
              <Select {...p} value={values.gender} onChange={text("gender")}>
                <option value="">Not given</option>
                {GENDERS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Employment status" required error={errors.employment}>
            {(p) => (
              <Select
                {...p}
                value={values.employment}
                onChange={text("employment")}
              >
                {EMPLOYMENT.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
            )}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Contact and address" />
        <CardBody className="grid gap-5 sm:grid-cols-2">
          <Field label="Mobile" required error={errors.mobile}>
            {(p) => (
              <Input
                {...p}
                type="tel"
                inputMode="tel"
                value={values.mobile}
                onChange={text("mobile")}
              />
            )}
          </Field>
          <Field label="Phone" error={errors.phone}>
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
                className="min-h-0"
                value={values.address}
                onChange={text("address")}
              />
            )}
          </Field>
          <Field label="Pincode" required error={errors.pincode}>
            {(p) => (
              <Input
                {...p}
                inputMode="numeric"
                maxLength={6}
                value={values.pincode}
                onChange={text("pincode")}
              />
            )}
          </Field>
          <Field label="City" error={errors.city}>
            {(p) => (
              <Input {...p} value={values.city} onChange={text("city")} />
            )}
          </Field>
          <Field label="State" error={errors.state}>
            {(p) => (
              <Input {...p} value={values.state} onChange={text("state")} />
            )}
          </Field>
          <Field label="Country" error={errors.country}>
            {(p) => (
              <Input {...p} value={values.country} onChange={text("country")} />
            )}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Educational qualification" />
        <CardBody className="flex flex-col gap-4">
          {errors.qualifications && (
            <Alert tone="danger">{errors.qualifications}</Alert>
          )}
          <QualificationsTable
            rows={values.qualifications}
            onChange={(row, key, value) =>
              onChange({
                qualifications: values.qualifications.map((q, i) =>
                  i === row ? { ...q, [key]: value } : q,
                ),
              })
            }
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Account" />
        <CardBody className="grid gap-5 sm:grid-cols-2">
          <Field label="Login email" required error={errors.email}>
            {(p) => (
              <Input
                {...p}
                type="email"
                value={values.email}
                onChange={text("email")}
              />
            )}
          </Field>
          {showStatus && (
            <Field
              label="Status"
              help="Inactive blocks the login; records are kept."
              error={errors.status}
            >
              {(p) => (
                <Select {...p} value={values.status} onChange={text("status")}>
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              )}
            </Field>
          )}
          {extra}
        </CardBody>
      </Card>
    </div>
  );
}

/** Map an API error's fields onto the form (qualification messages are one string). */
export function errorsFrom(errors: Record<string, string[]>): StudentErrors {
  return Object.fromEntries(
    Object.entries(errors).map(([k, v]) => [k, v[0]]),
  ) as StudentErrors;
}
