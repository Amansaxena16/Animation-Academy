import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** What a list shows when it has nothing: icon, title, one helpful sentence, one action. */
export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <div className="mb-2 grid size-[72px] place-items-center rounded-full bg-surface-sunken text-ink-muted [&_svg]:size-[30px]">
        {icon}
      </div>
      <h4 className="m-0 font-display text-[17px] leading-6 font-semibold">{title}</h4>
      <p className="m-0 mb-2 max-w-[340px] text-sm text-ink-muted">{text}</p>
      {action}
    </div>
  );
}

/** Shimmer placeholder shaped like the content it stands in for. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded-sm bg-[linear-gradient(90deg,var(--surface-sunken)_25%,var(--line)_50%,var(--surface-sunken)_75%)] bg-[length:200%_100%]",
        className,
      )}
    />
  );
}
