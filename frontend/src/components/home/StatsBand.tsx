"use client";

import {
  Award,
  BookOpen,
  CalendarDays,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { Stat } from "@/types/content";

const ICONS: LucideIcon[] = [Users, BookOpen, CalendarDays, Award];
const DURATION = 1200;

/** "1000+" → 1,000+ at progress t (0–1). Values that don't start with a number stay as typed. */
function display(value: string, t: number) {
  const match = value.match(/^(\d+)(.*)$/);
  if (!match) return value;
  return Math.round(Number(match[1]) * t).toLocaleString("en-IN") + match[2];
}

/** The numbers row: a flat, ruled strip under the hero. Counts up once when it first scrolls into view; the server-rendered
 *  HTML has the final numbers, and reduced motion skips the animation. */
export function StatsBand({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    if (el.getBoundingClientRect().top < window.innerHeight) return; // already on screen: leave as is

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / DURATION);
          setT(1 - (1 - p) ** 3); // ease-out
          if (p < 1) frame = requestAnimationFrame(tick);
        };
        setT(0);
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      aria-label="Animation Academy in numbers"
      className="mx-auto max-w-[1200px] px-4 md:px-6"
    >
      <div
        ref={ref}
        className="border-line grid grid-cols-2 gap-5 rounded-lg border px-5 py-6 sm:gap-6 sm:px-6 sm:py-7 md:px-8 lg:grid-cols-4 lg:[&>div+div]:border-l lg:[&>div+div]:pl-6"
      >
        {stats.map((stat, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <div
              key={stat.label}
              className="border-line flex min-w-0 items-center gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-2.5"
            >
              <span className="bg-brand-soft text-brand-ink grid size-12 shrink-0 place-items-center rounded-md">
                <Icon className="size-6" aria-hidden />
              </span>
              <div>
                <div className="type-stat tabular-nums max-sm:text-[26px] max-sm:leading-[30px]">
                  {display(stat.value, t)}
                </div>
                <div className="text-ink-muted text-sm">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
