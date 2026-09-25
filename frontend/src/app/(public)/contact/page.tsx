import { Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";

import { Card } from "@/components/ui/Card";
import { getSite, telHref } from "@/lib/content";

import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Call, email or visit Animation Academy at Nehru Nagar, Kanpur, or send us a message.",
};

export default async function ContactPage() {
  const site = await getSite();
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Animation Academy, ${site.address}`)}`;

  return (
    <>
      <section className="border-line bg-surface-raised border-b">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-6 md:py-16">
          <span className="type-overline text-accent-ink">Contact</span>
          <h1 className="type-display mt-3 mb-0">Talk to us</h1>
          <p className="type-body-lg text-ink-muted mt-4 mb-0 max-w-[620px]">
            Not sure which course fits? Call, visit the lab, or send a message
            and our counsellor will call you back.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-8 px-4 py-10 md:px-6 md:py-14 lg:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-col gap-4">
          {site.phones.length > 0 && (
            <Card pad className="flex gap-4">
              <span className="bg-brand-soft text-brand-ink grid size-11 shrink-0 place-items-center rounded-md">
                <Phone className="size-5" aria-hidden />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="type-h3 m-0">Call</h2>
                {site.phones.map((p) => (
                  <a
                    key={p}
                    href={telHref(p)}
                    className="text-ink hover:text-brand-ink text-[17px] font-semibold no-underline"
                  >
                    {p}
                  </a>
                ))}
              </div>
            </Card>
          )}
          <Card pad className="flex gap-4">
            <span className="bg-brand-soft text-brand-ink grid size-11 shrink-0 place-items-center rounded-md">
              <MapPin className="size-5" aria-hidden />
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="type-h3 m-0">Visit</h2>
              <address className="text-ink not-italic">{site.address}</address>
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-navy-ink text-sm font-semibold"
              >
                Open in Google Maps
              </a>
            </div>
          </Card>
          <Card pad className="flex gap-4">
            <span className="bg-brand-soft text-brand-ink grid size-11 shrink-0 place-items-center rounded-md">
              <Mail className="size-5" aria-hidden />
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="type-h3 m-0">Email</h2>
              <a
                href={`mailto:${site.email}`}
                className="text-ink hover:text-brand-ink no-underline"
              >
                {site.email}
              </a>
            </div>
          </Card>
        </div>
        <Card pad>
          <h2 className="type-h2 m-0">Send a message</h2>
          <p className="text-ink-muted mt-1 mb-6 text-sm">
            We reply by phone within one working day.
          </p>
          <ContactForm />
        </Card>
      </section>
    </>
  );
}
