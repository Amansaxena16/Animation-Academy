"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import { api, ApiError } from "@/lib/api";
import type { ContactRequest } from "@/types/content";

type Values = Required<
  Pick<ContactRequest, "name" | "email" | "phone" | "message">
>;
const EMPTY: Values = { name: "", email: "", phone: "", message: "" };

/** Same rules as the API, checked on blur so people see problems before sending. */
function check(field: keyof Values, value: string): string | null {
  const v = value.trim();
  switch (field) {
    case "name":
      return v.length < 2 ? "Tell us your name so we know who to call." : null;
    case "email":
      return /^\S+@\S+\.\S+$/.test(v)
        ? null
        : "Enter a valid email, e.g. name@example.com";
    case "phone": {
      const digits = v.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
      return v && digits.length !== 10
        ? "Enter a 10-digit mobile number, e.g. 98110 45236."
        : null;
    }
    case "message":
      return v.length < 10
        ? "Write a little more so we can help, at least 10 characters."
        : null;
  }
}

export function ContactForm() {
  const toast = useToast();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>(
    {},
  );
  const [website, setWebsite] = useState(""); // honeypot
  const [failure, setFailure] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const set =
    (field: keyof Values) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    const found = Object.fromEntries(
      (Object.keys(values) as (keyof Values)[]).map((f) => [
        f,
        check(f, values[f]) ?? undefined,
      ]),
    );
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setSending(true);
    setFailure(null);
    try {
      const res = await api<{ detail: string }>("/contact/", {
        method: "POST",
        auth: false,
        body: { ...values, website },
      });
      toast({
        title: "Message sent",
        text: res.detail.replace(/^Message sent\.\s*/, ""),
      });
      setValues(EMPTY);
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

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {failure && <Alert tone="danger">{failure}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" required error={errors.name}>
          {(p) => (
            <Input
              {...p}
              autoComplete="name"
              value={values.name}
              onChange={set("name")}
              onBlur={blur("name")}
            />
          )}
        </Field>
        <Field
          label="Mobile"
          help="So our counsellor can call you."
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
            />
          )}
        </Field>
      </div>
      <Field label="Email" required error={errors.email}>
        {(p) => (
          <Input
            {...p}
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={set("email")}
            onBlur={blur("email")}
            placeholder="name@example.com"
          />
        )}
      </Field>
      <Field label="Message" required error={errors.message}>
        {(p) => (
          <Textarea
            {...p}
            rows={5}
            value={values.message}
            onChange={set("message")}
            onBlur={blur("message")}
            placeholder="e.g. Which DTP batch starts next month?"
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
