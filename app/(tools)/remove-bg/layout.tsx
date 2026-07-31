import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { getToolJsonLd, getToolMetadata } from "@/lib/seo";

export const metadata: Metadata = getToolMetadata("remove-bg");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={getToolJsonLd("remove-bg")} />
      {children}
    </>
  );
}
