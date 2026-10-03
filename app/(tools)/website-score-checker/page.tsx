"use client";

import dynamic from "next/dynamic";

const WebsiteScoreChecker = dynamic(() => import("@/components/modes/website-score-checker"));

export default function Page() {
  return <WebsiteScoreChecker />;
}
