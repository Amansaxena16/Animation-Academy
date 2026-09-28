import { admin, expect, expectAccessible, login, test } from "./fixtures";

// A small valid PNG (16×16), for the office's photo upload.
const PHOTO_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAGUlEQVR4nGP80GDAQApgIkn1qIZRDUNKAwAr2wHAaozGDwAAAABJRU5ErkJggg==";

/** The whole life of a student: the office admits them in the console → the student signs in
 *  and asks for a second course → the office completes the first course and issues the
 *  certificate → the student sees it → anyone can verify it. Runs against the dev database and
 *  leaves one e2e-*@example.test student behind. */
test("office admission to verified certificate", async ({ page, newPage }) => {
  const email = `e2e-${Date.now()}@example.test`;

  // 1. The office adds the student and enrolls them in Desk Top Publishing.
  const office = await newPage();
  const { email: staff, password: staffPassword } = admin();
  await login(office, staff, staffPassword);
  await office.waitForURL("**/admin");
  await office.goto("/admin/students/new");
  await office.getByLabel("Name (in capitals)").fill("Riya Test");
  await office.getByLabel("Father's name").fill("Mohan Test");
  await office.getByLabel("Date of birth").fill("2005-06-15");
  await office.getByLabel("Employment status").selectOption("Student");
  await office.getByLabel("Mobile").fill("9876543210");
  await office.getByLabel("Address").fill("12, Nehru Nagar");
  await office.getByLabel("Pincode").fill("208012");
  await office.getByLabel("High School year").fill("2021");
  await office.getByLabel("High School percentage").fill("78");
  await office.getByLabel("High School board or university").fill("UP Board");
  await office.getByLabel("High School subject").fill("Science");
  await office.getByLabel("Login email").fill(email);
  await office.getByLabel("Enroll in a course").selectOption("dtp");
  await office.locator("input[type=file]").setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: Buffer.from(PHOTO_PNG, "base64"),
  });
  await office.getByRole("button", { name: "Add Student" }).click();

  await expect(
    office.getByRole("heading", { name: "Riya Test is added" }),
  ).toBeVisible();
  const studentCode = (await office
    .locator("p", { hasText: "Student ID" })
    .locator(".type-mono")
    .textContent())!.trim();
  expect(studentCode).toMatch(/^AA-STU-\d+$/);
  const password = (await office.locator("code").textContent())!.trim();

  // The photo was uploaded with the new record.
  await office.getByRole("link", { name: "Open Student" }).click();
  await expect(
    office.locator("img[src*='students/photos']").first(),
  ).toBeVisible();
  // …and "View Website" leads from the console back to the public site.
  await office.getByRole("link", { name: "View Website" }).click();
  await expect(office).toHaveURL(/\/$/);

  // 2. The student signs in with the temporary password, sees the course, and asks for a
  //    second one from the portal; it waits for the office.
  await login(page, email, password);
  await page.waitForURL("**/student");
  await expect(page.getByText("Desk Top Publishing").first()).toBeVisible();

  // Their own profile and password forms reject bad values, field by field.
  await page.goto("/student/profile");
  await page.getByLabel(/^Pincode/).fill("008012");
  await page.getByLabel(/^Mobile/).fill("12345");
  await page.getByLabel(/^State/).fill("123");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByLabel(/^Pincode/)).toHaveAccessibleDescription(
    /6-digit pincode/,
  );
  await expect(page.getByLabel(/^Mobile/)).toHaveAccessibleDescription(
    /10-digit mobile/,
  );
  await expect(page.getByLabel(/^State/)).toHaveAccessibleDescription(
    /state name/,
  );
  await page.getByLabel("Current password").fill(password);
  await page.getByLabel("New password", { exact: true }).fill("12345678");
  await page.getByLabel("Confirm new password").fill("12345678");
  await page.getByRole("button", { name: "Change Password" }).click();
  await expect(
    page.getByLabel("New password", { exact: true }),
  ).toHaveAccessibleDescription(/too common|entirely numeric/);
  await page.goto("/student/apply?course=ccc");
  await expect(page.getByLabel("Course")).toHaveValue("ccc");
  await page.getByRole("button", { name: "Apply Now" }).click();
  await page.getByRole("button", { name: "Confirm Admission" }).click();
  await page.waitForURL("**/student/courses");
  await expect(page.getByText("Pending").first()).toBeVisible();

  // The website itself no longer takes admissions.
  const visitor = await newPage();
  await visitor.goto("/admission");
  await expect(visitor).toHaveURL(/\/#admission$/);

  // 3. The office completes Desk Top Publishing, which issues the certificate.
  await office.goto(`/admin/enrollments?q=${studentCode}`);
  const dtp = office.getByRole("row", { name: /Desk Top Publishing/ });
  await dtp.getByRole("button", { name: "Complete" }).click();
  await office.getByRole("button", { name: "Complete & Issue" }).click();
  await expect(dtp.getByRole("button", { name: "PDF" })).toBeVisible();

  // 4. The student sees the certificate; every student page is accessible.
  await page.goto("/student/certificates");
  const code = (await page
    .locator("a[href^='/student/certificates/'] .type-mono")
    .first()
    .textContent())!.trim();
  expect(code).toMatch(/^AA-\d{4}-\d{6}$/);
  await expectAccessible(page);
  for (const path of [
    "/student",
    "/student/courses",
    "/student/profile",
    `/student/certificates/${code}`,
  ]) {
    await page.goto(path);
    await expect(page.locator("main h1").first()).toBeVisible();
    await expect(page.locator(".animate-shimmer")).toHaveCount(0);
    await expectAccessible(page);
  }

  // 5. Anyone can verify it.
  await visitor.goto(`/verify/${code}`);
  await expect(
    visitor.getByRole("heading", { name: "Certificate verified" }),
  ).toBeVisible();
  await expect(visitor.getByText("RIYA TEST")).toBeVisible();
  await expect(visitor.getByText("Desk Top Publishing").first()).toBeVisible();
  await expectAccessible(visitor);
});
