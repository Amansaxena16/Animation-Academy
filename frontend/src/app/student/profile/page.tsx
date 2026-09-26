"use client";

import { Lock } from "lucide-react";
import { useState } from "react";

import {
  QualificationsTable,
  type Qualification,
} from "@/components/student/QualificationsTable";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/EmptyState";
import {
  Field,
  Input,
  PhotoUpload,
  Select,
  Textarea,
} from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import { ApiError, setAccessToken } from "@/lib/api";
import { formatDateLong } from "@/lib/format";
import { studentTone } from "@/lib/status";
import { useChangePassword, useProfile, useUpdateProfile } from "@/lib/student";
import type { Profile } from "@/types/student";

const EMPLOYMENT = [
  "Student",
  "Unemployed",
  "Employed",
  "Self-employed",
  "Part-time",
];
const GENDERS = ["Male", "Female", "Other"];

type Editable = Pick<
  Profile,
  | "mobile"
  | "phone"
  | "address"
  | "pincode"
  | "city"
  | "state"
  | "country"
  | "employment"
  | "gender"
> & { qualifications: Qualification[] };

const EDITABLE: (keyof Editable)[] = [
  "mobile",
  "phone",
  "address",
  "pincode",
  "city",
  "state",
  "country",
  "employment",
  "gender",
  "qualifications",
];

type Errors = Partial<Record<keyof Editable | "photo", string>>;

function ReadOnly({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-ink-muted text-[13px]">{label}</span>
      <span className="text-ink font-semibold">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { data: profile, isPending, isError } = useProfile();

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );
  }
  if (isError || !profile)
    return (
      <Alert tone="danger">
        Your profile didn&apos;t load. Refresh the page to try again.
      </Alert>
    );
  // Keyed so the form starts from the latest saved profile.
  return (
    <ProfileForm key={profile.code + profile.joined_at} profile={profile} />
  );
}

function ProfileForm({ profile }: { profile: Profile }) {
  const toast = useToast();
  const update = useUpdateProfile();
  const [values, setValues] = useState<Editable>(
    () =>
      ({
        ...Object.fromEntries(EDITABLE.map((k) => [k, profile[k] ?? ""])),
        qualifications: profile.qualifications as Qualification[],
      }) as Editable,
  );
  const [photo, setPhoto] = useState<File | null>(null);
  const [errors, setErrors] = useState<Errors>({});

  const set =
    (field: keyof Editable) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setValues((v) => ({ ...v, [field]: e.target.value }));
      if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
    };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    let body: Record<string, unknown> | FormData = { ...values };
    if (photo) {
      const form = new FormData();
      for (const [k, v] of Object.entries(values))
        form.append(
          k,
          k === "qualifications" ? JSON.stringify(v) : String(v ?? ""),
        );
      form.append("photo", photo);
      body = form;
    }
    try {
      await update.mutateAsync(body);
      setPhoto(null);
      toast({ title: "Profile saved", text: "Your details are up to date." });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errors).length) {
        setErrors(
          Object.fromEntries(
            Object.entries(err.errors).map(([k, v]) => [k, v[0]]),
          ),
        );
      } else {
        toast({
          title: "Couldn't save your profile",
          text: "Check your connection and try again.",
          tone: "danger",
        });
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="type-h1 m-0">My profile</h1>
        <p className="text-ink-muted mt-1 mb-0">
          The details the institute has on record for you.
        </p>
      </div>

      <Card>
        <CardHeader
          title="On your certificate"
          actions={
            <Badge tone={studentTone[profile.status]} dot>
              {profile.status}
            </Badge>
          }
        />
        <CardBody className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <ReadOnly label="Name" value={profile.name} />
          <ReadOnly label="Father's name" value={profile.father_name} />
          <ReadOnly label="Date of birth" value={formatDateLong(profile.dob)} />
          <ReadOnly
            label="Student ID"
            value={<span className="type-mono">{profile.code}</span>}
          />
          <ReadOnly label="Login email" value={profile.email} />
          <ReadOnly label="Joined" value={formatDateLong(profile.joined_at)} />
          <p className="text-ink-muted m-0 inline-flex items-center gap-2 text-[13px] sm:col-span-2 lg:col-span-3">
            <Lock className="size-3.5" aria-hidden />
            These print on your certificate. To correct them, please contact the
            office with a document.
          </p>
        </CardBody>
      </Card>

      <form onSubmit={save} noValidate className="flex flex-col gap-6">
        <Card>
          <CardHeader title="Contact and address" />
          <CardBody className="grid gap-5 sm:grid-cols-2">
            <Field label="Mobile" required error={errors.mobile}>
              {(p) => (
                <Input
                  {...p}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={values.mobile}
                  onChange={set("mobile")}
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
                  value={values.phone ?? ""}
                  onChange={set("phone")}
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
                  onChange={set("address")}
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
                  onChange={set("pincode")}
                />
              )}
            </Field>
            <Field label="City" error={errors.city}>
              {(p) => (
                <Input
                  {...p}
                  value={values.city ?? ""}
                  onChange={set("city")}
                />
              )}
            </Field>
            <Field label="State" error={errors.state}>
              {(p) => (
                <Input
                  {...p}
                  value={values.state ?? ""}
                  onChange={set("state")}
                />
              )}
            </Field>
            <Field label="Country" error={errors.country}>
              {(p) => (
                <Input
                  {...p}
                  value={values.country ?? ""}
                  onChange={set("country")}
                />
              )}
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="About you" />
          <CardBody className="grid gap-5 sm:grid-cols-2">
            <Field label="Employment status" required error={errors.employment}>
              {(p) => (
                <Select
                  {...p}
                  value={values.employment}
                  onChange={set("employment")}
                >
                  {EMPLOYMENT.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Gender" error={errors.gender}>
              {(p) => (
                <Select
                  {...p}
                  value={values.gender ?? ""}
                  onChange={set("gender")}
                >
                  <option value="">Prefer not to say</option>
                  {GENDERS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              )}
            </Field>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-ink text-sm font-semibold">Photo</span>
              <PhotoUpload
                value={photo}
                currentUrl={profile.photo}
                onChange={setPhoto}
                error={errors.photo}
              />
            </div>
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
              onChange={(row, key, value) => {
                setValues((v) => ({
                  ...v,
                  qualifications: v.qualifications.map((q, i) =>
                    i === row ? { ...q, [key]: value } : q,
                  ),
                }));
                if (errors.qualifications)
                  setErrors((er) => ({ ...er, qualifications: undefined }));
              }}
            />
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={update.isPending}>
            Save Changes
          </Button>
        </div>
      </form>

      <ChangePassword />
    </div>
  );
}

function ChangePassword() {
  const toast = useToast();
  const change = useChangePassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8)
      return setErrors({ new_password: "Use at least 8 characters." });
    if (next !== confirm)
      return setErrors({ confirm: "The two passwords don't match." });
    setErrors({});
    try {
      const res = await change.mutateAsync({
        old_password: current,
        new_password: next,
      });
      setAccessToken(res.access); // this device keeps working; others are signed out
      setCurrent("");
      setNext("");
      setConfirm("");
      toast({
        title: "Password changed",
        text: "Other devices have been signed out.",
      });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errors).length) {
        setErrors(
          Object.fromEntries(
            Object.entries(err.errors).map(([k, v]) => [k, v[0]]),
          ),
        );
      } else {
        toast({
          title: "Couldn't change your password",
          text: "Try again in a moment.",
          tone: "danger",
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader title="Change password" />
      <CardBody>
        <form
          onSubmit={submit}
          noValidate
          className="grid gap-5 sm:grid-cols-3"
        >
          <Field label="Current password" error={errors.old_password}>
            {(p) => (
              <Input
                {...p}
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            )}
          </Field>
          <Field label="New password" error={errors.new_password}>
            {(p) => (
              <Input
                {...p}
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
            )}
          </Field>
          <Field label="Confirm new password" error={errors.confirm}>
            {(p) => (
              <Input
                {...p}
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            )}
          </Field>
          <div className="sm:col-span-3">
            <Button
              type="submit"
              variant="secondary"
              loading={change.isPending}
              disabled={!current || !next}
            >
              Change Password
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
