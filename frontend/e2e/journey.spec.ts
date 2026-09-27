import { randomBytes } from "node:crypto";

import { admin, expect, expectAccessible, login, test } from "./fixtures";

/** The whole life of a student: apply on the website → office approves → course completed and
 *  certificate issued → student sees it → anyone can verify it. Runs against the dev database
 *  and leaves one e2e-*@example.test student behind (admissions are limited to 5 an hour). */
test("admission to verified certificate", async ({ page, newPage }) => {
  const email = `e2e-${Date.now()}@example.test`;
  const password = randomBytes(12).toString("base64url");

  // 1. Apply for Desk Top Publishing.
  await page.goto("/admission?course=dtp");
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(password);
  await page.getByRole("textbox", { name: "Confirm password" }).fill(password);
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Name (in capitals)").fill("Riya Test");
  await expect(page.getByLabel("Name (in capitals)")).toHaveValue("RIYA TEST");
  await page.getByLabel("Father's name").fill("Mohan Test");
  await page.getByLabel("Date of birth").fill("2005-06-15");
  await page.getByLabel("Mobile").fill("9876543210");
  await page.getByLabel("Address").fill("12, Nehru Nagar");
  await page.getByLabel("Pincode").fill("208012");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("High School year").fill("2021");
  await page.getByLabel("High School percentage").fill("78");
  await page.getByLabel("High School board or university").fill("UP Board");
  await page.getByLabel("High School subject").fill("Science");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByLabel("Course applied for")).toHaveValue("dtp");
  await page.getByLabel("Employment status").selectOption("Student");
  await page
    .getByLabel("I have read this and my details above are correct.")
    .check();
  await page.getByRole("button", { name: "Submit Application" }).click();

  await expect(
    page.getByRole("heading", { name: "Application received" }),
  ).toBeVisible();
  const enrollment = (await page
    .locator("dt", { hasText: "Application number" })
    .locator("+ dd")
    .textContent())!.trim();
  expect(enrollment).toMatch(/^EN-\d+$/);

  // The new student is signed in and sees the pending application.
  await page.getByRole("link", { name: "Go to My Dashboard" }).click();
  await expect(page.getByText("Pending").first()).toBeVisible();

  // 2. The office approves it, then marks the course completed (issues the certificate).
  const office = await newPage();
  const { email: staff, password: staffPassword } = admin();
  await login(office, staff, staffPassword);
  await office.waitForURL("**/admin");
  await office.goto(`/admin/enrollments?q=${enrollment}`);
  await expect(office.getByText(enrollment)).toHaveCount(1);
  await office.getByRole("button", { name: "Approve" }).click();
  await expect(office.getByText("Admission confirmed")).toBeVisible();
  await office.getByRole("button", { name: "Complete" }).click();
  await office.getByRole("button", { name: "Complete & Issue" }).click();
  await expect(office.getByRole("button", { name: "PDF" })).toBeVisible();

  // 3. The student sees the certificate; every student page is accessible.
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

  // 4. Anyone can verify it.
  const visitor = await newPage();
  await visitor.goto(`/verify/${code}`);
  await expect(
    visitor.getByRole("heading", { name: "Certificate verified" }),
  ).toBeVisible();
  await expect(visitor.getByText("RIYA TEST")).toBeVisible();
  await expect(visitor.getByText("Desk Top Publishing").first()).toBeVisible();
  await expectAccessible(visitor);
});
