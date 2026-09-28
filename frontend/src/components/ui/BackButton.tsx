import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/cn";

/** "← Back to Courses": a quiet pill that goes up to the page's parent. A plain link, so it
 *  works before the page's scripts load and always lands where its label says. */
export function BackButton({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group border-line bg-surface-raised text-ink-muted rounded-pill touch:h-11 inline-flex h-[34px] items-center gap-1.5 self-start border pr-3.5 pl-2.5 text-sm font-medium no-underline transition-colors",
        "hover:border-line-hover hover:bg-surface-sunken hover:text-ink print:hidden",
        className,
      )}
    >
      <ArrowLeft
        aria-hidden
        className="size-4 transition-transform group-hover:-translate-x-0.5"
      />
      Back to {label}
    </Link>
  );
}
