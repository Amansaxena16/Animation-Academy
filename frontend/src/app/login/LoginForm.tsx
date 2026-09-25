"use client";

import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Form";
import { ApiError, type Role } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const HOME: Record<Role, string> = { student: "/student", admin: "/admin" };

export function LoginForm({ next }: { next: string | null }) {
  const { login, ensureSession } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  const destination = (role: Role) =>
    next && next.startsWith(HOME[role]) ? next : HOME[role];

  // Already signed in? Go straight to the dashboard.
  useEffect(() => {
    ensureSession().then((u) => u && router.replace(destination(u.role)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      router.replace(destination(user.role));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err
          : new ApiError(
              0,
              "Can't reach the server. Check your connection and try again.",
            ),
      );
      setLoading(false);
    }
  };

  return (
    <Card pad className="w-full">
      <h1 className="type-h1 m-0">Log in</h1>
      <p className="text-ink-muted mt-1 mb-6 text-sm">
        Students and institute staff use the same login.
      </p>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {error && !error.field("email") && !error.field("password") && (
          <Alert tone="danger">{error.detail}</Alert>
        )}
        <Field label="Email" required error={error?.field("email")}>
          {(p) => (
            <Input
              {...p}
              type="email"
              autoComplete="email"
              icon={<Mail />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          )}
        </Field>
        <Field label="Password" required error={error?.field("password")}>
          {(p) => (
            <Input
              {...p}
              type="password"
              autoComplete="current-password"
              icon={<Lock />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}
        </Field>
        <Button type="submit" block size="lg" loading={loading}>
          Log In
        </Button>
      </form>
      <p className="text-ink-muted mt-6 mb-0 text-center text-sm">
        New here?{" "}
        <Link href="/admission" className="text-navy-ink font-semibold">
          Apply for admission
        </Link>
      </p>
    </Card>
  );
}
