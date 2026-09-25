"use client";

/* eslint-disable @next/next/no-img-element -- local object-URL preview of the chosen photo */
import { ImagePlus } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useId, useState } from "react";

import { cn } from "@/lib/cn";

const control =
  "w-full rounded-md border border-line-strong bg-surface-raised text-[15px] leading-6 text-ink transition-[border-color,box-shadow] duration-150 " +
  "placeholder:text-ink-muted placeholder:opacity-80 hover:border-ink-muted " +
  "focus:border-focus focus:shadow-[0_0_0_3px_var(--navy-soft)] focus:outline-none " +
  "aria-invalid:border-danger aria-invalid:focus:shadow-[0_0_0_3px_var(--danger-soft)] " +
  "disabled:cursor-not-allowed disabled:opacity-50";

interface FieldProps {
  label: ReactNode;
  required?: boolean;
  /** Helper text; replaced by the error when there is one. */
  help?: ReactNode;
  error?: string | null;
  /** Show the success state ("Looks good"). */
  valid?: boolean;
  className?: string;
  /** Receives the id and aria props to spread onto the control. */
  children: (props: { id: string; "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode;
}

/** Label, control and helper/validation text stacked with a 6px gap. */
export function Field({ label, required, help, error, valid, className, children }: FieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const message = error || help;
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm leading-5 font-semibold text-ink">
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-danger-ink">
            *
          </span>
        )}
      </label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": message ? helpId : undefined,
      })}
      {message && (
        <span
          id={helpId}
          className={cn(
            "text-[13px] leading-[18px]",
            error ? "text-danger-ink" : valid ? "text-success-ink" : "text-ink-muted",
          )}
        >
          {message}
        </span>
      )}
    </div>
  );
}

interface InputProps extends ComponentProps<"input"> {
  /** A leading icon, e.g. <Search />. */
  icon?: ReactNode;
  valid?: boolean;
}

export function Input({ icon, valid, className, ...rest }: InputProps) {
  const input = (
    <input
      className={cn(control, "h-11 px-3.5", Boolean(icon) && "pl-10", valid && "border-success", className)}
      {...rest}
    />
  );
  if (!icon) return input;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-[13px] -translate-y-1/2 text-ink-muted [&_svg]:size-[18px]">
        {icon}
      </span>
      {input}
    </div>
  );
}

export function Select({ className, children, ...rest }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        control,
        "h-11 appearance-none bg-no-repeat pr-9 pl-3.5",
        "bg-[linear-gradient(45deg,transparent_50%,var(--ink-muted)_50%),linear-gradient(135deg,var(--ink-muted)_50%,transparent_50%)]",
        "bg-[position:calc(100%-18px)_19px,calc(100%-13px)_19px] bg-[size:5px_5px]",
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-[104px] resize-y px-3.5 py-2.5", className)} {...rest} />;
}

export function Checkbox({ label, className, ...rest }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2.5 text-sm", className)}>
      <input type="checkbox" className="m-0 size-[18px] accent-brand" {...rest} />
      <span>{label}</span>
    </label>
  );
}

/** A selectable option card (e.g. choosing a course). */
export function RadioCard({ children, className, ...rest }: ComponentProps<"input"> & { children: ReactNode }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border border-line-strong bg-surface-raised px-4 py-3.5",
        "transition-[border-color,background] duration-150 hover:border-ink-muted",
        "has-checked:border-brand has-checked:bg-brand-soft has-checked:shadow-[inset_0_0_0_1px_var(--brand)]",
        className,
      )}
    >
      <input type="radio" className="mt-1 accent-brand" {...rest} />
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );
}

interface PhotoUploadProps {
  value?: File | null;
  /** An existing photo URL, shown until a new file is picked. */
  currentUrl?: string | null;
  onChange: (file: File | null) => void;
  /** JPEG or PNG, at most 2 MB (PROJECT_GUIDE §8). */
  maxBytes?: number;
  error?: string | null;
}

export function PhotoUpload({ value, currentUrl, onChange, maxBytes = 2 * 1024 * 1024, error }: PhotoUploadProps) {
  const id = useId();
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Free the last object URL when the component goes away.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const shown = (value && preview) || currentUrl;
  const message = error ?? localError;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cn(
          "flex items-center gap-4 rounded-md border-[1.5px] border-dashed bg-surface-sunken p-4",
          message ? "border-danger" : "border-line-strong",
        )}
      >
        <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-md bg-surface-raised text-ink-muted">
          {shown ? <img src={shown} alt="Selected photo" className="size-full object-cover" /> : <ImagePlus className="size-7" />}
        </span>
        <div className="flex flex-col gap-1">
          <label htmlFor={id} className="cursor-pointer text-sm font-semibold text-navy-ink underline-offset-2 hover:underline">
            {shown ? "Change photo" : "Upload photo"}
          </label>
          <span className="text-[13px] text-ink-muted">Passport size, JPEG or PNG, up to 2 MB.</span>
          <input
            id={id}
            type="file"
            accept="image/jpeg,image/png"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              if (file && !["image/jpeg", "image/png"].includes(file.type)) {
                setLocalError("Choose a JPEG or PNG image.");
                return;
              }
              if (file && file.size > maxBytes) {
                setLocalError("The photo must be 2 MB or smaller.");
                return;
              }
              setLocalError(null);
              setPreview(file ? URL.createObjectURL(file) : null);
              onChange(file);
            }}
          />
        </div>
      </div>
      {message && <span className="text-[13px] leading-[18px] text-danger-ink">{message}</span>}
    </div>
  );
}
