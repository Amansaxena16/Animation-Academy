import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";

/** A staff login for the tests: created (or its password reset) in the dev database on every
 *  run, with a fresh random password that only this test process knows. */
export default function globalSetup() {
  const email = "e2e-admin@example.test";
  const password = randomBytes(18).toString("base64url");
  const backend = path.resolve(__dirname, "../../backend");
  execFileSync(
    path.join(backend, ".venv/bin/python"),
    [
      "manage.py",
      "shell",
      "-c",
      `import os
from accounts.models import User
u = User.objects.filter(email=os.environ["E2E_EMAIL"]).first() or User.objects.create_superuser(os.environ["E2E_EMAIL"], full_name="E2E Admin")
u.set_password(os.environ["E2E_PASSWORD"]); u.is_active = True; u.save()`,
    ],
    {
      cwd: backend,
      env: { ...process.env, E2E_EMAIL: email, E2E_PASSWORD: password },
      stdio: "inherit",
    },
  );
  // Read by the tests (Playwright passes globalSetup's environment to the workers).
  process.env.E2E_ADMIN_EMAIL = email;
  process.env.E2E_ADMIN_PASSWORD = password;
}
