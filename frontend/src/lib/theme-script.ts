// Shared by the root layout (a server component) and lib/theme.ts, so it has no React imports.

export type Theme = "light" | "dark";
export const THEME_KEY = "aa-theme";
export const DEFAULT_THEME: Theme = "dark";

/** Runs in <head> before first paint: puts the saved theme (or dark) on <html>. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");document.documentElement.dataset.theme=t==="light"||t==="dark"?t:"${DEFAULT_THEME}"}catch(e){}`;
