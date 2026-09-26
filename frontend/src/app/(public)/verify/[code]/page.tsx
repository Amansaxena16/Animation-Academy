import { BadgeCheck, SearchX } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { Card } from "@/components/ui/Card";
import { API_URL } from "@/lib/api";
import { formatDateLong } from "@/lib/format";
import type { Verification } from "@/types/student";

import { VerifyForm } from "../VerifyForm";

export const metadata: Metadata = {
  title: "Certificate check",
  robots: { index: false },
};

/** Always fresh: a verification must reflect the records right now. */
async function check(code: string): Promise<Verification | null | "error"> {
  try {
    const res = await fetch(`${API_URL}/verify/${encodeURIComponent(code)}/`, {
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) return "error";
    return (await res.json()) as Verification;
  } catch {
    return "error";
  }
}

export default async function VerifyResultPage({
  params,
}: PageProps<"/verify/[code]">) {
  await connection();
  const code = decodeURIComponent((await params).code).toUpperCase();
  const result = await check(code);

  return (
    <section className="mx-auto flex max-w-[760px] flex-col gap-6 px-4 py-10 md:px-6 md:py-14">
      <span className="type-overline text-accent-ink">
        Certificate verification
      </span>

      {result === "error" ? (
        <Card pad className="flex flex-col gap-2">
          <h1 className="type-h2 m-0">We couldn&apos;t check right now</h1>
          <p className="text-ink-muted m-0">Please try again in a moment.</p>
        </Card>
      ) : result ? (
        <Card className="overflow-hidden">
          <div className="bg-success-soft text-success-ink flex items-center gap-3 px-6 py-5">
            <BadgeCheck className="size-8 shrink-0" aria-hidden />
            <div>
              <h1 className="type-h2 m-0">Certificate verified</h1>
              <p className="m-0 text-sm">
                Issued by Animation Academy, Nehru Nagar, Kanpur.
              </p>
            </div>
          </div>
          <dl className="m-0 grid gap-5 px-6 py-6 sm:grid-cols-2">
            {[
              ["Awarded to", result.student_name],
              ["Course", result.course_name],
              ["Duration", result.duration],
              ["Completed", formatDateLong(result.issued_on)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-ink-muted text-[13px]">{label}</dt>
                <dd className="text-ink m-0 text-[17px] font-semibold">
                  {value}
                </dd>
              </div>
            ))}
            <div className="sm:col-span-2">
              <dt className="text-ink-muted text-[13px]">Certificate ID</dt>
              <dd className="type-mono text-ink m-0 text-base">
                {result.code}
              </dd>
            </div>
          </dl>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="bg-danger-soft text-danger-ink flex items-center gap-3 px-6 py-5">
            <SearchX className="size-8 shrink-0" aria-hidden />
            <div>
              <h1 className="type-h2 m-0">No certificate found</h1>
              <p className="m-0 text-sm">
                <span className="type-mono">{code}</span> was not issued by
                Animation Academy. Check the ID and try again.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card pad>
        <h2 className="type-h3 m-0 mb-4">Check another certificate</h2>
        <VerifyForm />
      </Card>
    </section>
  );
}
