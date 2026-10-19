import type { Metadata } from "next";
import { HomePage } from "@/components/layout/HomePage";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL, getHomeJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

export default function Page() {
  return (
    <>
      <JsonLd data={getHomeJsonLd()} />
      <HomePage />
    </>
  );
}
