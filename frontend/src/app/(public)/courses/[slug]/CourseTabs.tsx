"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { Tabs } from "@/components/ui/Tabs";

/** Both panels are in the server-rendered HTML (good for search engines); the tabs only
 *  toggle which one is visible. */
export function CourseTabs({
  overview,
  syllabus,
}: {
  overview: ReactNode;
  syllabus: ReactNode;
}) {
  const [tab, setTab] = useState<"overview" | "syllabus">("overview");
  return (
    <div className="flex flex-col gap-8">
      <Tabs
        items={[
          { key: "overview", label: "Overview" },
          { key: "syllabus", label: "Syllabus" },
        ]}
        active={tab}
        onChange={setTab}
      />
      <div role="tabpanel" hidden={tab !== "overview"}>
        {overview}
      </div>
      <div role="tabpanel" hidden={tab !== "syllabus"}>
        {syllabus}
      </div>
    </div>
  );
}
