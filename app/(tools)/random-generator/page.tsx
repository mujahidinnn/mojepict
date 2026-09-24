"use client";

import dynamic from "next/dynamic";
import { ToolHub, type HubMode } from "@/components/tools/ToolHub";

const MODES: HubMode[] = [
  { id: "password-generator", Component: dynamic(() => import("@/components/modes/password-generator")) },
  { id: "uuid-generator", Component: dynamic(() => import("@/components/modes/uuid-generator")) },
  { id: "lorem-ipsum", Component: dynamic(() => import("@/components/modes/lorem-ipsum")) },
  { id: "random-picker", Component: dynamic(() => import("@/components/modes/random-picker")) },
];

export default function Page() {
  return <ToolHub hubId="random-generator" modes={MODES} />;
}
