"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";

/** Certificate IDs look like AA-2026-000123. */
const PATTERN = /^AA-\d{4}-\d{6}$/;

export function VerifyForm({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = code.trim().toUpperCase().replace(/\s+/g, "");
    if (!PATTERN.test(value)) {
      setError("Enter the ID printed on the certificate, e.g. AA-2026-000123.");
      return;
    }
    setError(null);
    setBusy(true);
    router.push(`/verify/${value}`);
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
    >
      <Field label="Certificate ID" error={error} className="flex-1">
        {(p) => (
          <Input
            {...p}
            icon={<Search />}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setBusy(false);
            }}
            placeholder="AA-2026-000123"
            autoComplete="off"
            spellCheck={false}
            className="font-mono uppercase"
          />
        )}
      </Field>
      <Button type="submit" size="lg" loading={busy} className="sm:mt-[26px]">
        Verify
      </Button>
    </form>
  );
}
