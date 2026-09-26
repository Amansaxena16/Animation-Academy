"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { useSiteForm } from "@/components/admin/useSiteForm";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/EmptyState";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/Form";
import { useAdmin } from "@/lib/admin";
import type { AdminSite } from "@/types/admin";

const FIELDS = [
  "phones",
  "email",
  "address",
  "registration_fee",
  "director_name",
  "allow_registration",
  "maintenance_mode",
] as const;

export default function SettingsPage() {
  const { data } = useAdmin<AdminSite>("site/");
  if (!data) return <Skeleton className="h-96 rounded-lg" />;
  return <SettingsForm key={data.updated_at} site={data} />;
}

function SettingsForm({ site }: { site: AdminSite }) {
  const { values, set, errors, submit, saving } = useSiteForm(site, [
    ...FIELDS,
  ]);

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        text="Contact details, fees, certificates and the website switches."
      />

      {site.maintenance_mode && (
        <Alert tone="warning" title="Maintenance mode is on">
          The public website shows a &ldquo;back shortly&rdquo; page. Logins and
          dashboards still work.
        </Alert>
      )}

      <Card>
        <CardHeader title="Contact details" />
        <CardBody className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Phone numbers"
            required
            help="Comma-separated; the first is the main number."
            error={errors.phones}
          >
            {(p) => (
              <Input
                {...p}
                value={values.phones ?? ""}
                onChange={(e) => set("phones", e.target.value)}
              />
            )}
          </Field>
          <Field label="Email" required error={errors.email}>
            {(p) => (
              <Input
                {...p}
                type="email"
                value={values.email ?? ""}
                onChange={(e) => set("email", e.target.value)}
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
                value={values.address ?? ""}
                onChange={(e) => set("address", e.target.value)}
              />
            )}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Admissions and certificates" />
        <CardBody className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Registration fee (₹)"
            required
            help="One-time, shown with every course's fees."
            error={errors.registration_fee}
          >
            {(p) => (
              <Input
                {...p}
                type="number"
                min={0}
                value={String(values.registration_fee ?? "")}
                onChange={(e) =>
                  set("registration_fee", Number(e.target.value))
                }
              />
            )}
          </Field>
          <Field
            label="Director's name"
            help="Signs every certificate. Leave empty for a plain “Director” line."
            error={errors.director_name}
          >
            {(p) => (
              <Input
                {...p}
                value={values.director_name ?? ""}
                onChange={(e) => set("director_name", e.target.value)}
              />
            )}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Website switches" />
        <CardBody className="flex flex-col gap-4">
          <Checkbox
            label="Accept applications online"
            checked={values.allow_registration ?? true}
            onChange={(e) => set("allow_registration", e.target.checked)}
          />
          <p className="text-ink-muted -mt-2 mb-0 ml-7 text-[13px]">
            Off: the admission form says to call the institute instead.
          </p>
          <Checkbox
            label="Maintenance mode"
            checked={values.maintenance_mode ?? false}
            onChange={(e) => set("maintenance_mode", e.target.checked)}
          />
          <p className="text-ink-muted -mt-2 mb-0 ml-7 text-[13px]">
            On: every public page shows &ldquo;We&apos;ll be back shortly&rdquo;
            with your phone number.
          </p>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={saving}>
          Save Settings
        </Button>
      </div>
    </form>
  );
}
