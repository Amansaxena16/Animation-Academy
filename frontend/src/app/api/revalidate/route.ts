import { timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

// Called by the Django backend (common/revalidate.py) after staff edit public content, so the
// change shows on the next page load instead of after the 5-minute cache.
const TAGS = new Set(["courses", "site", "announcements"]);

function authorised(request: NextRequest): boolean {
  const expected = process.env.REVALIDATE_SECRET ?? "";
  const given = request.headers.get("x-revalidate-secret") ?? "";
  if (!expected || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

export async function POST(request: NextRequest) {
  if (!authorised(request))
    return Response.json({ detail: "Not allowed." }, { status: 401 });

  let tags: unknown;
  try {
    ({ tags } = await request.json());
  } catch {
    return Response.json(
      { detail: 'Send JSON: {"tags": [...]}' },
      { status: 400 },
    );
  }
  const valid = Array.isArray(tags)
    ? tags.filter((t): t is string => typeof t === "string" && TAGS.has(t))
    : [];
  if (!valid.length)
    return Response.json(
      { detail: `Tags must be some of: ${[...TAGS].join(", ")}.` },
      { status: 400 },
    );

  // expire: 0 → the next visit fetches fresh data (staff expect to see their edit at once).
  for (const tag of valid) revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: valid });
}
