import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

interface CardProps extends ComponentProps<"div"> {
  /** Lift 2px with a stronger shadow on hover. */
  hover?: boolean;
  /** space-6 padding (space-4 on mobile). */
  pad?: boolean;
}

export function Card({ hover, pad, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "border-line bg-surface-raised rounded-lg border shadow-sm",
        hover &&
          "transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md",
        pad && "p-4 md:p-6",
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({
  title,
  actions,
  className,
}: {
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-line flex items-center justify-between gap-3 border-b px-4 py-[18px] md:px-6",
        className,
      )}
    >
      <h3 className="font-display m-0 text-base leading-6 font-semibold">
        {title}
      </h3>
      {actions}
    </div>
  );
}

export function CardBody({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cn("p-4 md:p-6", className)} {...rest} />;
}
