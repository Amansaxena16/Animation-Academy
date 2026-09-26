import type { ReactNode } from "react";

export function PageHeader({
  title,
  text,
  actions,
}: {
  title: string;
  text?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="type-h1 m-0">{title}</h1>
        {text && <p className="text-ink-muted mt-1 mb-0">{text}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
