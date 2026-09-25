"use client";

import { LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";
import { BottomNav, Sidebar } from "@/components/ui/Sidebar";
import { Skeleton } from "@/components/ui/EmptyState";
import type { Role } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { setTheme, useApplyTheme, useTheme } from "@/lib/theme";

import { ADMIN_NAV, STUDENT_NAV } from "./nav";

const HOME: Record<Role, string> = { student: "/student", admin: "/admin" };
// Imported here, not passed from the server layouts: icon components can't cross that boundary.
const NAV = { student: STUDENT_NAV, admin: ADMIN_NAV };

interface DashboardShellProps {
  role: Role;
  children: ReactNode;
}

/** Sidebar ≥1024px, a drawer below it, BottomNav under 720px. Light by default with a
 *  dark toggle remembered per browser. Restores the session and re-checks the role. */
export function DashboardShell({ role, children }: DashboardShellProps) {
  const { status, user, ensureSession, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const theme = useTheme();
  useApplyTheme(theme);
  const home = HOME[role];
  const nav = NAV[role];

  useEffect(() => {
    ensureSession().then((u) => {
      if (!u) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      else if (u.role !== role) router.replace(HOME[u.role]);
    });
  }, [ensureSession, role, router, pathname]);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const signOut = async () => {
    await logout();
    router.replace("/login");
  };

  const ready = status === "authenticated" && user?.role === role;

  return (
    <div className="min-h-screen bg-surface text-ink">
      <aside className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <Sidebar items={nav} rootHref={home} />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-70 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 animate-fade bg-[rgba(15,23,42,0.55)]" onClick={() => setDrawer(false)} />
          <div className="relative h-full w-fit shadow-lg">
            <Sidebar items={nav} rootHref={home} onNavigate={() => setDrawer(false)} />
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawer(false)}
              className="absolute top-4 -right-12 grid size-10 place-items-center rounded-md bg-surface-raised text-ink"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface-raised px-4 md:px-6">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawer(true)}
            className="grid size-10 place-items-center rounded-md text-ink hover:bg-surface-sunken lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <span className="md:hidden">
            <Logo size="sm" markOnly href={home} />
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              className="grid size-10 place-items-center rounded-md text-ink-muted hover:bg-surface-sunken hover:text-ink"
            >
              {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
            {user && (
              <span className="flex items-center gap-2.5 pl-1">
                <Avatar name={user.name} size="sm" />
                <span className="hidden flex-col leading-tight sm:flex">
                  <b className="text-sm font-semibold">{user.name}</b>
                  <small className="font-mono text-xs text-ink-muted">{user.student_code ?? (user.role === "admin" ? "Staff" : "Student")}</small>
                </span>
              </span>
            )}
            <button
              type="button"
              onClick={signOut}
              className="ml-1 inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-ink-muted hover:bg-surface-sunken hover:text-ink"
            >
              <LogOut className="size-[18px]" />
              <span className="max-sm:sr-only">Log Out</span>
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1200px] px-4 py-6 pb-28 md:px-6 md:pb-10">
          {ready ? (
            children
          ) : (
            <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          )}
        </main>
      </div>

      <BottomNav items={nav} rootHref={home} />
    </div>
  );
}
