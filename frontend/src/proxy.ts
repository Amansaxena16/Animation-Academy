import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Optimistic redirect only. `aa_session` holds the role ("student" / "admin") and is set
// by the API next to the httpOnly refresh cookie. It is not a credential: every API call
// is checked with the access token, and the dashboard layouts re-check the role.
const HOME = { student: "/student", admin: "/admin" } as const;

export function proxy(request: NextRequest) {
  const role = request.cookies.get("aa_session")?.value as
    keyof typeof HOME | undefined;
  const { pathname, search } = request.nextUrl;
  const area = pathname.startsWith("/admin") ? "admin" : "student";

  if (!role || !(role in HOME)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }
  if (role !== area) {
    return NextResponse.redirect(new URL(HOME[role], request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/admin/:path*"],
};
