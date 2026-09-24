"use client";

import dynamic from "next/dynamic";
import { ToolHub, type HubMode } from "@/components/tools/ToolHub";

const MODES: HubMode[] = [
  { id: "image-resizer", Component: dynamic(() => import("@/components/modes/image-resizer")) },
  { id: "image-cropper", Component: dynamic(() => import("@/components/modes/image-cropper")) },
  { id: "image-compressor", Component: dynamic(() => import("@/components/modes/image-compressor")) },
  { id: "image-splitter", Component: dynamic(() => import("@/components/modes/image-splitter")) },
];

export default function Page() {
  return <ToolHub hubId="image-toolkit" modes={MODES} />;
}
