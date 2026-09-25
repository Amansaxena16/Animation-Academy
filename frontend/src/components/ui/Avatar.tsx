/* eslint-disable @next/next/no-img-element -- student photos come from the API's media host */
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

const SIZES = {
  sm: "size-8 text-xs",
  md: "size-10 text-[15px]",
  lg: "size-16 text-2xl",
  xl: "size-[120px] text-[46px]",
} as const;

// Initial fallbacks rotate through the soft grounds with their matching ink.
const TINTS = [
  "bg-brand-soft text-brand-ink",
  "bg-accent-soft text-accent-ink",
  "bg-navy-soft text-navy-ink",
  "bg-success-soft text-success-ink",
];

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  /** Pick the fallback tint; defaults to one derived from the name. */
  tint?: number;
  /** A surface-coloured ring, for overlapping avatars. */
  ring?: boolean;
  className?: string;
}

export function Avatar({ name, src, size = "md", tint, ring, className }: AvatarProps) {
  const t = tint ?? [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-display leading-none font-bold",
        SIZES[size],
        !src && TINTS[t % TINTS.length],
        ring && "ring-4 ring-surface-raised",
        className,
      )}
      aria-hidden={!src}
    >
      {src ? <img src={src} alt={name} className="size-full object-cover" /> : initials(name)}
    </span>
  );
}
