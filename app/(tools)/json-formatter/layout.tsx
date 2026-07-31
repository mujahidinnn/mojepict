import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { getToolJsonLd, getToolMetadata } from "@/lib/seo";

export const metadata: Metadata = getToolMetadata("json-formatter");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={getToolJsonLd("json-formatter")} />
      {children}
    </>
  );
}
