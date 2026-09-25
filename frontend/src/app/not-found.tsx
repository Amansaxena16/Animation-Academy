import { Compass } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4 py-10 text-ink">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <Logo />
        <div className="grid size-[72px] place-items-center rounded-full bg-surface-sunken text-ink-muted">
          <Compass className="size-[30px]" aria-hidden />
        </div>
        <div>
          <h1 className="m-0 type-h1">Page not found</h1>
          <p className="mt-2 mb-0 text-ink-muted">
            The page you asked for isn&apos;t here. It may have moved, or the link may be mistyped.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <ButtonLink href="/">Go to Home</ButtonLink>
          <ButtonLink href="/courses" variant="secondary">
            Browse Courses
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
