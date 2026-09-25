// Course data for Server Components. Public, so no token; cached for 5 minutes and tagged
// "courses" so an admin edit can refresh it early with revalidateTag (Phase 8).
import { api, ApiError } from "@/lib/api";
import type { Category, Course, CourseDetail } from "@/types/course";

const CACHE = { revalidate: 300, tags: ["courses"] };

export function getCourses(): Promise<Course[]> {
  return api<Course[]>("/courses/", { auth: false, next: CACHE });
}

export function getCategories(): Promise<Category[]> {
  return api<Category[]>("/courses/categories/", { auth: false, next: CACHE });
}

/** null when the course doesn't exist or isn't published. */
export async function getCourse(slug: string): Promise<CourseDetail | null> {
  try {
    return await api<CourseDetail>(`/courses/${encodeURIComponent(slug)}/`, {
      auth: false,
      next: CACHE,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
