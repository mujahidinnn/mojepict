"use client";

import dynamic from "next/dynamic";
import { ToolHub, type HubMode } from "@/components/tools/ToolHub";

const MODES: HubMode[] = [
  { id: "merge-pdf", Component: dynamic(() => import("@/components/modes/merge-pdf")) },
  { id: "split-pdf", Component: dynamic(() => import("@/components/modes/split-pdf")) },
  { id: "pdf-editor", Component: dynamic(() => import("@/components/modes/pdf-editor")) },
];

export default function Page() {
  return <ToolHub hubId="pdf-toolkit" modes={MODES} />;
}
