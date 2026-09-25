"use client";

import { BookOpen } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/lib/auth";

// Placeholder until Phase 6 (enrollments, profile, certificates).
export default function StudentDashboard() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-h1 m-0">Welcome, {user?.name.split(" ")[0]}</h1>
      <Card>
        <EmptyState
          icon={<BookOpen />}
          title="Your courses will appear here"
          text="Once you apply for a course, its admission status and batch details show on this page."
          action={<ButtonLink href="/courses">Browse Courses</ButtonLink>}
        />
      </Card>
    </div>
  );
}
