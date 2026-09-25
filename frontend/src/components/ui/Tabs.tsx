"use client";

import Link from "next/link";

import { cn } from "@/lib/cn";

export interface TabItem<K extends string = string> {
  key: K;
  label: string;
  /** Render as a link (page sections with their own URL). */
  href?: string;
  count?: number;
}

const tabClass = (active: boolean) =>
  cn(
    "-mb-px whitespace-nowrap border-b-2 px-3.5 py-3 text-sm leading-5 font-semibold no-underline",
    active ? "border-brand text-brand-ink" : "border-transparent text-ink-muted hover:text-ink",
  );

/** Page sections. Scrolls horizontally on mobile. */
export function Tabs<K extends string>({
  items,
  active,
  onChange,
  className,
}: {
  items: TabItem<K>[];
  active: K;
  onChange?: (key: K) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]", className)}>
      {items.map((t) => {
        const label = (
          <>
            {t.label}
            {t.count !== undefined && <span className="ml-1.5 text-ink-muted">{t.count}</span>}
          </>
        );
        return t.href ? (
          <Link key={t.key} href={t.href} role="tab" aria-selected={active === t.key} className={tabClass(active === t.key)}>
            {label}
          </Link>
        ) : (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            onClick={() => onChange?.(t.key)}
            className={tabClass(active === t.key)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Filtering a list in place: All / Active / Completed. */
export function SegmentedControl<K extends string>({
  items,
  active,
  onChange,
  label,
}: {
  items: { key: K; label: string }[];
  active: K;
  onChange: (key: K) => void;
  /** Accessible name for the group. */
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex w-fit gap-1 self-start rounded-md bg-surface-sunken p-1">
      {items.map((t) => (
        <button
          key={t.key}
          type="button"
          aria-pressed={active === t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "rounded-[7px] px-3 py-1.5 text-[13px] leading-5 font-semibold",
            active === t.key ? "bg-surface-raised text-ink shadow-sm" : "text-ink-muted hover:text-ink",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
