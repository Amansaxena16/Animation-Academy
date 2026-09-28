import { useEffect, useSyncExternalStore } from "react";

import { DEFAULT_THEME, THEME_KEY, type Theme } from "./theme-script";

// Site-wide theme, remembered per browser. Dark is the default; the choice lives in
// localStorage and is put on <html data-theme> before the page paints (THEME_SCRIPT in the
// root layout), so there is no flash. The certificate keeps its own print colours.

export type { Theme };
const KEY = THEME_KEY;
const DEFAULT: Theme = DEFAULT_THEME;
const listeners = new Set<() => void>();

function read(): Theme {
  try {
    const stored = localStorage.getItem(KEY);
    return stored === "light" || stored === "dark" ? stored : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    apply(read()); // another tab changed it
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* private mode: nothing is remembered, but the page still switches */
  }
  apply(theme);
  listeners.forEach((l) => l());
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, read, () => DEFAULT);
}

/** Preview a theme without saving it (the component showcase). Restores the visitor's own
 *  theme on unmount. */
export function useApplyTheme(theme: Theme) {
  useEffect(() => {
    apply(theme);
    return () => apply(read());
  }, [theme]);
}
