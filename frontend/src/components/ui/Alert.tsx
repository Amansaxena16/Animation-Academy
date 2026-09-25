import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

const TONES = {
  info: { box: "bg-brand-soft", icon: "text-navy-ink", Icon: Info },
  success: {
    box: "bg-success-soft",
    icon: "text-success-ink",
    Icon: CircleCheck,
  },
  warning: {
    box: "bg-accent-soft",
    icon: "text-accent-ink",
    Icon: TriangleAlert,
  },
  danger: { box: "bg-danger-soft", icon: "text-danger-ink", Icon: CircleAlert },
} as const;

export type AlertTone = keyof typeof TONES;

interface AlertProps {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Inline feedback: icon first, optional bold title. */
export function Alert({
  tone = "info",
  title,
  children,
  className,
}: AlertProps) {
  const t = TONES[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "text-ink flex items-start gap-3 rounded-md px-4 py-3.5 text-sm leading-[21px]",
        t.box,
        className,
      )}
    >
      <t.Icon aria-hidden className={cn("mt-px size-5 shrink-0", t.icon)} />
      <div className="min-w-0">
        {title && <b className="block">{title}</b>}
        {children}
      </div>
    </div>
  );
}
