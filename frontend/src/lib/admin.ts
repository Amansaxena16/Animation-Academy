"use client";

// Admin console data (TanStack Query). Every write invalidates the "admin" queries so lists,
// counts and the sidebar badges stay in step.
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api, apiBlob, saveBlob } from "@/lib/api";
import type { AdminDashboard, Page } from "@/types/admin";

export const PAGE_SIZE = 20;

type Params = Record<string, string | number | boolean | undefined | null>;

export function query(params: Params): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params))
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** A paginated admin list: /admin/<path>/?page=…&…filters */
export function useAdminPage<T>(path: string, params: Params) {
  return useQuery({
    queryKey: ["admin", path, params],
    queryFn: () =>
      api<Page<T>>(
        `/admin/${path}/${query({ page_size: PAGE_SIZE, ...params })}`,
      ),
    placeholderData: keepPreviousData,
  });
}

/** An unpaginated admin resource (a course list, one student, the settings…). */
export function useAdmin<T>(path: string, params: Params = {}, enabled = true) {
  return useQuery({
    queryKey: ["admin", path, params],
    queryFn: () => api<T>(`/admin/${path}${query(params)}`),
    enabled,
  });
}

/** Any admin write; refreshes every admin query afterwards. */
export function useAdminAction<TBody = unknown, TResult = unknown>(
  method: "POST" | "PATCH" | "DELETE",
  path: (body: TBody) => string,
  body: (input: TBody) => unknown = (input) => input,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: TBody) =>
      api<TResult>(`/admin/${path(input)}`, {
        method,
        body: method === "DELETE" ? undefined : body(input),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useAdminDashboard(enabled = true) {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => api<AdminDashboard>("/admin/dashboard/"),
    enabled,
    refetchInterval: 60_000, // pending admissions arrive while the office works
  });
}

export async function downloadAdminCertificate(code: string) {
  saveBlob(
    await apiBlob(`/admin/certificates/${encodeURIComponent(code)}/pdf/`),
    `Certificate-${code}.pdf`,
  );
}
