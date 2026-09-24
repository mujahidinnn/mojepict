"use client";

import dynamic from "next/dynamic";
import { ToolHub, type HubMode } from "@/components/tools/ToolHub";

const MODES: HubMode[] = [
  { id: "percentage-calculator", Component: dynamic(() => import("@/components/modes/percentage-calculator")) },
  { id: "discount-calculator", Component: dynamic(() => import("@/components/modes/discount-calculator")) },
  { id: "tax-calculator", Component: dynamic(() => import("@/components/modes/tax-calculator")) },
  { id: "tip-calculator", Component: dynamic(() => import("@/components/modes/tip-calculator")) },
  { id: "split-bill", Component: dynamic(() => import("@/components/modes/split-bill")) },
  { id: "hpp-calculator", Component: dynamic(() => import("@/components/modes/hpp-calculator")) },
  { id: "profit-margin-calculator", Component: dynamic(() => import("@/components/modes/profit-margin-calculator")) },
  { id: "break-even-calculator", Component: dynamic(() => import("@/components/modes/break-even-calculator")) },
];

export default function Page() {
  return <ToolHub hubId="finance-calculator" modes={MODES} />;
}
