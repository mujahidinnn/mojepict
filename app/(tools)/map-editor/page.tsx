"use client";

import dynamic from "next/dynamic";

const MapEditor = dynamic(() => import("@/components/modes/map-editor"), { ssr: false });

export default function Page() {
  return <MapEditor />;
}
