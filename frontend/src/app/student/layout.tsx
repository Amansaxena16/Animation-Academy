import type { Metadata } from "next";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/DashboardShell";

export const metadata: Metadata = {
  title: "Student",
  robots: { index: false },
};

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <DashboardShell role="student">{children}</DashboardShell>;
}
