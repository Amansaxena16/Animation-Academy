import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Showcase } from "./Showcase";

export const metadata: Metadata = {
  title: "Components",
  robots: { index: false },
};

/** Every UI component in light and dark, for visual checks. Not served in production. */
export default function ComponentsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Showcase />;
}
