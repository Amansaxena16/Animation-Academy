import { useEffect, useSyncExternalStore } from "react";

// Dashboard theme, remembered per browser. The server always renders "light"; the stored
// choice is applied right after hydration (useSyncExternalStore handles the hand-over).

export type Theme = "light" | "dark";
const KEY = "aa-theme";
const listeners = new Set<() => void>();

function read(): Theme {
  try {
    return localStorage.getItem(KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage); // other tabs
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* private mode: nothing is remembered, and the theme stays as it is */
  }
  listeners.forEach((l) => l());
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, read, () => "light");
}

/** Put the theme on <html> so portals (modals, toasts) follow it too. Removed on unmount,
 *  so public pages go back to light. */
export function useApplyTheme(theme: Theme) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    return () => {
      delete root.dataset.theme;
    };
  }, [theme]);
}
