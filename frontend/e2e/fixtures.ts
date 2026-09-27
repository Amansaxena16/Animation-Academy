import AxeBuilder from "@axe-core/playwright";
import { expect, test as base, type Page } from "@playwright/test";

/** Every test fails if the page logs a Content-Security-Policy violation or throws. */
export const test = base.extend<{ problems: string[] }>({
  problems: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on("console", (msg) => {
        if (/Content[- ]Security[- ]Policy|Refused to/i.test(msg.text()))
          problems.push(`CSP: ${msg.text()}`);
      });
      page.on("pageerror", (err) =>
        problems.push(`Page error: ${err.message}`),
      );
      await use(problems);
      expect(problems, "console problems").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** axe-core against WCAG 2.1 A and AA; the report names each failing rule and element. */
export async function expectAccessible(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const report = violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n` +
      v.nodes.map((n) => `    ${n.target.join(" ")}`).join("\n"),
  );
  expect(report, `accessibility on ${page.url()}`).toEqual([]);
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
}

export const admin = () => ({
  email: process.env.E2E_ADMIN_EMAIL!,
  password: process.env.E2E_ADMIN_PASSWORD!,
});
