import { dateTile } from "@/lib/format";
import { announcementTone } from "@/lib/status";

import { Badge } from "./Badge";

export interface AnnouncementData {
  id: number | string;
  title: string;
  text: string;
  category: string;
  /** ISO date: "2026-10-02". */
  date: string;
}

/** An institute update: date tile, category badge, title, one-line summary. */
export function Announcement({ item }: { item: AnnouncementData }) {
  const { day, month } = dateTile(item.date);
  return (
    <article className="border-line grid grid-cols-[52px_1fr] gap-3.5 border-t py-4 first:border-t-0 first:pt-0">
      <time
        dateTime={item.date}
        className="bg-surface-sunken flex h-14 w-[52px] flex-col items-center justify-center rounded-md leading-none"
      >
        <b className="font-display text-ink text-xl leading-none font-bold">
          {day}
        </b>
        <small className="text-ink-muted mt-1 text-[11px] font-bold tracking-[0.06em] uppercase">
          {month}
        </small>
      </time>
      <div className="min-w-0">
        <Badge tone={announcementTone[item.category] ?? "neutral"}>
          {item.category}
        </Badge>
        <h4 className="text-ink mt-1 mb-0.5 text-[15px] leading-[22px] font-semibold">
          {item.title}
        </h4>
        <p className="text-ink-muted m-0 text-sm leading-[21px]">{item.text}</p>
      </div>
    </article>
  );
}
