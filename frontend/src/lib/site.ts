import {
  Award,
  BadgeCheck,
  BriefcaseBusiness,
  IndianRupee,
  Layers,
  Monitor,
  type LucideIcon,
} from "lucide-react";

/** Only for pages that render when the API is unreachable (the error page). Everything else
 *  reads the office-edited SiteSettings from GET /api/v1/site/ (lib/content.ts). */
export const FALLBACK_CONTACT = {
  phones: ["8707447880", "9336202125"],
  email: "info@animationacademy.in",
} as const;

export const INSTITUTE = {
  tagline: "An ISO 9001:2000 Certified Multimedia Institute",
  runBy: "IOCSGT Computer Education",
  runByFull: "Institute of Computer Science & Graphics' Technology",
} as const;

export const PUBLIC_NAV = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "Admission", href: "/admission" },
  { label: "About", href: "/about" },
  { label: "Updates", href: "/updates" },
  { label: "Contact", href: "/contact" },
] as const;

/** "Why Animation Academy", verbatim from PROJECT_GUIDE §4. */
export const WHY: { title: string; text: string; icon: LucideIcon }[] = [
  {
    title: "ISO 9001:2000 certified",
    text: "A certified multimedia institute running to a documented syllabus, not an ad-hoc coaching class.",
    icon: BadgeCheck,
  },
  {
    title: "A machine for every student",
    text: "Batches are capped to the lab, so nobody shares a keyboard or watches over a shoulder.",
    icon: Monitor,
  },
  {
    title: "Job-ready syllabi",
    text: "Tally Prime with GST returns, CorelDraw, Photoshop, PHP and MySQL — what employers here actually ask for.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Verifiable certificates",
    text: "Every certificate carries a unique ID that an employer can check on this website.",
    icon: Award,
  },
  {
    title: "Beginner to professional",
    text: "Start at typing and computer fundamentals, finish at Maya, ZBrush and After Effect.",
    icon: Layers,
  },
  {
    title: "Monthly fees",
    text: "Pay month by month after a one-time registration — no lump sum before you have seen a class.",
    icon: IndianRupee,
  },
];
