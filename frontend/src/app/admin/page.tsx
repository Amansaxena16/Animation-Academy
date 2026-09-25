"use client";

import { ClipboardList } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/lib/auth";

// Placeholder until Phase 8 (the admin console).
export default function AdminDashboard() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-h1 m-0">Good day, {user?.name}</h1>
      <Card>
        <EmptyState
          icon={<ClipboardList />}
          title="No pending admissions"
          text="New applications from the admission form will be listed here for approval."
        />
      </Card>
    </div>
  );
}
