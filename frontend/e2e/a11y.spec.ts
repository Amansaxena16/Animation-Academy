import { admin, expect, expectAccessible, login, test } from "./fixtures";

const PUBLIC = [
  "/",
  "/courses",
  "/courses/pdm",
  "/admission",
  "/about",
  "/updates",
  "/contact",
  "/verify",
  "/login",
  "/no-such-page",
];

const ADMIN = [
  "/admin",
  "/admin/enrollments",
  "/admin/students",
  "/admin/students/new",
  "/admin/courses",
  "/admin/courses/new",
  "/admin/courses/pdm",
  "/admin/certificates",
  "/admin/announcements",
  "/admin/content",
  "/admin/settings",
  "/admin/messages",
];

for (const path of PUBLIC) {
  test(`public ${path} is accessible`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    await expectAccessible(page);
  });
}

test("admin console pages are accessible", async ({ page }) => {
  const { email, password } = admin();
  await login(page, email, password);
  await page.waitForURL("**/admin");
  for (const path of ADMIN) {
    await page.goto(path);
    await expect(page.locator("main h1").first()).toBeVisible();
    // Wait for the data to replace the loading skeletons.
    await expect(page.locator(".animate-shimmer")).toHaveCount(0);
    await expectAccessible(page);
  }
});

test("keyboard: skip link and menu reach the content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: /skip to/i });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  // Focus moved past the header into the page content.
  expect(
    await page.evaluate(() => !!document.activeElement?.closest("main")),
  ).toBe(true);
});
