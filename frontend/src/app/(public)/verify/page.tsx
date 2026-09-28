import type { Metadata } from "next";

import { PublicPageHead } from "@/components/layout/PublicPageHead";
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
      <PublicPageHead
        overline="Certificate verification"
        title="Verify a certificate"
      >
        Every Animation Academy certificate carries a unique ID. Enter it to
        check the name, course and date on our records.
      </PublicPageHead>
      <section className="mx-auto max-w-[760px] px-4 py-10 md:px-6 md:py-14">
        <Card pad>
          <VerifyForm />
        </Card>
      </section>
    </>
  );
}
