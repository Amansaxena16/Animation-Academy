import Link from "next/link";
import { Fragment } from "react";

/** The last item is the current page and is not a link. */
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0 text-[13px] text-ink-muted">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={`${item.label}-${i}`}>
              {i > 0 && (
                <li aria-hidden className="opacity-60">
                  /
                </li>
              )}
              <li className={last ? "font-semibold text-ink" : undefined} aria-current={last ? "page" : undefined}>
                {item.href && !last ? (
                  <Link href={item.href} className="text-ink-muted no-underline hover:text-navy-ink">
                    {item.label}
                  </Link>
                ) : (
                  item.label
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
