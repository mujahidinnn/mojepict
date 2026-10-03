"use client";

import dynamic from "next/dynamic";

const DocScanner = dynamic(() => import("@/components/modes/doc-scanner"));

export default function Page() {
  return <DocScanner />;
}
