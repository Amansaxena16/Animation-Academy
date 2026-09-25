import type { CourseFee } from "@/lib/format";

// Hand-written until Phase 3 generates types from the API schema (npm run api-types).

export const COURSE_CATEGORIES = [
  "Programming",
  "Accounting",
  "Design",
  "Web Designing",
  "Computer Basics",
  "Multimedia",
] as const;
export type CourseCategory = (typeof COURSE_CATEGORIES)[number];

export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";
export type CourseKind = "Diploma" | "Certificate" | "PG Diploma" | "Professional Diploma";

/** What a CourseCard needs. */
export interface CourseSummary extends CourseFee {
  slug: string;
  name: string;
  kind: CourseKind;
  category: CourseCategory;
  level: CourseLevel;
  description: string;
  /** "Most enrolled", "Flagship", "CCC". */
  tag?: string | null;
  image?: string | null;
}
