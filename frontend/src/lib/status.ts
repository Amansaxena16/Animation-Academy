import type { BadgeTone } from "@/components/ui/Badge";

// Status → badge tone, as the design system maps them (PROJECT_GUIDE §6).

export const enrollmentTone: Record<string, BadgeTone> = {
  Pending: "warning",
  Active: "info",
  Completed: "success",
  Cancelled: "danger",
};

export const studentTone: Record<string, BadgeTone> = {
  Pending: "warning",
  Active: "info",
  Inactive: "neutral",
  Graduated: "success",
};

export const levelTone: Record<string, BadgeTone> = {
  Beginner: "neutral",
  Intermediate: "info",
  Advanced: "brand",
};

export const courseStatusTone: Record<string, BadgeTone> = {
  Published: "success",
  Draft: "neutral",
};

export const announcementTone: Record<string, BadgeTone> = {
  General: "neutral",
  Holiday: "warning",
  "Course Update": "info",
  Exam: "brand",
  Event: "success",
  "Important Notice": "danger",
};
