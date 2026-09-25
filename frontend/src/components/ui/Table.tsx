"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { num } from "@/lib/format";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  /** Right-aligned action buttons; no label on mobile. */
  actions?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Rendered instead of the table when there are no rows. */
  empty?: ReactNode;
  caption?: string;
}

/** The first column is always the entity (avatar, name, ID). Under 720px every row
 *  becomes a labelled card. */
export function Table<T>({
  columns,
  rows,
  rowKey,
  empty,
  caption,
}: TableProps<T>) {
  if (rows.length === 0 && empty) return <>{empty}</>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="max-md:hidden">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  "bg-surface-sunken text-ink-muted px-4 py-3 text-left text-xs leading-4 font-semibold tracking-[0.04em] whitespace-nowrap uppercase",
                  c.actions && "text-right",
                )}
              >
                {c.actions ? (
                  <span className="sr-only">{c.header}</span>
                ) : (
                  c.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="hover:bg-surface max-md:border-line transition-colors duration-100 max-md:block max-md:border-t max-md:px-4 max-md:py-3.5"
            >
              {columns.map((c, i) => (
                <td
                  key={c.key}
                  data-label={c.header}
                  className={cn(
                    "border-line border-t px-4 py-3.5 align-middle",
                    "max-md:flex max-md:items-center max-md:justify-between max-md:gap-3 max-md:border-0 max-md:px-0 max-md:py-[5px]",
                    i > 0 &&
                      !c.actions &&
                      "max-md:before:text-ink-muted max-md:before:text-xs max-md:before:font-semibold max-md:before:tracking-[0.04em] max-md:before:uppercase max-md:before:content-[attr(data-label)]",
                    c.className,
                  )}
                >
                  {c.actions ? (
                    <div className="flex justify-end gap-1 max-md:justify-start">
                      {c.render(row)}
                    </div>
                  ) : (
                    c.render(row)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Entity cell: avatar, name and ID. */
export function CellUser({
  avatar,
  name,
  sub,
}: {
  avatar: ReactNode;
  name: string;
  sub: string;
}) {
  return (
    <div className="flex min-w-[180px] items-center gap-3">
      {avatar}
      <div className="min-w-0">
        <b className="block font-semibold">{name}</b>
        <small className="text-ink-muted font-mono text-[13px]">{sub}</small>
      </div>
    </div>
  );
}

interface PagerProps {
  page: number;
  pageSize: number;
  count: number;
  onPage: (page: number) => void;
}

/** "Showing 1–20 of 248" and page buttons (first, last and two either side). */
export function Pager({ page, pageSize, count, onPage }: PagerProps) {
  const pages = Math.max(1, Math.ceil(count / pageSize));
  if (count === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(count, page * pageSize);
  const shown = [
    ...new Set([1, page - 2, page - 1, page, page + 1, page + 2, pages]),
  ]
    .filter((p) => p >= 1 && p <= pages)
    .sort((a, b) => a - b);

  return (
    <nav
      aria-label="Pagination"
      className="border-line text-ink-muted flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3.5 text-[13px]"
    >
      <span>
        Showing {num(from)}–{num(to)} of {num(count)}
      </span>
      <div className="flex gap-1">
        {shown.map((p, i) => (
          <span key={p} className="flex gap-1">
            {i > 0 && p - shown[i - 1] > 1 && (
              <span className="grid h-[34px] place-items-center px-1">…</span>
            )}
            <button
              type="button"
              onClick={() => onPage(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "h-[34px] min-w-[34px] rounded-sm border text-[13px] font-semibold",
                p === page
                  ? "border-navy bg-navy text-on-navy"
                  : "border-line bg-surface-raised text-ink hover:border-line-strong",
              )}
            >
              {p}
            </button>
          </span>
        ))}
      </div>
    </nav>
  );
}
