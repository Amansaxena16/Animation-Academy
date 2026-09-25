import type { Metadata } from "next";

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
  const [items, params] = await Promise.all([getAnnouncements(), searchParams]);
  return (
    <>
      <section className="border-line bg-surface-raised border-b">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-6 md:py-16">
          <span className="type-overline text-accent-ink">Updates</span>
          <h1 className="type-display mt-3 mb-0">Notices from the institute</h1>
          <p className="type-body-lg text-ink-muted mt-4 mb-0 max-w-[620px]">
            Holidays, new batches, exams and events. Batch timings don&apos;t
            change unless a notice here says so.
          </p>
        </div>
      </section>
      <UpdatesList
        items={items}
        initialCategory={one(params.category)}
        today={todayISO()}
      />
    </>
  );
}
