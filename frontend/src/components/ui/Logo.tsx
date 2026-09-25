import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/cn";

// The institute's two files, side by side, never redrawn (PROJECT_GUIDE §6).
const MARK = { src: "/brand/aa-mark.png", w: 253, h: 237 };
const TYPE = { w: 1184, h: 227 };
const HEIGHTS = {
  sm: { mark: 32, type: 25, gap: "gap-2" },
  md: { mark: 42, type: 34, gap: "gap-2.5" },
  lg: { mark: 64, type: 50, gap: "gap-3.5" },
} as const;

interface LogoProps {
  size?: keyof typeof HEIGHTS;
  /** auto: maroon wordmark, ivory in dark mode. inverse: always ivory (navy grounds).
   *  fixed: always maroon (the certificate, which prints on ivory). */
  tone?: "auto" | "inverse" | "fixed";
  /** The sphere alone — below about 200px of width. */
  markOnly?: boolean;
  href?: string | null;
  className?: string;
}

export function Logo({
  size = "md",
  tone = "auto",
  markOnly,
  href = "/",
  className,
}: LogoProps) {
  const h = HEIGHTS[size];
  const markH = markOnly ? 40 : h.mark;
  const typeW = Math.round((h.type * TYPE.w) / TYPE.h);

  const content = (
    <span className={cn("inline-flex items-center", h.gap, className)}>
      <Image
        src={MARK.src}
        alt={markOnly ? "Animation Academy" : ""}
        width={Math.round((markH * MARK.w) / MARK.h)}
        height={markH}
        priority
      />
      {!markOnly && (
        <>
          <Image
            src="/brand/aa-wordmark.png"
            alt="Animation Academy"
            width={typeW}
            height={h.type}
            priority
            className={cn(
              tone === "inverse" && "hidden",
              tone === "auto" && "dark:hidden",
            )}
          />
          <Image
            src="/brand/aa-wordmark-reversed.png"
            alt="Animation Academy"
            width={typeW}
            height={h.type}
            priority
            className={cn(
              tone === "fixed" && "hidden",
              tone === "auto" && "hidden dark:block",
            )}
          />
        </>
      )}
    </span>
  );

  if (!href) return content;
  return (
    <Link
      href={href}
      aria-label="Animation Academy home"
      className="inline-flex"
    >
      {content}
    </Link>
  );
}
