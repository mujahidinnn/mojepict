"use client";

import dynamic from "next/dynamic";
import { ToolHub, type HubMode } from "@/components/tools/ToolHub";

const MODES: HubMode[] = [
  { id: "qr-generator", Component: dynamic(() => import("@/components/modes/qr-generator")) },
  { id: "barcode-generator", Component: dynamic(() => import("@/components/modes/barcode-generator")) },
  { id: "qr-scanner", Component: dynamic(() => import("@/components/modes/qr-scanner")) },
];

export default function Page() {
  return <ToolHub hubId="code-generator" modes={MODES} />;
}
