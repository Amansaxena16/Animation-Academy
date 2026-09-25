import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

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
  themeColor: "#1e3a6b",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN" className={fontVariables}>
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
