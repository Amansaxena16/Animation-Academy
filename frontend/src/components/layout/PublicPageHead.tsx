import type { ReactNode } from "react";

import { BackButton } from "@/components/ui/BackButton";

/** The top of an inner public page: sits on the page ground under the merged header, with the
 *  same soft azure glow as the home hero, and a "Back to …" pill above the title. */
export function PublicPageHead({
  overline,
  title,
  back = { href: "/", label: "Home" },
  children,
}: {
  overline: string;
  title: string;
  back?: { href: string; label: string };
  /** The intro paragraph. */
  children?: ReactNode;
}) {
  return (
    // Pulled up under the transparent header (73px, 81px from 1024px) so the glow runs behind it.
    <section className="border-line -mt-[73px] border-b bg-[radial-gradient(ellipse_55%_100%_at_18%_0%,var(--glow),transparent_72%)] lg:-mt-[81px]">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-3 px-4 pt-[calc(73px+24px)] pb-12 md:px-6 md:pt-[calc(73px+32px)] md:pb-16 lg:pt-[calc(81px+32px)]">
        <BackButton href={back.href} label={back.label} />
        <span className="type-overline text-brand-ink mt-4">{overline}</span>
        <h1 className="type-display m-0">{title}</h1>
        {children && (
          <p className="type-body-lg text-ink-muted m-0 max-w-[640px]">
            {children}
          </p>
        )}
      </div>
    </section>
  );
}
