"use client";

import dynamic from "next/dynamic";
import { ToolHub, type HubMode } from "@/components/tools/ToolHub";

const MODES: HubMode[] = [
  { id: "base64-encoder", Component: dynamic(() => import("@/components/modes/base64-encoder")) },
  { id: "url-encoder", Component: dynamic(() => import("@/components/modes/url-encoder")) },
  { id: "jwt-decoder", Component: dynamic(() => import("@/components/modes/jwt-decoder")) },
  { id: "hash-generator", Component: dynamic(() => import("@/components/modes/hash-generator")) },
];

export default function Page() {
  return <ToolHub hubId="encoder-decoder" modes={MODES} />;
}
