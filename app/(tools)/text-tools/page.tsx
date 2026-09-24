"use client";

import dynamic from "next/dynamic";
import { ToolHub, type HubMode } from "@/components/tools/ToolHub";

const MODES: HubMode[] = [
  { id: "case-converter", Component: dynamic(() => import("@/components/modes/case-converter")) },
  { id: "slug-generator", Component: dynamic(() => import("@/components/modes/slug-generator")) },
];

export default function Page() {
  return <ToolHub hubId="text-tools" modes={MODES} />;
}
