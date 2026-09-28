import type { ReactNode } from "react";

import { BackButton } from "@/components/ui/BackButton";

export function PageHeader({
  title,
  text,
  actions,
  back,
}: {
  title: string;
  text?: ReactNode;
  actions?: ReactNode;
  /** Where "Back to …" goes; the section's own dashboard page has none. */
  back?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col gap-3">
      {back && <BackButton href={back.href} label={back.label} />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="type-h1 m-0">{title}</h1>
          {text && <p className="text-ink-muted mt-1 mb-0">{text}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
