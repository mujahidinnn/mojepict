"use client";

import dynamic from "next/dynamic";
import { ToolHub, type HubMode } from "@/components/tools/ToolHub";

const MODES: HubMode[] = [
  { id: "unit-converter", labelKey: "hub.mode.unit-converter", Component: dynamic(() => import("@/components/modes/unit-converter")) },
  { id: "data-converter", Component: dynamic(() => import("@/components/modes/data-converter")) },
  { id: "physics-converter", Component: dynamic(() => import("@/components/modes/physics-converter")) },
  { id: "number-base-converter", Component: dynamic(() => import("@/components/modes/number-base-converter")) },
  { id: "timestamp-converter", Component: dynamic(() => import("@/components/modes/timestamp-converter")) },
];

export default function Page() {
  return <ToolHub hubId="unit-converter" modes={MODES} />;
}
