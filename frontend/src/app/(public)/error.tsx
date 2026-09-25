"use client";

import { RefreshCw } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FALLBACK_CONTACT } from "@/lib/site";

/** Shown when a public page can't load its data (e.g. the API is unreachable). */
export default function PublicError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6">
      <EmptyState
        icon={<RefreshCw />}
        title="This page didn't load"
        text={`Please try again in a moment. If it keeps happening, call us on ${FALLBACK_CONTACT.phones[0]}.`}
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => retry()}>Try Again</Button>
            <ButtonLink href="/" variant="secondary">
              Go to Home
            </ButtonLink>
          </div>
        }
      />
    </div>
  );
}
