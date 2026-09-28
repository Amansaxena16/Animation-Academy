"use client";

import { ExternalLink } from "lucide-react";

import { PageHeader } from "@/components/admin/PageHeader";
import { useSiteForm } from "@/components/admin/useSiteForm";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/EmptyState";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/Form";
import { useAdmin } from "@/lib/admin";
import type { AdminSite } from "@/types/admin";

const FIELDS = [
  "hero_headline",
  "hero_sub",
  "about",
  "show_stats",
  "stat_students",
  "stat_courses",
  "stat_years",
  "stat_certificates",
] as const;

export default function ContentPage() {
  const { data } = useAdmin<AdminSite>("site/");
  if (!data) return <Skeleton className="h-96 rounded-lg" />;
  return <ContentForm key={data.updated_at} site={data} />;
}

function ContentForm({ site }: { site: AdminSite }) {
  const { values, set, errors, submit, saving } = useSiteForm(site, [
    ...FIELDS,
  ]);
  const stat = (field: (typeof FIELDS)[number], label: string) => (
    <Field
      label={label}
      help='E.g. "500+" — counts up on the home page.'
      error={errors[field]}
    >
      {(p) => (
        <Input
          {...p}
          maxLength={12}
          value={String(values[field] ?? "")}
          onChange={(e) => set(field, e.target.value)}
        />
      )}
    </Field>
  );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/admin", label: "Dashboard" }}
        title="Website content"
        text="The home page headline, the numbers band and the About text."
        actions={
          <ButtonLink href="/" variant="secondary" target="_blank">
            <ExternalLink aria-hidden /> View Website
          </ButtonLink>
        }
      />
      <Card>
        <CardHeader title="Home page" />
        <CardBody className="flex flex-col gap-5">
          <Field
            label="Headline"
            required
            help="Short and plain."
            error={errors.hero_headline}
          >
            {(p) => (
              <Input
                {...p}
                maxLength={80}
                value={values.hero_headline ?? ""}
                onChange={(e) => set("hero_headline", e.target.value)}
              />
            )}
          </Field>
          <Field label="Introduction" required error={errors.hero_sub}>
            {(p) => (
              <Textarea
                {...p}
                rows={3}
                value={values.hero_sub ?? ""}
                onChange={(e) => set("hero_sub", e.target.value)}
              />
            )}
          </Field>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Numbers band" />
        <CardBody className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Checkbox
            label="Show the numbers on the home page"
            checked={values.show_stats ?? true}
            onChange={(e) => set("show_stats", e.target.checked)}
            className="sm:col-span-2 lg:col-span-4"
          />
          {stat("stat_students", "Students trained")}
          {stat("stat_courses", "Courses offered")}
          {stat("stat_years", "Years of teaching")}
          {stat("stat_certificates", "Certificates issued")}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="About the institute" />
        <CardBody>
          <Field
            label="About text"
            help="Shown on the About page."
            error={errors.about}
          >
            {(p) => (
              <Textarea
                {...p}
                rows={4}
                value={values.about ?? ""}
                onChange={(e) => set("about", e.target.value)}
              />
            )}
          </Field>
        </CardBody>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={saving}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
