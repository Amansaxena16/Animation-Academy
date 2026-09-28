"use client";

import { Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/cn";
import { telHref } from "@/lib/content";
import { PUBLIC_NAV } from "@/lib/site";

const DASHBOARD = { student: "/student", admin: "/admin" } as const;

/** Merged with the hero: no bar at the top of the page, a solid one once the page scrolls or
 *  the menu is open. The links are sections of the one-page site; the one in view is marked.
 *  `role` comes from the aa_session cookie (read by the layout): signed-in visitors get a
 *  "My Dashboard" link instead of Login. There is no Register — the office admits students. */
export function PublicHeader({
  role,
  phone,
}: {
  role?: string;
  phone?: string;
}) {
  const dashboard =
    role === "student" || role === "admin" ? DASHBOARD[role] : null;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [section, setSection] = useState<string | null>(null);
  const isActive = (href: string) =>
    pathname === "/" && href === `/#${section}`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Which section is in view (home page only).
  useEffect(() => {
    if (pathname !== "/") return;
    const ids = PUBLIC_NAV.map((item) => item.href.slice(2));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setSection(visible.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [pathname]);

  const solid = scrolled || open;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,border-color] duration-200",
        solid
          ? "border-line bg-header-bg backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center gap-6 px-4 md:px-6 lg:h-20">
        <Logo
          size="header"
          className="[&>img]:w-auto max-[380px]:[&>img+img]:hidden max-lg:[&>img:first-child]:h-[42px] max-lg:[&>img:not(:first-child)]:h-[34px]"
        />
        <nav
          aria-label="Main"
          className="ml-auto hidden items-center gap-1 lg:flex"
        >
          {PUBLIC_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-[15px] font-medium no-underline transition-colors",
                isActive(item.href)
                  ? "text-ink font-semibold"
                  : "text-ink-muted hover:bg-surface-sunken hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          <Link
            href={dashboard ?? "/login"}
            className="text-ink-muted hover:text-ink rounded-md px-2 py-2 text-sm font-medium no-underline max-sm:hidden"
          >
            {dashboard ? "My Dashboard" : "Login"}
          </Link>
          <ThemeToggle />
          {phone && (
            <ButtonLink
              href={telHref(phone)}
              variant="primary"
              className="max-sm:hidden"
            >
              <Phone aria-hidden /> Call
            </ButtonLink>
          )}
          <button
            type="button"
            className="text-ink hover:bg-surface-sunken grid size-10 place-items-center rounded-md lg:hidden"
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
        <nav
          id="mobile-menu"
          aria-label="Main"
          className="border-line bg-surface-raised border-t px-4 pt-2 pb-4 lg:hidden"
        >
          {PUBLIC_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "block rounded-md px-3 py-3 font-semibold no-underline",
                isActive(item.href)
                  ? "bg-brand-soft text-brand-ink"
                  : "text-ink hover:bg-surface-sunken",
              )}
            >
              {item.label}
            </Link>
          ))}
          {phone && (
            <ButtonLink
              href={telHref(phone)}
              variant="primary"
              block
              className="mt-3"
            >
              <Phone aria-hidden /> Call {phone}
            </ButtonLink>
          )}
          <Link
            href={dashboard ?? "/login"}
            onClick={() => setOpen(false)}
            className="text-ink-muted mt-2 block rounded-md px-3 py-3 text-center font-semibold no-underline"
          >
            {dashboard ? "My Dashboard" : "Login"}
          </Link>
        </nav>
      )}
    </header>
  );
}
