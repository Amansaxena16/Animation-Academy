"use client";

import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/cn";
import { setTheme, useTheme } from "@/lib/theme";

/** Sun/moon button in the public header and the dashboard top bar. */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "border-line text-ink hover:border-line-hover hover:bg-surface-sunken touch:size-11 grid size-10 place-items-center rounded-md border transition-colors",
        className,
      )}
    >
      {dark ? (
        <Sun className="size-[19px]" />
      ) : (
        <Moon className="size-[19px]" />
      )}
    </button>
  );
}
