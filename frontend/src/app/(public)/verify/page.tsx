import type { Metadata } from "next";

import { Card } from "@/components/ui/Card";

import { VerifyForm } from "./VerifyForm";

export const metadata: Metadata = {
  title: "Verify a certificate",
  description:
    "Check that a certificate was issued by Animation Academy, Nehru Nagar, Kanpur, using the ID printed on it.",
};

export default function VerifyPage() {
  return (
    <>
      <section className="border-line bg-surface-raised border-b">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-6 md:py-16">
          <span className="type-overline text-accent-ink">
            Certificate verification
          </span>
          <h1 className="type-display mt-3 mb-0">Verify a certificate</h1>
          <p className="type-body-lg text-ink-muted mt-4 mb-0 max-w-[640px]">
            Every Animation Academy certificate carries a unique ID. Enter it to
            check the name, course and date on our records.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-[760px] px-4 py-10 md:px-6 md:py-14">
        <Card pad>
          <VerifyForm />
        </Card>
      </section>
    </>
  );
}
