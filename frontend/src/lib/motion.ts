/** "smooth", unless the visitor asked their system for less motion (CSS can't cover JS scrolls). */
export const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
