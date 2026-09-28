import { connection } from "next/server";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import { StatsBand } from "@/components/home/StatsBand";
import { WhyGrid } from "@/components/home/WhyGrid";
import { Announcement } from "@/components/ui/Announcement";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { applyHref, CourseCard } from "@/components/ui/CourseCard";
import { getAnnouncements, getSite, telHref } from "@/lib/content";
import { getCategories, getCourse, getCourses } from "@/lib/courses";
import { inr } from "@/lib/format";
import { organizationLd } from "@/lib/seo";
import { INSTITUTE } from "@/lib/site";

function SectionHead({
  overline,
  title,
  text,
  action,
}: {
  overline: string;
  title: string;
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-[640px]">
        <span className="type-overline text-brand-ink">{overline}</span>
        <h2 className="type-display mt-2 mb-0">{title}</h2>
        {text && (
          <p className="type-body-lg text-ink-muted mt-3 mb-0">{text}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/** "Learn the tools. Build the work." → the first sentence in azure, the rest in ink. */
function splitHeadline(text: string): [string, string] {
  const i = text.indexOf(". ");
  return i > 0 ? [text.slice(0, i + 1), text.slice(i + 2)] : [text, ""];
}

export default async function HomePage() {
  await connection(); // request-time: don't fetch the API during the build
  const [site, courses, notices, categories] = await Promise.all([
    getSite(),
    getCourses(),
    getAnnouncements({ limit: 4 }), // upcoming first, then the most recent
    getCategories(),
  ]);

  const featured = courses.filter((c) => c.featured).slice(0, 6);
  const flagshipCard = courses.find((c) => c.tag === "Flagship");
  const flagship = flagshipCard ? await getCourse(flagshipCard.slug) : null;
  const lowestFee = courses.length
    ? Math.min(...courses.map((c) => c.monthly_fee))
    : null;
  const phone = site.phones[0];
  const street = site.address.split(",")[0];
  const taught = categories.filter((c) => c.count > 0);
  const [lead, rest] = splitHeadline(site.hero_headline);

  return (
    <>
      <JsonLd data={organizationLd(site)} />
      {/* Hero: pulled up under the transparent header so the glow runs behind it. */}
      <section className="-mt-[73px] bg-[radial-gradient(ellipse_55%_60%_at_50%_40%,var(--glow),transparent_72%)] lg:-mt-[81px]">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center px-4 pt-[calc(73px+56px)] pb-16 text-center md:px-6 md:pb-20 lg:pt-[calc(81px+104px)]">
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
          <p className="text-ink-muted mt-6 mb-0 max-w-[720px] text-lg leading-[30px] md:text-xl md:leading-8">
            {site.hero_sub}
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/courses" size="lg">
              Explore Courses <ArrowRight aria-hidden />
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary" size="lg">
              Talk to a Counsellor
            </ButtonLink>
          </div>
          <p className="text-ink-muted mt-7 mb-0 text-sm">
            <b className="text-ink">Monthly fees</b>
            {lowestFee !== null && <> from {inr(lowestFee)}</>} · one-time
            registration {inr(site.registration_fee)}
          </p>
          {featured.length > 0 && (
            <nav
              aria-label="Popular courses"
              className="mt-9 flex flex-wrap justify-center gap-x-7 gap-y-2"
            >
              {featured.map((c) => (
                <Link
                  key={c.slug}
                  href={`/courses/${c.slug}`}
                  className="text-brand-ink font-medium no-underline hover:underline"
                >
                  {c.name}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </section>

      {site.stats.length > 0 && <StatsBand stats={site.stats} />}

      {/* Featured courses */}
      {featured.length > 0 && (
        <section className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-16 md:px-6 md:py-24">
          <SectionHead
            overline="Courses and fees"
            title="Popular courses"
            text="From computer fundamentals and Tally to an eighteen-month multimedia diploma."
            action={
              <ButtonLink href="/courses" variant="secondary">
                View All {courses.length} Courses <ArrowRight aria-hidden />
              </ButtonLink>
            }
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => (
              <CourseCard
                key={c.slug}
                course={c}
                registrationFee={site.registration_fee}
              />
            ))}
          </div>
        </section>
      )}

      {/* The blue banner */}
      <section className="mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="bg-banner text-on-brand flex flex-col items-start gap-6 rounded-xl px-6 py-10 md:flex-row md:items-center md:justify-between md:px-14 md:py-16">
          <div>
            <h2 className="type-display m-0">
              Start with a {inr(site.registration_fee)} registration
            </h2>
            <p className="type-body-lg mt-3 mb-0 max-w-[560px] text-white/85">
              Admissions are made at the institute office. Visit us at {street}{" "}
              to see the lab first, or talk to our counsellor.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/contact" variant="light" size="lg">
              Talk to a Counsellor
            </ButtonLink>
            {phone && (
              <ButtonLink href={telHref(phone)} variant="inverse" size="lg">
                <Phone aria-hidden /> {phone}
              </ButtonLink>
            )}
          </div>
        </div>
      </section>

      {/* Flagship: the Professional Diploma in Multimedia */}
      {flagship && (
        <section className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-24">
          <div className="border-line bg-surface-raised grid overflow-hidden rounded-xl border lg:grid-cols-[1fr_1.1fr]">
            <div className="bg-banner text-on-brand flex flex-col gap-4 p-6 md:p-10">
              <span className="type-overline text-white/85">
                Flagship · {flagship.duration_label}
              </span>
              <h2 className="type-display m-0">{flagship.name}</h2>
              <p className="type-body-lg m-0 text-white/85">
                {flagship.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <ButtonLink
                  href={applyHref(flagship.slug)}
                  variant="accent"
                  size="lg"
                >
                  Enroll Now
                </ButtonLink>
                <ButtonLink
                  href={`/courses/${flagship.slug}`}
                  variant="inverse"
                  size="lg"
                >
                  See the Syllabus
                </ButtonLink>
              </div>
            </div>
            <ol className="m-0 grid list-none content-center gap-3 p-6 md:p-10">
              {flagship.syllabus.map((sem, i) => (
                <li
                  key={sem.title}
                  className="bg-surface-sunken flex items-center gap-4 rounded-md px-4 py-3"
                >
                  <span className="bg-brand-soft font-display text-brand-ink grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <b className="font-display block">
                      {sem.title.replace(/^Sem-[IVX]+ — /, "")}
                    </b>
                    <span className="text-ink-muted text-[13px]">
                      {sem.tools}
                    </span>
                  </div>
                  <span className="text-brand-ink shrink-0 text-[13px] font-semibold">
                    {sem.duration}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Why */}
      <section className="border-line border-t">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-16 md:px-6 md:py-24">
          <SectionHead
            overline="Why Animation Academy"
            title="A real lab, a real certificate"
          />
          <WhyGrid />
        </div>
      </section>

      {/* About: what used to be the About page */}
      <section id="about" className="border-line border-t">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-4">
            <span className="type-overline text-brand-ink">About us</span>
            <h2 className="type-display m-0">{INSTITUTE.tagline}</h2>
            <p className="type-body-lg text-ink-muted m-0">{site.about}</p>
            <p className="text-ink m-0 text-[17px] leading-7">
              Our courses start at computer fundamentals, typing and MS Office,
              and go through accounting with Tally Prime and GST, print design,
              web design and programming, to an eighteen-month Professional
              Diploma in Multimedia covering 2D animation, video editing, 3D
              modeling in Maya and ZBrush, and compositing.
            </p>
            {taught.length > 0 && (
              <ul className="m-0 mt-2 flex flex-wrap gap-2 p-0">
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
            )}
          </div>

          <Card pad className="flex flex-col gap-4 self-start">
            <h3 className="type-h3 m-0">Visit the institute</h3>
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
        </div>
      </section>

      {/* Updates */}
      {notices.length > 0 && (
        <section className="border-line border-t">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-16 md:px-6 md:py-24">
            <SectionHead
              overline="Updates"
              title="What's happening"
              action={
                <ButtonLink href="/updates" variant="secondary">
                  All Updates <ArrowRight aria-hidden />
                </ButtonLink>
              }
            />
            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
              <Card>
                <CardBody>
                  {notices.map((a) => (
                    <Announcement key={a.id} item={a} />
                  ))}
                </CardBody>
              </Card>
              <Card pad className="flex flex-col gap-4 self-start">
                <h3 className="type-h3 m-0">Choosing a course?</h3>
                <p className="text-ink-muted m-0 text-[15px]">
                  Visit the lab at {street} or call our counsellor. We&apos;ll
                  suggest where to start based on what you already know.
                </p>
                <div className="flex flex-wrap gap-2">
                  {phone && (
                    <ButtonLink
                      href={telHref(phone)}
                      variant="secondary"
                      size="sm"
                    >
                      <Phone aria-hidden /> {phone}
                    </ButtonLink>
                  )}
                  <ButtonLink href="/contact" variant="ghost" size="sm">
                    Send a Message
                  </ButtonLink>
                </div>
              </Card>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
