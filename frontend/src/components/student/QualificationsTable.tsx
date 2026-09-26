"use client";

import { Input } from "@/components/ui/Form";

export interface Qualification {
  exam: string;
  year: string;
  board: string;
  subject: string;
  percentage: string;
}

type Key = "year" | "board" | "subject" | "percentage";

/** The paper form's education table: one row per exam, a card per exam on phones. */
export function QualificationsTable({
  rows,
  onChange,
}: {
  rows: Qualification[];
  onChange: (row: number, key: Key, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-ink-muted hidden grid-cols-[150px_90px_1fr_1fr_80px] gap-3 text-xs font-semibold tracking-[0.04em] uppercase md:grid">
        <span>Examination</span>
        <span>Year</span>
        <span>Board / University</span>
        <span>Subject</span>
        <span>%</span>
      </div>
      {rows.map((q, i) => (
        <div
          key={q.exam}
          className="border-line grid grid-cols-2 items-center gap-3 rounded-md border p-3 md:grid-cols-[150px_90px_1fr_1fr_80px] md:border-0 md:p-0"
        >
          <b className="col-span-2 text-sm md:col-span-1">
            {q.exam}
            {i === 0 && <span className="text-danger-ink ml-0.5">*</span>}
          </b>
          <Input
            aria-label={`${q.exam} year`}
            placeholder="Year"
            inputMode="numeric"
            maxLength={4}
            value={q.year}
            onChange={(e) => onChange(i, "year", e.target.value)}
          />
          <Input
            aria-label={`${q.exam} percentage`}
            placeholder="%"
            inputMode="decimal"
            value={q.percentage}
            onChange={(e) => onChange(i, "percentage", e.target.value)}
            className="md:order-last"
          />
          <Input
            aria-label={`${q.exam} board or university`}
            placeholder="Board / University"
            value={q.board}
            onChange={(e) => onChange(i, "board", e.target.value)}
            className="col-span-2 md:col-span-1"
          />
          <Input
            aria-label={`${q.exam} subject`}
            placeholder="Subject"
            value={q.subject}
            onChange={(e) => onChange(i, "subject", e.target.value)}
            className="col-span-2 md:col-span-1"
          />
        </div>
      ))}
    </div>
  );
}
