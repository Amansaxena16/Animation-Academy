import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { THEME_SCRIPT } from "@/lib/theme-script";

import { fontVariables } from "./fonts";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default:
      "Animation Academy — ISO 9001:2000 certified multimedia institute, Kanpur",
    template: "%s · Animation Academy",
  },
  description:
    "Computer, accounting, design and animation courses in Nehru Nagar, Kanpur — from typing and Tally Prime with GST to an 18-month Professional Diploma in Multimedia. Monthly fees.",
  openGraph: {
    siteName: "Animation Academy",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/brand/aa-social.png",
        width: 600,
        height: 600,
        alt: "Animation Academy",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0c10",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // data-theme is dark on the server; THEME_SCRIPT switches it to the visitor's saved choice
    // before paint, hence suppressHydrationWarning on this one element.
    <html
      lang="en-IN"
      className={fontVariables}
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
