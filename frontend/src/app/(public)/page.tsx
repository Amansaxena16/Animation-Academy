import { connection } from "next/server";
import {
  ArrowRight,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  Phone,
} from "lucide-react";

import { CourseSection } from "@/components/courses/CourseSection";
import { MessageForm } from "@/components/home/MessageForm";
import { StatsBand } from "@/components/home/StatsBand";
import { WhyGrid } from "@/components/home/WhyGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getAnnouncements, getSite, telHref } from "@/lib/content";
import { getCategories, getCourse, getCourses } from "@/lib/courses";
import { formatDateShort, inr } from "@/lib/format";
import { courseLd, organizationLd } from "@/lib/seo";
import { INSTITUTE } from "@/lib/site";
import type { CourseDetail } from "@/types/course";

function SectionHead({
  overline,
  title,
  text,
}: {
  overline: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="max-w-[640px]">
      <span className="type-overline text-brand-ink">{overline}</span>
      <h2 className="type-display mt-2 mb-0">{title}</h2>
      {text && <p className="type-body-lg text-ink-muted mt-3 mb-0">{text}</p>}
    </div>
  );
}

/** "Learn the tools. Build the work." → the first sentence in azure, the rest in ink. */
function splitHeadline(text: string): [string, string] {
  const i = text.indexOf(". ");
  return i > 0 ? [text.slice(0, i + 1), text.slice(i + 2)] : [text, ""];
}

const whatsappHref = (phone: string) =>
  `https://wa.me/91${phone.replace(/\D/g, "").slice(-10)}`;

const STEPS = [
  "Call us, or send a message with the form.",
  "Visit the institute with a passport-size photo and your marksheets.",
  "Pay the registration and the first month's fee at the office.",
  "The office enrolls you and gives you your student login.",
];

/** The whole public website on one page: courses, about, admission with the message form,
 *  and contact. Section ids are the header's anchors. */
export default async function HomePage() {
  await connection(); // request-time: don't fetch the API during the build
  const [site, list, notices, categories] = await Promise.all([
    getSite(),
    getCourses(),
    getAnnouncements({ limit: 2 }), // upcoming first, then the most recent
    getCategories(),
  ]);
  // Syllabus for every card; each course is cached, and the API sits in the same container.
  const courses = (
    await Promise.all(list.map((c) => getCourse(c.slug)))
  ).filter((c): c is CourseDetail => c !== null);

  const lowestFee = courses.length
    ? Math.min(...courses.map((c) => c.monthly_fee))
    : null;
  const phone = site.phones[0];
  const [lead, rest] = splitHeadline(site.hero_headline);
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`;

  return (
    <>
      <JsonLd data={organizationLd(site)} />
      {courses.map((c) => (
        <JsonLd key={c.slug} data={courseLd(c)} />
      ))}

      {/* Hero: pulled up under the transparent header so the glow runs behind it. */}
      <section className="-mt-[73px] bg-[radial-gradient(ellipse_55%_60%_at_50%_40%,var(--glow),transparent_72%)] lg:-mt-[81px]">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center px-4 pt-[calc(73px+48px)] pb-12 text-center md:px-6 md:pb-16 lg:pt-[calc(81px+80px)]">
          <span className="type-overline text-brand-ink">
            ISO 9001:2000 certified · Nehru Nagar, Kanpur
          </span>
          <h1 className="type-display-xl mt-5 mb-0 max-w-[960px]">
            {rest ? (
              <>
                <span className="text-brand-ink block">{lead}</span>
                <span className="text-ink">{rest}</span>
              </>
            ) : (
              <span className="text-ink">{lead}</span>
            )}
          </h1>
          <p className="text-ink-muted mt-6 mb-0 max-w-[680px] text-lg leading-[30px]">
            {site.hero_sub}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="#courses" size="lg">
              View Courses <ArrowRight aria-hidden />
            </ButtonLink>
            {phone && (
              <ButtonLink href={telHref(phone)} variant="secondary" size="lg">
                <Phone aria-hidden /> Call {phone}
              </ButtonLink>
            )}
          </div>
          <p className="text-ink-muted mt-6 mb-0 text-sm">
            <b className="text-ink">Monthly fees</b>
            {lowestFee !== null && <> from {inr(lowestFee)}</>} · one-time
            registration {inr(site.registration_fee)}
          </p>
        </div>
      </section>

      {/* Latest updates: a slim strip, newest first. */}
      {notices.length > 0 && (
        <section
          id="updates"
          aria-label="Latest updates"
          className="mx-auto max-w-[1200px] px-4 md:px-6"
        >
          <ul className="border-line bg-surface-raised m-0 flex list-none flex-col divide-y divide-[var(--line)] rounded-lg border p-0">
            {notices.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm md:px-5"
              >
                <Megaphone
                  className="text-accent-ink size-4 shrink-0"
                  aria-hidden
                />
                <b className="text-ink">{a.title}</b>
                <span className="text-ink-muted">{a.text}</span>
                <span className="text-ink-muted ml-auto text-[13px] whitespace-nowrap">
                  {formatDateShort(a.date)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {site.stats.length > 0 && <StatsBand stats={site.stats} />}

      {/* Courses */}
      <section id="courses" className="scroll-mt-20">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-16 md:px-6 md:py-20">
          <SectionHead
            overline="Courses and fees"
            title={`All ${courses.length} courses`}
            text="Fees are paid month by month. Open a course to see its syllabus."
          />
          <CourseSection
            courses={courses}
            categories={categories}
            registrationFee={site.registration_fee}
          />
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-line scroll-mt-20 border-t">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-16 md:px-6 md:py-20">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-end">
            <SectionHead overline="About us" title={INSTITUTE.tagline} />
            <p className="type-body-lg text-ink-muted m-0">{site.about}</p>
          </div>
          <WhyGrid />
        </div>
      </section>

      {/* Admission: the steps, and the message form */}
      <section id="admission" className="border-line scroll-mt-20 border-t">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-16 md:px-6 md:py-20 lg:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col gap-6">
            <SectionHead
              overline="Admission"
              title="How to join"
              text="Admissions are made at the institute office."
            />
            <ol className="m-0 flex list-none flex-col gap-4 p-0">
              {STEPS.map((step, i) => (
                <li key={step} className="flex gap-4">
                  <span className="bg-brand-soft font-display text-brand-ink grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold">
                    {i + 1}
                  </span>
                  <span className="text-ink pt-1.5">
                    {i === 2
                      ? `Pay the ${inr(site.registration_fee)} registration and the first month's fee at the office.`
                      : step}
                  </span>
                </li>
              ))}
            </ol>
            <p className="text-ink-muted m-0 text-sm">
              No refund after admission is confirmed.
            </p>
          </div>
          <Card pad className="self-start">
            <h3 className="type-h3 mt-0 mb-1">Send us a message</h3>
            <p className="text-ink-muted mt-0 mb-5 text-sm">
              Ask about fees, batches or which course suits you.
            </p>
            <MessageForm
              courses={courses.map((c) => ({ slug: c.slug, name: c.name }))}
            />
          </Card>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-line scroll-mt-20 border-t">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-16 md:px-6 md:py-20">
          <SectionHead overline="Contact" title="Visit or call us" />
          <div className="grid gap-6 md:grid-cols-3">
            <Card pad className="flex flex-col gap-3">
              <MapPin className="text-brand-ink size-6" aria-hidden />
              <h3 className="type-h3 m-0">Visit</h3>
              <p className="text-ink-muted m-0">{site.address}</p>
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-ink mt-auto font-semibold"
              >
                Open in Google Maps
              </a>
            </Card>
            <Card pad className="flex flex-col gap-3">
              <Phone className="text-brand-ink size-6" aria-hidden />
              <h3 className="type-h3 m-0">Call</h3>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {site.phones.map((p) => (
                  <li key={p}>
                    <a
                      href={telHref(p)}
                      className="text-ink text-lg font-semibold no-underline hover:underline"
                    >
                      {p}
                    </a>
                  </li>
                ))}
              </ul>
              {phone && (
                <a
                  href={whatsappHref(phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-ink mt-auto inline-flex items-center gap-2 font-semibold"
                >
                  <MessageCircle className="size-4" aria-hidden /> Message on
                  WhatsApp
                </a>
              )}
            </Card>
            <Card pad className="flex flex-col gap-3">
              <Mail className="text-brand-ink size-6" aria-hidden />
              <h3 className="type-h3 m-0">Email</h3>
              <a
                href={`mailto:${site.email}`}
                className="text-ink font-semibold break-all no-underline hover:underline"
              >
                {site.email}
              </a>
              <a
                href="#admission"
                className="text-brand-ink mt-auto font-semibold"
              >
                Or send a message
              </a>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
