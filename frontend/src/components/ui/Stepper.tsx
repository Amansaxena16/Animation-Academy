import { Check } from "lucide-react";

import { cn } from "@/lib/cn";

/** Position in the admission flow: Account → Personal → Education → Course.
 *  Keep labels to one word so it fits a phone. */
export function Stepper({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="m-0 flex list-none gap-2 p-0">
      {steps.map((label, i) => {
        const done = i < current;
        const isCurrent = i === current;
        return (
          <li
            key={label}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "flex min-w-0 flex-1 flex-col gap-2 text-[13px]",
              isCurrent ? "text-ink" : "text-ink-muted",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "rounded-pill h-1",
                done || isCurrent ? "bg-brand" : "bg-line",
              )}
            />
            <span className="flex items-center gap-2 overflow-hidden font-semibold text-ellipsis whitespace-nowrap">
              <span
                aria-hidden
                className={cn(
                  "grid size-[22px] shrink-0 place-items-center rounded-full border-[1.5px] text-xs",
                  done && "border-brand bg-brand text-on-brand",
                  isCurrent && "border-brand bg-surface-raised text-brand-ink",
                  !done &&
                    !isCurrent &&
                    "border-line-strong bg-surface-raised text-ink-muted",
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className="sr-only">
                {done ? "Completed: " : isCurrent ? "Current: " : ""}
              </span>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
