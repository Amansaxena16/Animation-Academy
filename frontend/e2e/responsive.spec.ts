import type { Page } from "@playwright/test";

import { admin, expect, login, test } from "./fixtures";

/** Every page must fit phones and tablets: nothing scrolls sideways, every tap target is at
 *  least 44 × 44px on a touch screen, and phone inputs are 16px (iPhones zoom into smaller). */

// The public site is one page; the rest of the old public pages redirect to its sections.
const PUBLIC = ["/", "/verify", "/login"];

const ADMIN = [
  "/admin",
  "/admin/enrollments",
  "/admin/students",
  "/admin/students/new",
  "/admin/courses",
  "/admin/courses/pdm",
  "/admin/certificates",
  "/admin/announcements",
  "/admin/content",
  "/admin/settings",
  "/admin/messages",
];

const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 820, height: 1180 },
];

async function layoutProblems(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    const vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > vw)
      problems.push(
        `scrolls sideways: ${document.documentElement.scrollWidth}px > ${vw}px`,
      );
    const visible = (e: Element) => {
      const r = e.getBoundingClientRect();
      const s = getComputedStyle(e);
      return (
        r.width > 0 &&
        r.height > 0 &&
        s.visibility !== "hidden" &&
        !e.closest("[aria-hidden='true'], .sr-only")
      );
    };
    for (const e of document.querySelectorAll(
      "button, a, input, select, textarea",
    )) {
      if (!visible(e)) continue;
      const input = e as HTMLInputElement;
      if (["checkbox", "radio", "file"].includes(input.type)) continue;
      // Links inside running text and breadcrumbs are exempt (WCAG 2.5.8).
      if (e.closest("p, nav[aria-label='Breadcrumb']")) continue;
      if (e.matches("a[href='#main']")) continue; // skip link, shown on focus
      // A stretched link: its ::after covers the whole card, which is the target.
      if (getComputedStyle(e, "::after").position === "absolute") continue;
      const r = e.getBoundingClientRect();
      if (r.width < 43.5 || r.height < 43.5)
        problems.push(
          `small target ${Math.round(r.width)}x${Math.round(r.height)}: ${e.tagName.toLowerCase()} "${(e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 30)}"`,
        );
    }
    if (vw <= 720)
      for (const e of document.querySelectorAll(
        "input:not([type=checkbox]):not([type=radio]):not([type=file]), select, textarea",
      ))
        if (visible(e) && parseFloat(getComputedStyle(e).fontSize) < 16)
          problems.push(`input under 16px: ${(e as HTMLInputElement).name}`);
    return problems;
  });
}

async function check(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator(".animate-shimmer")).toHaveCount(0);
  expect(await layoutProblems(page), `layout on ${path}`).toEqual([]);
}

for (const size of SIZES) {
  test.describe(`${size.name} (${size.width}px)`, () => {
    test.use({
      viewport: { width: size.width, height: size.height },
      hasTouch: true,
      isMobile: true,
    });

    test("public pages fit", async ({ page }) => {
      for (const path of PUBLIC) await check(page, path);
    });

    test("admin console fits", async ({ page }) => {
      const { email, password } = admin();
      await login(page, email, password);
      await page.waitForURL("**/admin");
      for (const path of ADMIN) await check(page, path);
    });
  });
}
