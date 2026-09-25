import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

// Each variant sets its own border colour: a shared border-transparent would override them.
const VARIANTS = {
  /** Azure. One per view: the main action. */
  primary: "border-transparent bg-brand text-on-brand hover:bg-brand-deep",
  /** Navy. An equally strong alternative, e.g. Download Prospectus. */
  navy: "border-transparent bg-navy text-on-navy hover:bg-navy-deep",
  /** Orange. Only Enroll Now and fee payment. */
  accent: "border-transparent bg-accent text-on-accent hover:shadow-md",
  secondary: "bg-surface-raised text-ink border-line-strong hover:border-ink",
  ghost: "border-transparent bg-transparent text-navy-ink hover:bg-navy-soft",
  /** Always behind a confirmation Modal. */
  danger: "border-transparent bg-danger text-white hover:brightness-90",
  /** On navy bands. */
  inverse: "bg-transparent text-on-navy border-white/50 hover:bg-white/10 hover:border-white",
} as const;

const SIZES = {
  sm: "h-[34px] px-3 text-[13px]",
  md: "h-[42px] px-[18px] text-sm",
  lg: "h-[50px] px-6 text-[15px]",
  icon: "size-[38px] p-0",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

interface StyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
}

export function buttonClasses({ variant = "primary", size = "md", block, loading }: StyleProps = {}) {
  return cn(
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border",
    "font-sans font-semibold leading-5 no-underline transition-[background,border-color,color,transform,box-shadow,filter] duration-150",
    "active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    "[&_svg]:size-[18px] [&_svg]:shrink-0",
    VARIANTS[variant],
    SIZES[size],
    block && "w-full",
    loading && "pointer-events-none !text-transparent",
  );
}

function Spinner({ variant }: { variant: ButtonVariant }) {
  const dark = variant === "secondary" || variant === "ghost" || variant === "accent";
  return (
    <span
      aria-hidden
      className={cn(
        "absolute size-[18px] animate-spin-fast rounded-full border-2 border-b-transparent border-l-transparent",
        dark ? "border-t-ink border-r-ink" : "border-t-on-brand border-r-on-brand",
      )}
    />
  );
}

type ButtonProps = ComponentProps<"button"> & StyleProps;

export function Button({ variant, size, block, loading, className, children, type, ...rest }: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn(buttonClasses({ variant, size, block, loading }), className)}
      aria-busy={loading || undefined}
      {...rest}
    >
      {children}
      {loading && <Spinner variant={variant ?? "primary"} />}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & Omit<StyleProps, "loading">;

/** A link that looks like a button (navigation, not actions). */
export function ButtonLink({ variant, size, block, className, ...rest }: ButtonLinkProps) {
  return <Link className={cn(buttonClasses({ variant, size, block }), className)} {...rest} />;
}
