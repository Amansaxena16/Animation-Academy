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

/** The numbers band. Counts up once when it first scrolls into view; the server-rendered
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
      className="bg-navy text-on-navy"
    >
      <div
        ref={ref}
        className="mx-auto grid max-w-[1200px] grid-cols-2 gap-6 px-4 py-10 md:px-6 lg:grid-cols-4"
      >
        {stats.map((stat, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <div key={stat.label} className="flex items-center gap-4">
              <span className="text-accent grid size-12 shrink-0 place-items-center rounded-md bg-white/10">
                <Icon className="size-6" aria-hidden />
              </span>
              <div>
                <div className="type-stat tabular-nums">
                  {display(stat.value, t)}
                </div>
                <div className="text-sm text-white/75">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
