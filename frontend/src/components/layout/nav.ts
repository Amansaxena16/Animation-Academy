import {
  Award,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  Megaphone,
  PanelsTopLeft,
  Settings,
  User,
  Users,
} from "lucide-react";

import type { NavItem } from "@/components/ui/Sidebar";

// Role navigation from PROJECT_GUIDE §3. `mobile` items go in the BottomNav (max 5).

export const STUDENT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/student", icon: LayoutDashboard, mobile: true },
  {
    label: "My Courses",
    href: "/student/courses",
    icon: BookOpen,
    mobile: true,
  },
  {
    label: "Certificates",
    href: "/student/certificates",
    icon: Award,
    mobile: true,
  },
  { label: "Profile", href: "/student/profile", icon: User, mobile: true },
];

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, mobile: true },
  {
    label: "Enrollments",
    href: "/admin/enrollments",
    icon: ClipboardList,
    group: "Manage",
    mobile: true,
  },
  { label: "Students", href: "/admin/students", icon: Users, mobile: true },
  { label: "Courses", href: "/admin/courses", icon: BookOpen, mobile: true },
  { label: "Certificates", href: "/admin/certificates", icon: Award },
  {
    label: "Announcements",
    href: "/admin/announcements",
    icon: Megaphone,
    group: "Website",
  },
  { label: "Website Content", href: "/admin/content", icon: PanelsTopLeft },
  { label: "Settings", href: "/admin/settings", icon: Settings, mobile: true },
];
