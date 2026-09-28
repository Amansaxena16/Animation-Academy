import type { Metadata } from "next";

import { Alert } from "@/components/ui/Alert";
import { BackButton } from "@/components/ui/BackButton";
import { Logo } from "@/components/ui/Logo";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Login", robots: { index: false } };

/** Only same-site paths are allowed as the post-login destination (no open redirects). */
function safeNext(value: string | string[] | undefined): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.startsWith("/") && !v.startsWith("//") ? v : null;
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const target = safeNext(next);
  return (
    <main className="bg-surface grid min-h-screen place-items-center px-4 py-10">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-8">
        <div className="flex w-full flex-col items-center gap-6">
          <BackButton href="/" label="Home" />
          <Logo />
        </div>
        {target?.startsWith("/student/apply") && (
          <Alert title="Log in to apply for a course">
            Students ask for new courses from their dashboard. New to the
            institute? Admissions are made at the office.
          </Alert>
        )}
        <LoginForm next={target} />
      </div>
    </main>
  );
}
