import { TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Card } from "./Card";

const TONES = {
  brand: "bg-brand-soft text-brand-ink",
  blue: "bg-navy-soft text-navy-ink",
  amber: "bg-accent-soft text-accent-ink",
  green: "bg-success-soft text-success-ink",
} as const;

interface StatCardProps {
  icon: ReactNode;
  tone?: keyof typeof TONES;
  /** Already formatted with Indian grouping: "1,248". */
  value: ReactNode;
  label: string;
  /** e.g. "12%"; negative with down. */
  delta?: { value: string; down?: boolean };
}

/** One KPI per card. */
export function StatCard({ icon, tone = "brand", value, label, delta }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-3.5 p-5">
      <div className="flex items-center justify-between">
        <span className={cn("grid size-10 place-items-center rounded-md [&_svg]:size-5", TONES[tone])}>{icon}</span>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-[3px] text-xs font-semibold",
              delta.down ? "text-danger-ink" : "text-success-ink",
            )}
          >
            {delta.down ? <TrendingDown className="size-3.5" /> : <TrendingUp className="size-3.5" />}
            {delta.value}
          </span>
        )}
      </div>
      <div>
        <div className="type-stat text-ink">{value}</div>
        <div className="mt-0.5 text-[13px] text-ink-muted">{label}</div>
      </div>
    </Card>
  );
}
