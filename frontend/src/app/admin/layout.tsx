import type { Metadata } from "next";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/DashboardShell";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <DashboardShell role="admin">{children}</DashboardShell>;
}
