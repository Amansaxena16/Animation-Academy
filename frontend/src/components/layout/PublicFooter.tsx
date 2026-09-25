import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/ui/Logo";
import { telHref } from "@/lib/content";
import { INSTITUTE, PUBLIC_NAV } from "@/lib/site";
import type { Site } from "@/types/content";

export function PublicFooter({ site }: { site: Site }) {
  return (
    <footer className="bg-navy-deep text-on-navy">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:px-6">
        <div className="flex flex-col gap-4">
          <Logo size="sm" tone="inverse" />
          <p className="m-0 max-w-sm text-sm leading-[22px] text-white/75">
            {INSTITUTE.tagline}, run by {INSTITUTE.runBy}. Small batches, a
            machine for every student, and certificates carrying a verifiable
            ID.
          </p>
        </div>
        <nav aria-label="Footer">
          <h2 className="type-overline m-0 mb-3 text-white/60">Explore</h2>
          <ul className="m-0 grid list-none gap-2 p-0 text-sm">
            {PUBLIC_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-white/85 no-underline hover:text-white hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/verify"
                className="text-white/85 no-underline hover:text-white hover:underline"
              >
                Verify a Certificate
              </Link>
            </li>
          </ul>
        </nav>
        <address className="[&_svg]:text-accent flex flex-col gap-3 text-sm not-italic [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0">
          <h2 className="type-overline m-0 text-white/60">Visit or call</h2>
          <span className="flex gap-2.5 text-white/85">
            <MapPin aria-hidden />
            {site.address}
          </span>
          {site.phones.length > 0 && (
            <span className="flex gap-2.5 text-white/85">
              <Phone aria-hidden />
              <span>
                {site.phones.map((p, i) => (
                  <span key={p}>
                    {i > 0 && ", "}
                    <a
                      href={telHref(p)}
                      className="text-inherit no-underline hover:underline"
                    >
                      {p}
                    </a>
                  </span>
                ))}
              </span>
            </span>
          )}
          <span className="flex gap-2.5 text-white/85">
            <Mail aria-hidden />
            <a
              href={`mailto:${site.email}`}
              className="text-inherit no-underline hover:underline"
            >
              {site.email}
            </a>
          </span>
        </address>
      </div>
      <div className="border-t border-white/10">
        <p className="m-0 mx-auto max-w-[1200px] px-4 py-4 text-[13px] text-white/60 md:px-6">
          © {new Date().getFullYear()} {INSTITUTE.runBy}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
