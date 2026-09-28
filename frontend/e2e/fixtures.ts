import AxeBuilder from "@axe-core/playwright";
import {
  expect,
  test as base,
  type BrowserContext,
  type Page,
} from "@playwright/test";

/** Records Content-Security-Policy violations and uncaught errors a page logs. */
export function watch(page: Page, problems: string[]) {
  page.on("console", (msg) => {
    if (/Content[- ]Security[- ]Policy|Refused to/i.test(msg.text()))
      problems.push(`CSP: ${msg.text()}`);
  });
  page.on("pageerror", (err) => problems.push(`Page error: ${err.message}`));
}

/** The site is dark unless the visitor picks light; each project ("light", "dark") saves its
 *  theme before any page loads, so both themes are checked. */
const themeFor = (project: string) => (project === "light" ? "light" : "dark");
const saveTheme = (context: BrowserContext, theme: string) =>
  context.addInitScript((t) => localStorage.setItem("aa-theme", t), theme);

/** Every test fails if a watched page logs a CSP violation or throws. Extra pages opened with
 *  `newPage` (a separate login) are watched too. */
export const test = base.extend<{
  problems: string[];
  newPage: () => Promise<Page>;
}>({
  context: async ({ context }, provide, testInfo) => {
    await saveTheme(context, themeFor(testInfo.project.name));
    await provide(context);
  },
  problems: [
    async ({ page }, provide) => {
      const problems: string[] = [];
      watch(page, problems);
      await provide(problems);
      expect(problems, "console problems").toEqual([]);
    },
    { auto: true },
  ],
  newPage: async ({ browser, problems }, provide, testInfo) => {
    const contexts: BrowserContext[] = [];
    await provide(async () => {
      const context = await browser.newContext();
      await saveTheme(context, themeFor(testInfo.project.name));
      contexts.push(context);
      const page = await context.newPage();
      watch(page, problems);
      return page;
    });
    for (const c of contexts) await c.close();
  },
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
