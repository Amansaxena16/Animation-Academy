import {
  Archivo,
  EB_Garamond,
  JetBrains_Mono,
  Source_Sans_3,
} from "next/font/google";

// Self-hosted by next/font. The CSS variables are mapped to font-display / font-sans /
// font-serif / font-mono in src/styles/tokens.css.
export const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-archivo",
});

export const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-source-sans",
});

// Certificate recipient name only.
export const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: "600",
  style: "italic",
  variable: "--font-eb-garamond",
});

// IDs: AA-STU-1042, EN-2107, AA-2026-000123.
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-jetbrains-mono",
});

export const fontVariables = [archivo, sourceSans, ebGaramond, jetbrainsMono]
  .map((f) => f.variable)
  .join(" ");
