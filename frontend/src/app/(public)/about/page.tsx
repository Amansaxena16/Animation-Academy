import { Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";

import { WhyGrid } from "@/components/home/WhyGrid";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSite, telHref } from "@/lib/content";
import { getCategories } from "@/lib/courses";
import { INSTITUTE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Animation Academy is an ISO 9001:2000 certified multimedia institute run by IOCSGT Computer Education in Nehru Nagar, Kanpur.",
};

export default async function AboutPage() {
  const [site, categories] = await Promise.all([getSite(), getCategories()]);
  const taught = categories.filter((c) => c.count > 0);

  return (
    <>
      <section className="border-line bg-surface-raised border-b">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-6 md:py-16">
          <span className="type-overline text-accent-ink">About us</span>
          <h1 className="type-display mt-3 mb-0">{INSTITUTE.tagline}</h1>
          <p className="type-body-lg text-ink-muted mt-4 mb-0 max-w-[680px]">
            {site.about}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-10 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-[1.4fr_1fr]">
        <div className="text-ink flex flex-col gap-4 text-[17px] leading-7">
          <h2 className="type-h2 m-0">Who we are</h2>
          <p className="m-0">
            Animation Academy is run by <b>{INSTITUTE.runBy}</b> (
            {INSTITUTE.runByFull}) from {site.address}. We teach on real
            machines in our own lab, in small batches, so every student has a
            computer of their own for the whole class.
          </p>
          <p className="m-0">
            Our courses start at computer fundamentals, typing and MS Office,
            and go through accounting with Tally Prime and GST, print design,
            web design and programming, to an eighteen-month Professional
            Diploma in Multimedia covering 2D animation, video editing, 3D
            modeling in Maya and ZBrush, and compositing.
          </p>
          <p className="m-0">
            Fees are paid month by month after a one-time registration of ₹
            {site.registration_fee}, and every certificate carries an ID that an
            employer can check on this website.
          </p>
          {taught.length > 0 && (
            <>
              <h2 className="type-h2 mt-4 mb-0">What we teach</h2>
              <ul className="m-0 flex flex-wrap gap-2 p-0">
                {taught.map((c) => (
                  <li key={c.value} className="list-none">
                    <ButtonLink
                      href={`/courses?category=${encodeURIComponent(c.value)}`}
                      variant="secondary"
                      size="sm"
                    >
                      {c.label} · {c.count}
                    </ButtonLink>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <Card pad className="flex flex-col gap-4 self-start">
          <h2 className="type-h3 m-0">Visit the institute</h2>
          <address className="[&_svg]:text-brand-ink flex flex-col gap-3 text-[15px] not-italic [&_svg]:mt-1 [&_svg]:size-[18px] [&_svg]:shrink-0">
            <span className="flex gap-3">
              <MapPin aria-hidden />
              {site.address}
            </span>
            {site.phones.map((p) => (
              <a
                key={p}
                href={telHref(p)}
                className="text-ink hover:text-brand-ink flex gap-3 no-underline"
              >
                <Phone aria-hidden />
                {p}
              </a>
            ))}
            <a
              href={`mailto:${site.email}`}
              className="text-ink hover:text-brand-ink flex gap-3 no-underline"
            >
              <Mail aria-hidden />
              {site.email}
            </a>
          </address>
          <ButtonLink href="/contact" variant="secondary">
            Send Us a Message
          </ButtonLink>
        </Card>
      </section>

      <section className="border-line bg-surface-raised border-t">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-12 md:px-6 md:py-16">
          <div>
            <span className="type-overline text-accent-ink">
              Why Animation Academy
            </span>
            <h2 className="type-display mt-2 mb-0">What you can count on</h2>
          </div>
          <WhyGrid />
        </div>
      </section>
    </>
  );
}
