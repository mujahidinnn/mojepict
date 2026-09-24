"use client";

import dynamic from "next/dynamic";
import { ToolHub, type HubMode } from "@/components/tools/ToolHub";

const MODES: HubMode[] = [
  { id: "age-calculator", Component: dynamic(() => import("@/components/modes/age-calculator")) },
  { id: "date-difference-calculator", Component: dynamic(() => import("@/components/modes/date-difference-calculator")) },
];

export default function Page() {
  return <ToolHub hubId="date-calculator" modes={MODES} />;
}
