import { admin, expect, expectAccessible, login, test } from "./fixtures";

/** The one-page site: open a course's syllabus, press Enquire, send the message form, and
 *  the office sees it in the console. Contact messages are limited to 5 an hour per visitor. */
test("visitor enquires about a course; the office sees it", async ({
  page,
  newPage,
}) => {
  const name = `Enquiry ${Date.now()}`;
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /All \d+ courses/ }),
  ).toBeVisible();

  // Open the Desk Top Publishing syllabus in place.
  const card = page.locator("#course-dtp");
  await card.getByRole("button", { name: "Syllabus" }).click();
  await expect(card.getByText("Syllabus · Desk Top Publishing")).toBeVisible();
  await expectAccessible(page);

  // Enquire pre-fills the course in the form further down.
  await card.getByRole("link", { name: "Enquire" }).click();
  await expect(page).toHaveURL(/#admission$/);
  // The form is actually on screen (a Next Link here once scrolled back to the course).
  await expect(
    page.getByRole("heading", { name: "How to join" }),
  ).toBeInViewport();
  await expect(page.getByLabel("Course you're interested in")).toHaveValue(
    "dtp",
  );

  // Phone is required and checked.
  await page.getByLabel("Your name").fill(name);
  await page.getByLabel("Mobile").fill("12345");
  await page.getByRole("button", { name: "Send Message" }).click();
  await expect(page.getByText("Enter a 10-digit mobile number")).toBeVisible();
  await page.getByLabel("Mobile").fill("98110 45236");
  await page.getByRole("button", { name: "Send Message" }).click();
  await expect(
    page.getByRole("heading", { name: "Message sent" }),
  ).toBeVisible();

  // The office sees it, with the course.
  const office = await newPage();
  const { email, password } = admin();
  await login(office, email, password);
  await office.waitForURL("**/admin");
  await office.goto("/admin/messages");
  const message = office.locator("div", { hasText: name }).filter({
    hasText: "Interested in Desk Top Publishing",
  });
  await expect(message.first()).toBeVisible();
  await expect(office.getByText("Call 9811045236").first()).toBeVisible();
});

test("old page addresses land on their sections", async ({ page }) => {
  await page.goto("/courses/pdm");
  await expect(page).toHaveURL(/\/#course-pdm$/);
  await expect(
    page
      .locator("#course-pdm")
      .getByText("Syllabus · Professional Diploma in Multimedia"),
  ).toBeVisible();
  for (const [from, to] of [
    ["/contact", "#contact"],
    ["/courses", "#courses"],
    ["/about", "#about"],
  ]) {
    await page.goto(from);
    await expect(page).toHaveURL(new RegExp(`/${to}$`));
  }
});
