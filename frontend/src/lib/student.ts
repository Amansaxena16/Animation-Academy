"use client";

// Student-portal data with TanStack Query. Every call sends the access token; the dashboard
// shell only renders these pages once the session is restored.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type {
  Dashboard,
  EnrollmentStatus,
  MyEnrollment,
  Profile,
} from "@/types/student";

const keys = {
  dashboard: ["me", "dashboard"] as const,
  profile: ["me", "profile"] as const,
  enrollments: ["me", "enrollments"] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: keys.dashboard,
    queryFn: () => api<Dashboard>("/me/dashboard/"),
  });
}

export function useProfile() {
  return useQuery({
    queryKey: keys.profile,
    queryFn: () => api<Profile>("/me/profile/"),
  });
}

export function useEnrollments() {
  return useQuery({
    queryKey: keys.enrollments,
    queryFn: () => api<MyEnrollment[]>("/me/enrollments/"),
  });
}

/** PATCH /me/profile/ — a plain object, or FormData when a photo is attached. */
export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown> | FormData) =>
      api<Profile>("/me/profile/", { method: "PATCH", body }),
    onSuccess: (profile) => client.setQueryData(keys.profile, profile),
  });
}

export function useApply() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (course: string) =>
      api<MyEnrollment>("/me/enrollments/", {
        method: "POST",
        body: { course, accept_no_refund: true },
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: keys.enrollments });
      void client.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { old_password: string; new_password: string }) =>
      api<{ access: string }>("/auth/change-password/", {
        method: "POST",
        body,
      }),
  });
}

/** What each enrollment status means to the student. */
export const STATUS_NOTE: Record<EnrollmentStatus, string> = {
  Pending:
    "The office will call you within one working day to confirm your seat.",
  Active: "You're enrolled. Classes run at the institute on the batch timings.",
  Completed: "Course completed.",
  Cancelled: "This application was cancelled. You can apply again.",
};
