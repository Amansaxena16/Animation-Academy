import { ArrowRight } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import { SITE } from "@/lib/site";

// Placeholder hero. The full home page (stats, featured courses, updates) is Phase 4.
export default function HomePage() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-12 md:px-6 md:py-24">
      <span className="type-overline text-accent-ink">ISO 9001:2000 certified · Nehru Nagar, Kanpur</span>
      <h1 className="mt-4 mb-0 max-w-3xl type-display-xl text-ink">Learn the tools. Build the work.</h1>
      <p className="mt-5 mb-0 max-w-[540px] type-body-lg text-ink-muted">
        An ISO 9001:2000 certified multimedia institute in Nehru Nagar, Kanpur — computer, accounting, design and
        animation courses taught on real machines, from typing to an eighteen-month multimedia diploma.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/courses" size="lg">
          Explore Courses <ArrowRight aria-hidden />
        </ButtonLink>
        <ButtonLink href="/admission" variant="secondary" size="lg">
          Join Animation Academy
        </ButtonLink>
      </div>
      <p className="mt-6 text-sm text-ink-muted">
        <b className="text-ink">Monthly fees</b> from ₹700 · one-time registration ₹{SITE.registrationFee}
      </p>
    </section>
  );
}
