// Site settings and announcements for Server Components. Public and cached for 5 minutes,
// tagged so an admin edit can refresh them early with revalidateTag (Phase 8).
import { api } from "@/lib/api";
import type { Announcement, AnnouncementCategory, Site } from "@/types/content";

export function getSite(): Promise<Site> {
  return api<Site>("/site/", {
    auth: false,
    next: { revalidate: 300, tags: ["site"] },
  });
}

export function getAnnouncements(
  params: {
    category?: AnnouncementCategory;
    upcoming?: boolean;
    limit?: number;
  } = {},
): Promise<Announcement[]> {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.upcoming) query.set("upcoming", "true");
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return api<Announcement[]>(`/announcements/${qs ? `?${qs}` : ""}`, {
    auth: false,
    next: { revalidate: 300, tags: ["announcements"] },
  });
}

/** tel: link for an Indian mobile number. */
export const telHref = (phone: string) =>
  `tel:+91${phone.replace(/\D/g, "").slice(-10)}`;
