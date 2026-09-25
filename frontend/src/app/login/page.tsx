import type { Metadata } from "next";

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
  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4 py-10">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-8">
        <Logo />
        <LoginForm next={safeNext(next)} />
      </div>
    </main>
  );
}
