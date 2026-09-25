"use client";

import { Megaphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Announcement } from "@/components/ui/Announcement";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import type { Announcement as Item } from "@/types/content";

export function UpdatesList({
  items,
  initialCategory,
  today,
}: {
  items: Item[];
  initialCategory: string;
  /** Today in India, from the server, so both renders agree. */
  today: string;
}) {
  const router = useRouter();
  const [category, setCategory] = useState(initialCategory);
  const categories = [...new Set(items.map((i) => i.category))];
  const shown = category ? items.filter((i) => i.category === category) : items;

  const pick = (value: string) => {
    setCategory(value);
    router.replace(
      value ? `/updates?category=${encodeURIComponent(value)}` : "/updates",
      { scroll: false },
    );
  };

  const chip = (selected: boolean) =>
    cn(
      "inline-flex h-9 items-center rounded-pill border px-3.5 text-[13px] font-semibold transition-colors",
      selected
        ? "border-navy bg-navy text-on-navy"
        : "border-line bg-surface-raised text-ink hover:border-line-strong",
    );

  return (
    <section className="mx-auto flex max-w-[860px] flex-col gap-6 px-4 py-10 md:px-6 md:py-12">
      {categories.length > 1 && (
        <div
          role="group"
          aria-label="Category"
          className="flex flex-wrap gap-2"
        >
          <button
            type="button"
            aria-pressed={!category}
            className={chip(!category)}
            onClick={() => pick("")}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              className={chip(category === c)}
              onClick={() => pick(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      {shown.length ? (
        [
          { title: "Coming up", list: shown.filter((a) => a.date >= today) },
          { title: "Earlier", list: shown.filter((a) => a.date < today) },
        ]
          .filter((group) => group.list.length)
          .map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <h2 className="type-h3 m-0">{group.title}</h2>
              <Card>
                <CardBody>
                  {group.list.map((a) => (
                    <Announcement key={a.id} item={a} />
                  ))}
                </CardBody>
              </Card>
            </div>
          ))
      ) : (
        <Card>
          <EmptyState
            icon={<Megaphone />}
            title="No notices right now"
            text="New batches, holidays and exam dates are posted here as soon as they're fixed."
          />
        </Card>
      )}
    </section>
  );
}
