import { connection } from "next/server";
import { ArrowRight, Phone } from "lucide-react";
import Link from "next/link";

import { HeroArt } from "@/components/home/HeroArt";
import { StatsBand } from "@/components/home/StatsBand";
import { WhyGrid } from "@/components/home/WhyGrid";
import { Announcement } from "@/components/ui/Announcement";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { CourseCard } from "@/components/ui/CourseCard";
import { getAnnouncements, getSite, telHref } from "@/lib/content";
import { getCourse, getCourses } from "@/lib/courses";
import { inr } from "@/lib/format";

function SectionHead({
  overline,
  title,
  action,
}: {
  overline: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <span className="type-overline text-accent-ink">{overline}</span>
        <h2 className="type-display mt-2 mb-0">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export default async function HomePage() {
  await connection(); // request-time: don't fetch the API during the build
  const [site, courses, notices] = await Promise.all([
    getSite(),
    getCourses(),
    getAnnouncements({ limit: 4 }), // upcoming first, then the most recent
  ]);

  const featured = courses.filter((c) => c.featured).slice(0, 6);
  const flagshipCard = courses.find((c) => c.tag === "Flagship");
  const flagship = flagshipCard ? await getCourse(flagshipCard.slug) : null;
  const lowestFee = courses.length
    ? Math.min(...courses.map((c) => c.monthly_fee))
    : null;
  const phone = site.phones[0];

  return (
    <>
      {/* Hero */}
      <section className="border-line bg-surface-raised overflow-hidden border-b">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 pt-12 pb-16 md:px-6 md:pt-20 md:pb-24 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="type-overline text-accent-ink">
              ISO 9001:2000 certified · Nehru Nagar, Kanpur
            </span>
            <h1 className="type-display-xl text-ink mt-4 mb-0 max-w-[620px]">
              {site.hero_headline}
            </h1>
            <p className="type-body-lg text-ink-muted mt-5 mb-0 max-w-[540px]">
              {site.hero_sub}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/courses" size="lg">
                Explore Courses <ArrowRight aria-hidden />
              </ButtonLink>
              <ButtonLink href="/admission" variant="secondary" size="lg">
                Join Animation Academy
              </ButtonLink>
            </div>
            <p className="text-ink-muted mt-6 mb-0 text-sm">
              <b className="text-ink">Monthly fees</b>
              {lowestFee !== null && <> from {inr(lowestFee)}</>} · one-time
              registration {inr(site.registration_fee)}
            </p>
          </div>
          <HeroArt course={flagshipCard} />
        </div>
      </section>

      {site.stats.length > 0 && <StatsBand stats={site.stats} />}

      {/* Featured courses */}
      {featured.length > 0 && (
        <section className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-12 md:px-6 md:py-24">
          <SectionHead
            overline="Courses and fees"
            title="Popular courses"
            action={
              <ButtonLink href="/courses" variant="ghost">
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

      {/* Flagship: the Professional Diploma in Multimedia */}
      {flagship && (
        <section className="bg-navy text-on-navy">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-12 md:px-6 md:py-20 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div className="flex flex-col gap-4">
              <span className="type-overline text-accent">
                Flagship · {flagship.duration_label}
              </span>
              <h2 className="type-display m-0">{flagship.name}</h2>
              <p className="type-body-lg m-0 text-white/80">
                {flagship.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <ButtonLink
                  href={`/admission?course=${flagship.slug}`}
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
            <ol className="m-0 grid list-none gap-3 p-0">
              {flagship.syllabus.map((sem, i) => (
                <li
                  key={sem.title}
                  className="flex items-center gap-4 rounded-md bg-white/7 px-4 py-3"
                >
                  <span className="bg-accent font-display text-on-accent grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <b className="font-display block">
                      {sem.title.replace(/^Sem-[IVX]+ — /, "")}
                    </b>
                    <span className="text-[13px] text-white/70">
                      {sem.tools}
                    </span>
                  </div>
                  <span className="text-accent shrink-0 text-[13px] font-semibold">
                    {sem.duration}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Why */}
      <section className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-12 md:px-6 md:py-24">
        <SectionHead
          overline="Why Animation Academy"
          title="A real lab, a real certificate"
        />
        <WhyGrid />
      </section>

      {/* Updates */}
      {notices.length > 0 && (
        <section className="border-line bg-surface-raised border-y">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-12 md:px-6 md:py-20">
            <SectionHead
              overline="Updates"
              title="What's happening"
              action={
                <ButtonLink href="/updates" variant="ghost">
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
                  Visit the lab at {site.address.split(",")[0]} or call our
                  counsellor. We&apos;ll suggest where to start based on what
                  you already know.
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

      {/* Call to action */}
      <section className="mx-auto max-w-[1200px] px-4 py-12 md:px-6 md:py-24">
        <div className="bg-brand text-on-brand flex flex-col items-start gap-6 rounded-xl px-6 py-10 md:flex-row md:items-center md:justify-between md:px-12">
          <div>
            <h2 className="type-h1 m-0">
              Start with a {inr(site.registration_fee)} registration
            </h2>
            <p className="mt-2 mb-0 max-w-[520px] text-white/85">
              Apply online in a few minutes, or visit us at{" "}
              {site.address.split(",")[0]} to see the lab first.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/admission" variant="accent" size="lg">
              Apply for Admission
            </ButtonLink>
            {phone && (
              <Link
                href={telHref(phone)}
                className="inline-flex h-[50px] items-center gap-2 rounded-md border border-white/50 px-6 text-[15px] font-semibold text-white no-underline hover:bg-white/10"
              >
                <Phone className="size-[18px]" aria-hidden /> {phone}
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
