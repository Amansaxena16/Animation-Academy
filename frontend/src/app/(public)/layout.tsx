import { Wrench } from "lucide-react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { ReactNode } from "react";

import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Logo } from "@/components/ui/Logo";
import { getSite, telHref } from "@/lib/content";

export default async function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection(); // render per request; the settings themselves are cached (lib/content.ts)
  const [site, jar] = await Promise.all([getSite(), cookies()]);

  if (site.maintenance_mode) {
    return (
      <main className="bg-surface grid min-h-screen place-items-center px-4 py-10">
        <div className="flex max-w-md flex-col items-center gap-6 text-center">
          <Logo />
          <span className="bg-accent-soft text-accent-ink grid size-[72px] place-items-center rounded-full">
            <Wrench className="size-[30px]" aria-hidden />
          </span>
          <div>
            <h1 className="type-h1 m-0">We&apos;ll be back shortly</h1>
            <p className="text-ink-muted mt-2 mb-0">
              The website is being updated. The institute is open as usual
              {site.phones[0] && (
                <>
                  {" "}
                  — call{" "}
                  <a
                    href={telHref(site.phones[0])}
                    className="text-navy-ink font-semibold"
                  >
                    {site.phones[0]}
                  </a>
                </>
              )}
              .
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="bg-navy text-on-navy sr-only z-100 rounded-md px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <PublicHeader role={jar.get("aa_session")?.value} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <PublicFooter site={site} />
    </div>
  );
}
