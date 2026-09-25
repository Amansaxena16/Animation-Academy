import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

const TONES = {
  neutral: "bg-surface-sunken text-ink-muted",
  info: "bg-navy-soft text-navy-ink",
  success: "bg-success-soft text-success-ink",
  warning: "bg-accent-soft text-accent-ink",
  danger: "bg-danger-soft text-danger-ink",
  brand: "bg-brand-soft text-brand-ink",
  /** Solid navy: the prospectus course-header pill. */
  navy: "bg-navy text-on-navy",
  accent: "bg-accent text-on-accent",
} as const;

export type BadgeTone = keyof typeof TONES;

interface BadgeProps {
  tone?: BadgeTone;
  /** A leading dot for live statuses (Active, Pending…). */
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

/** Always a word, never colour alone. */
export function Badge({ tone = "neutral", dot, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-sm px-[9px] text-xs leading-4 font-semibold",
        TONES[tone],
        className,
      )}
    >
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
