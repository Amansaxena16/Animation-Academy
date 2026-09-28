"use client";

import { CircleCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { api, ApiError } from "@/lib/api";
import { onEnquire } from "@/lib/enquire";

type Values = { name: string; phone: string; course: string; message: string };
const EMPTY: Values = { name: "", phone: "", course: "", message: "" };

/** Same rules as the API, checked on blur so people see problems before sending. */
function check(field: keyof Values, value: string): string | null {
  const v = value.trim();
  if (field === "name")
    return v.length < 2 ? "Tell us your name so we know who to call." : null;
  if (field === "phone") {
    const digits = v.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    return /^[6-9]\d{9}$/.test(digits)
      ? null
      : "Enter a 10-digit mobile number, e.g. 98110 45236.";
  }
  return null; // course and message are optional
}

/** "Send us a message": the office calls back. Name and phone are required; the course is
 *  pre-filled when a visitor presses Enquire on a course card. */
export function MessageForm({
  courses,
}: {
  courses: { slug: string; name: string }[];
}) {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>(
    {},
  );
  const [website, setWebsite] = useState(""); // honeypot
  const [failure, setFailure] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(
    () =>
      onEnquire((slug) => {
        setSent(false);
        setValues((v) => ({ ...v, course: slug }));
        // After the jump to #admission, put the cursor in the first field.
        setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 400);
      }),
    [],
  );

  const set =
    (field: keyof Values) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setValues((v) => ({ ...v, [field]: e.target.value }));
      if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
    };
  const blur = (field: keyof Values) => () =>
    setErrors((er) => ({
      ...er,
      [field]: check(field, values[field]) ?? undefined,
    }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = {
      name: check("name", values.name) ?? undefined,
      phone: check("phone", values.phone) ?? undefined,
    };
    setErrors(found);
    if (found.name || found.phone) return;

    setSending(true);
    setFailure(null);
    try {
      await api("/contact/", {
        method: "POST",
        auth: false,
        body: {
          name: values.name,
          phone: values.phone,
          course: values.course || null,
          message: values.message,
          website,
        },
      });
      setValues(EMPTY);
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errors).length) {
        setErrors(
          Object.fromEntries(
            Object.entries(err.errors).map(([k, v]) => [k, v[0]]),
          ),
        );
      } else if (err instanceof ApiError && err.status === 429) {
        setFailure(
          "You've sent several messages already. Please call us instead, or try again later.",
        );
      } else {
        setFailure(
          "Your message didn't go through. Check your connection and try again.",
        );
      }
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-start gap-4 py-6">
        <span className="bg-success-soft text-success-ink grid size-12 place-items-center rounded-full">
          <CircleCheck className="size-6" aria-hidden />
        </span>
        <div>
          <h3 className="type-h3 m-0">Message sent</h3>
          <p className="text-ink-muted mt-1 mb-0">
            Thanks — the office will call you back within a working day.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {failure && <Alert tone="danger">{failure}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" required error={errors.name}>
          {(p) => (
            <Input
              {...p}
              ref={nameRef}
              autoComplete="name"
              value={values.name}
              onChange={set("name")}
              onBlur={blur("name")}
            />
          )}
        </Field>
        <Field
          label="Mobile"
          required
          help="The office calls you back on this number."
          error={errors.phone}
        >
          {(p) => (
            <Input
              {...p}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={values.phone}
              onChange={set("phone")}
              onBlur={blur("phone")}
              placeholder="98110 45236"
            />
          )}
        </Field>
      </div>
      <Field label="Course you're interested in" error={errors.course}>
        {(p) => (
          <Select {...p} value={values.course} onChange={set("course")}>
            <option value="">Not sure yet</option>
            {courses.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Message" error={errors.message}>
        {(p) => (
          <Textarea
            {...p}
            rows={4}
            value={values.message}
            onChange={set("message")}
            placeholder="e.g. When does the next batch start?"
          />
        )}
      </Field>
      {/* Honeypot: hidden from people, filled in by bots. */}
      <div
        aria-hidden
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
      >
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>
      <Button type="submit" size="lg" loading={sending} className="self-start">
        Send Message
      </Button>
    </form>
  );
}
