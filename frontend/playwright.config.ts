import { defineConfig } from "@playwright/test";

// End-to-end and accessibility tests in the system Chrome, against the dev servers
// (started here if they aren't already running). Run with: npm run e2e
// E2E_BASE_URL points them at another running copy instead (e.g. a production build).
const external = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: external ?? "http://localhost:3000",
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "light", use: { colorScheme: "light" } },
    // Contrast is checked again in the dark theme; the journey only runs once.
    {
      name: "dark",
      use: { colorScheme: "dark" },
      testMatch: /a11y\.spec\.ts/,
    },
  ],
  webServer: external
    ? undefined
    : [
        {
          command: ".venv/bin/python manage.py runserver 8000",
          cwd: "../backend",
          url: "http://localhost:8000/api/v1/site/",
          reuseExistingServer: true,
        },
        {
          command: "npm run dev",
          url: "http://localhost:3000",
          reuseExistingServer: true,
          timeout: 120_000,
        },
      ],
});
