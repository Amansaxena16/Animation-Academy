import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const publicApiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// Production (Vercel + Render): NEXT_PUBLIC_API_URL is "/api/v1", so the browser only ever talks
// to this site and the login cookies are first-party. The requests are passed on to the API
// at API_INTERNAL_URL. In development the browser calls the API directly.
const proxied = publicApiUrl.startsWith("/");
const apiTarget = process.env.API_INTERNAL_URL;
if (proxied && !apiTarget) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is a path, so API_INTERNAL_URL must give the API's full URL.",
  );
}
const apiOrigin = proxied ? "" : new URL(publicApiUrl).origin;
// Where uploaded photos and course images are served from (the storage bucket), if not the API.
const mediaOrigin = process.env.NEXT_PUBLIC_MEDIA_ORIGIN ?? "";

// What the browser may load. Scripts only from this site (Next.js needs inline scripts to
// start the page); data and images also from the API (course images, student photos).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${apiOrigin} ${mediaOrigin}`,
  "font-src 'self'",
  `connect-src 'self' ${apiOrigin}${isDev ? " ws: wss:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
]
  .map((d) => d.replace(/\s+/g, " ").trim())
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The production container runs the minimal standalone server (see /Dockerfile).
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // Django's URLs end in "/", so Next must not strip the slash from /api/v1/... requests.
  // Pages keep the usual redirect through the rule in redirects() below.
  skipTrailingSlashRedirect: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      // The public site is one page now; the old pages point at their sections. Temporary
      // (307) on purpose: browsers don't remember them, so a page can come back later.
      { source: "/admission", destination: "/#admission", permanent: false },
      { source: "/about", destination: "/#about", permanent: false },
      { source: "/contact", destination: "/#contact", permanent: false },
      { source: "/updates", destination: "/#updates", permanent: false },
      { source: "/courses", destination: "/#courses", permanent: false },
      {
        source: "/courses/:slug",
        destination: "/#course-:slug",
        permanent: false,
      },
      {
        source: "/:path((?!api/|django-admin).+)/",
        destination: "/:path",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    if (!proxied) return [];
    const target = apiTarget!.replace(/\/$/, "");
    const origin = new URL(target).origin;
    // :path* drops the trailing slash; Django API and admin URLs end in one.
    return [
      { source: "/api/v1/:path*", destination: `${target}/:path*/` },
      // When both apps share one address (the Render container), the Django admin, its
      // static files and the health check are passed through as well.
      { source: "/django-admin", destination: `${origin}/django-admin/` },
      {
        source: "/django-admin/:path*",
        destination: `${origin}/django-admin/:path*/`,
      },
      { source: "/static/:path*", destination: `${origin}/static/:path*` },
      { source: "/healthz", destination: `${origin}/healthz` },
    ];
  },
};

export default nextConfig;
