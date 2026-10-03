"use client";

import dynamic from "next/dynamic";

const ArchiveTool = dynamic(() => import("@/components/modes/archive-tool"));

export default function Page() {
  return <ArchiveTool />;
}
