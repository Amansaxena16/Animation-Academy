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
  // Django's URLs end in "/", so Next must not strip the slash from /api/v1/... requests.
  // Pages keep the usual redirect through the rule in redirects() below.
  skipTrailingSlashRedirect: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      {
        source: "/:path((?!api/).+)/",
        destination: "/:path",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    if (!proxied) return [];
    const target = apiTarget!.replace(/\/$/, "");
    // :path* drops the trailing slash, and every Django API URL ends in one.
    return [{ source: "/api/v1/:path*", destination: `${target}/:path*/` }];
  },
};

export default nextConfig;
