"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";
import { PUBLIC_NAV } from "@/lib/site";

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface-raised/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center gap-6 px-4 md:px-6">
        <Logo size="sm" className="max-[380px]:[&_img+img]:hidden" />
        <nav aria-label="Main" className="ml-auto hidden items-center gap-1 lg:flex">
          {PUBLIC_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-semibold no-underline",
                isActive(item.href) ? "text-brand-ink" : "text-ink-muted hover:bg-surface-sunken hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <ButtonLink href="/login" variant="ghost" className="max-sm:hidden">
            Login
          </ButtonLink>
          <ButtonLink href="/admission" variant="primary" className="max-sm:hidden">
            Register
          </ButtonLink>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-md text-ink hover:bg-surface-sunken lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-menu" aria-label="Main" className="border-t border-line bg-surface-raised px-4 pt-2 pb-4 lg:hidden">
          {PUBLIC_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "block rounded-md px-3 py-3 font-semibold no-underline",
                isActive(item.href) ? "bg-brand-soft text-brand-ink" : "text-ink hover:bg-surface-sunken",
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-3 flex gap-2">
            <ButtonLink href="/login" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
              Login
            </ButtonLink>
            <ButtonLink href="/admission" variant="primary" className="flex-1" onClick={() => setOpen(false)}>
              Register
            </ButtonLink>
          </div>
        </nav>
      )}
    </header>
  );
}
