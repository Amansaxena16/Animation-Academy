import { admin, expect, expectAccessible, login, test } from "./fixtures";

/** Courses and the message form: the home page shows four courses, /courses shows them all.
 *  Enquire fills in the form, which the office sees in the console. Contact messages are
 *  limited to 5 an hour per visitor. */
test("visitor enquires about a course; the office sees it", async ({
  page,
  newPage,
}) => {
  const name = `Enquiry ${Date.now()}`;

  // Home: four courses and a way to all of them.
  await page.goto("/");
  await expect(page.locator("#courses [id^='course-']")).toHaveCount(4);
  await page.getByRole("link", { name: /View All \d+ Courses/ }).click();
  await expect(page).toHaveURL(/\/courses$/);

  // All courses: open the Desk Top Publishing syllabus in place.
  const card = page.locator("#course-dtp");
  await card.getByRole("button", { name: "Syllabus" }).click();
  await expect(card.getByText("Syllabus · Desk Top Publishing")).toBeVisible();
  await expectAccessible(page);

  // Enquire goes to the home page's form with the course filled in, on screen.
  await card.getByRole("link", { name: "Enquire" }).click();
  await expect(page).toHaveURL(/\/\?course=dtp#admission$/);
  await expect(page.getByLabel("Course you're interested in")).toHaveValue(
    "dtp",
  );
  await expect(
    page.getByRole("heading", { name: "How to join" }),
  ).toBeInViewport();

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

test("Enquire on a home-page card jumps to the form on the same page", async ({
  page,
}) => {
  await page.goto("/");
  const card = page.locator("#courses [id^='course-']").first();
  const slug = (await card.getAttribute("id"))!.replace("course-", "");
  // A plain anchor: a Next Link here once scrolled back to the course.
  await card.getByRole("link", { name: "Enquire" }).click();
  await expect(page).toHaveURL(/\/#admission$/);
  await expect(
    page.getByRole("heading", { name: "How to join" }),
  ).toBeInViewport();
  await expect(page.getByLabel("Course you're interested in")).toHaveValue(
    slug,
  );
});

test("old page addresses land on their sections", async ({ page }) => {
  await page.goto("/courses/pdm");
  await expect(page).toHaveURL(/\/courses#course-pdm$/);
  await expect(
    page
      .locator("#course-pdm")
      .getByText("Syllabus · Professional Diploma in Multimedia"),
  ).toBeVisible();
  for (const [from, to] of [
    ["/contact", "#contact"],
    ["/about", "#about"],
    ["/admission", "#admission"],
  ]) {
    await page.goto(from);
    await expect(page).toHaveURL(new RegExp(`/${to}$`));
  }
});
