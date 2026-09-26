"use client";

import { useState } from "react";

import { useToast } from "@/components/ui/Toast";
import { useAdminAction } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import type { AdminSite } from "@/types/admin";

/** Shared by Website Content and Settings: both edit parts of the one SiteSettings record. */
export function useSiteForm<K extends keyof AdminSite>(
  site: AdminSite,
  fields: K[],
) {
  const toast = useToast();
  const [values, setValues] = useState(
    () =>
      Object.fromEntries(fields.map((f) => [f, site[f]])) as Pick<AdminSite, K>,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useAdminAction<Pick<AdminSite, K>, AdminSite>(
    "PATCH",
    () => "site/",
  );

  const set = <F extends K>(field: F, value: AdminSite[F]) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field as string]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      await save.mutateAsync(values);
      toast({ title: "Saved", text: "The website shows the change now." });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errors).length) {
        setErrors(
          Object.fromEntries(
            Object.entries(err.errors).map(([k, v]) => [k, v[0]]),
          ),
        );
        toast({ title: "Check the highlighted fields", tone: "danger" });
      } else toast({ title: "Couldn't save", tone: "danger" });
    }
  };

  return { values, set, errors, submit, saving: save.isPending };
}
