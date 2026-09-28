import type { Metadata } from "next";
import { connection } from "next/server";

import { PublicPageHead } from "@/components/layout/PublicPageHead";
import { getAnnouncements } from "@/lib/content";
import { todayISO } from "@/lib/format";

import { UpdatesList } from "./UpdatesList";

export const metadata: Metadata = {
  title: "Updates",
  description:
    "Holidays, new batches, exams and events at Animation Academy, Nehru Nagar, Kanpur.",
};

const one = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) ?? "";

export default async function UpdatesPage({
  searchParams,
}: PageProps<"/updates">) {
  await connection(); // request-time: don't fetch the API during the build
  const [items, params] = await Promise.all([getAnnouncements(), searchParams]);
  return (
    <>
      <PublicPageHead overline="Updates" title="Notices from the institute">
        Holidays, new batches, exams and events. Batch timings don&apos;t change
        unless a notice here says so.
      </PublicPageHead>
      <UpdatesList
        items={items}
        initialCategory={one(params.category)}
        today={todayISO()}
      />
    </>
  );
}
