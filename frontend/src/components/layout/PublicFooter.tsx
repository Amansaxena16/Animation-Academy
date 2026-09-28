import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/ui/Logo";
import { telHref } from "@/lib/content";
import { INSTITUTE, PUBLIC_NAV } from "@/lib/site";
import type { Site } from "@/types/content";

const linkClass = "text-ink-muted no-underline hover:text-ink hover:underline";

/** A bordered card on the page ground, then the name as a large faded wordmark. */
export function PublicFooter({ site }: { site: Site }) {
  return (
    <footer className="border-line overflow-hidden border-t pt-16 md:pt-20">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="border-line bg-surface-raised rounded-xl border p-6 md:p-10">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div className="flex flex-col gap-4">
              <Logo size="md" />
              <p className="text-ink-muted m-0 max-w-sm text-sm leading-[22px]">
                {INSTITUTE.tagline}, run by {INSTITUTE.runBy}. Small batches, a
                machine for every student, and certificates carrying a
                verifiable ID.
              </p>
            </div>
            <nav aria-label="Footer">
              <h2 className="type-label text-ink m-0 mb-3">Explore</h2>
              <ul className="m-0 grid list-none gap-2 p-0 text-sm">
                {PUBLIC_NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={linkClass}>
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/verify" className={linkClass}>
                    Verify a Certificate
                  </Link>
                </li>
              </ul>
            </nav>
            <address className="[&_svg]:text-brand-ink flex flex-col gap-3 text-sm not-italic [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0">
              <h2 className="type-label text-ink m-0">Visit or call</h2>
              <span className="text-ink-muted flex gap-2.5">
                <MapPin aria-hidden />
                {site.address}
              </span>
              {site.phones.length > 0 && (
                <span className="text-ink-muted flex gap-2.5">
                  <Phone aria-hidden />
                  <span>
                    {site.phones.map((p, i) => (
                      <span key={p}>
                        {i > 0 && ", "}
                        <a href={telHref(p)} className={linkClass}>
                          {p}
                        </a>
                      </span>
                    ))}
                  </span>
                </span>
              )}
              <span className="text-ink-muted flex gap-2.5">
                <Mail aria-hidden />
                <a href={`mailto:${site.email}`} className={linkClass}>
                  {site.email}
                </a>
              </span>
            </address>
          </div>
          <p className="border-line text-ink-muted mt-10 mb-0 border-t pt-5 text-[13px]">
            © {new Date().getFullYear()} {INSTITUTE.runBy}. All rights reserved.
          </p>
        </div>
      </div>
      {/* Decorative: CSS-generated, so it is not text for screen readers or contrast checks. */}
      <div
        aria-hidden
        className="font-display text-brand/10 dark:text-brand/20 mx-auto max-w-[1280px] pt-10 text-center text-[clamp(44px,10.4vw,136px)] leading-none font-bold tracking-[-0.045em] whitespace-nowrap select-none before:-mb-[0.18em] before:block before:content-['Animation_Academy'] md:pt-14"
      />
    </footer>
  );
}
