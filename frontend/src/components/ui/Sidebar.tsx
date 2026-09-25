"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

import { Logo } from "./Logo";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** An amber count pill, e.g. pending admissions. */
  count?: number;
  /** Starts a labelled group ("Manage", "Website"). */
  group?: string;
  /** Show in the mobile BottomNav (max 5). */
  mobile?: boolean;
}

/** Active when the path is the item or below it; the section root matches exactly. */
export function isActive(pathname: string, href: string, rootHref: string) {
  return href === rootHref
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

/** Dashboard navigation ≥1024px (a drawer below): navy ground, ivory logo, amber bar on the active item. */
export function Sidebar({
  items,
  rootHref,
  onNavigate,
}: {
  items: NavItem[];
  rootHref: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Dashboard"
      className="bg-navy text-on-navy flex h-full w-[260px] flex-col gap-1 px-3.5 py-5"
    >
      <div className="px-2.5 pt-1 pb-5">
        <Logo size="sm" tone="inverse" href={rootHref} />
      </div>
      {items.map((item) => {
        const active = isActive(pathname, item.href, rootHref);
        return (
          <div key={item.href}>
            {item.group && (
              <div className="px-3 pt-4 pb-1.5 text-[11px] leading-4 font-bold tracking-[0.1em] text-white/55 uppercase">
                {item.group}
              </div>
            )}
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm leading-5 font-medium no-underline",
                active
                  ? "bg-white/12 text-white shadow-[inset_3px_0_0_var(--accent)]"
                  : "text-white/78 hover:bg-white/7 hover:text-white",
              )}
            >
              <item.icon
                aria-hidden
                className="size-[19px] shrink-0 opacity-90"
              />
              {item.label}
              {item.count ? (
                <span className="rounded-pill bg-accent text-on-accent ml-auto px-[7px] py-px text-[11px] font-bold">
                  {item.count}
                  <span className="sr-only"> pending</span>
                </span>
              ) : null}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

/** Mobile (<720px) role navigation: icon + label, 48px targets, safe-area padding. */
export function BottomNav({
  items,
  rootHref,
}: {
  items: NavItem[];
  rootHref: string;
}) {
  const pathname = usePathname();
  const shown = items.filter((i) => i.mobile).slice(0, 5);
  return (
    <nav
      aria-label="Dashboard"
      className="border-line bg-surface-raised fixed inset-x-0 bottom-0 z-60 flex border-t px-1.5 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] md:hidden"
    >
      {shown.map((item) => {
        const active = isActive(pathname, item.href, rootHref);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-12 flex-1 flex-col items-center justify-center gap-[3px] rounded-md px-0.5 py-1.5 text-[11px] font-semibold no-underline",
              active ? "text-navy-ink" : "text-ink-muted",
            )}
          >
            <item.icon aria-hidden className="size-[22px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
