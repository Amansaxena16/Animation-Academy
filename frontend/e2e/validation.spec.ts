import type { Page } from "@playwright/test";

import { admin, expect, login, test } from "./fixtures";

/** Every form, in the browser: bad values show a clear message next to the right field and
 *  nothing is saved. (The API rules themselves are covered value by value in
 *  backend/common/tests/test_form_validation.py.) */

/** A field by its label; required fields' names end in "*". */
const byLabel = (page: Page, label: string) =>
  page.getByLabel(
    new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\*?$`),
  );

/** The message under a labelled field (Field links it with aria-describedby). */
async function expectFieldError(page: Page, label: string, text: RegExp) {
  const field = byLabel(page, label);
  await expect(field).toHaveAttribute("aria-invalid", "true");
  await expect(field).toHaveAccessibleDescription(text);
}

test("message form: name and mobile are checked", async ({ page }) => {
  await page.goto("/#admission");
  const send = page.getByRole("button", { name: "Send Message" });
  await send.click();
  await expectFieldError(page, "Your name", /Tell us your name/);
  await expectFieldError(page, "Mobile", /10-digit mobile/);

  for (const bad of ["12345", "5123456789", "98110 4523", "abcdefghij"]) {
    await byLabel(page, "Mobile").fill(bad);
    await send.click();
    await expectFieldError(page, "Mobile", /10-digit mobile/);
  }
  // Accepted formats clear the error (checked on blur, before sending).
  for (const good of ["98110 45236", "+91 98110 45236", "098110 45236"]) {
    await byLabel(page, "Mobile").fill(good);
    await byLabel(page, "Mobile").blur();
    await expect(byLabel(page, "Mobile")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
  }
});

test("login: wrong details and empty fields", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Log In" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page
    .getByRole("textbox", { name: "Email" })
    .fill("nobody@example.test");
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill("wrong-password");
  await page.getByRole("button", { name: "Log In" }).click();
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
});

test("verify: unknown and malformed certificate IDs", async ({ page }) => {
  for (const code of ["AA-2026-999999", "hello world", "../../etc/passwd"]) {
    await page.goto("/verify");
    await page.getByLabel("Certificate ID").fill(code);
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(
      page.getByText(/No certificate found|Enter the ID|check the ID/i).first(),
    ).toBeVisible();
  }
});

test("admin forms show each field's error and save nothing", async ({
  page,
}) => {
  const { email, password } = admin();
  await login(page, email, password);
  await page.waitForURL("**/admin");

  // Add a student: every rule that the office can trip over.
  await page.goto("/admin/students/new");
  await page.getByLabel("Name (in capitals)").fill("Riya 123");
  await page.getByLabel("Father's name").fill("12345");
  await page.getByLabel("Date of birth").fill("2025-01-01");
  await page.getByLabel("Mobile").fill("12345");
  await page.getByLabel("Phone").fill("123");
  await page.getByLabel("Address").fill("C4");
  await page.getByLabel("Pincode").fill("008012");
  await page.getByLabel("City").fill("12345");
  await page.getByLabel("High School year").fill("1900");
  await page.getByLabel("High School board or university").fill("UP Board");
  await page.getByLabel("Login email").fill("not-an-email");
  await page.getByRole("button", { name: "Add Student" }).click();
  await expect(
    page.getByText("Some fields need attention — see the messages below."),
  ).toBeVisible();
  await expectFieldError(page, "Name (in capitals)", /full name in capitals/);
  await expectFieldError(page, "Father's name", /letters only/);
  await expectFieldError(page, "Date of birth", /Check your date of birth/);
  await expectFieldError(page, "Mobile", /10-digit mobile/);
  await expectFieldError(page, "Phone", /valid phone number/);
  await expectFieldError(page, "Address", /Address is required/);
  await expectFieldError(page, "Pincode", /6-digit pincode/);
  await expectFieldError(page, "City", /city name/);
  await expectFieldError(page, "Login email", /valid email/);
  await expect(
    page.getByText("High School: enter the year you passed"),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/students\/new$/);

  // Add a course: a ₹0 fee and a missing name.
  await page.goto("/admin/courses/new");
  await page.getByLabel("Monthly fee (₹)").fill("0");
  await page.getByRole("button", { name: "Add Course" }).click();
  await expectFieldError(page, "Name", /blank|required/i);
  await expectFieldError(page, "Monthly fee (₹)", /greater than or equal to 1/);
  await expect(page).toHaveURL(/\/admin\/courses\/new$/);

  // An announcement without a title.
  await page.goto("/admin/announcements");
  await page.getByRole("button", { name: "New Announcement" }).click();
  await page.getByRole("button", { name: "Add Announcement" }).click();
  await expectFieldError(page, "Title", /blank|required/i);

  // Settings: a bad email and no phone number.
  await page.goto("/admin/settings");
  await byLabel(page, "Email").fill("office@");
  await page.getByLabel("Phone numbers").fill("");
  await page.getByRole("button", { name: "Save Settings" }).click();
  await expectFieldError(page, "Email", /valid email/);
  await expectFieldError(page, "Phone numbers", /blank|required|phone/i);
});
