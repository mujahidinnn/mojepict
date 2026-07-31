import type { Metadata } from "next";
import { TOOLS } from "@/lib/tools";
import { en } from "@/lib/i18n/en";

export const SITE_URL = "https://mojepict.vercel.app";
export const SITE_NAME = "Mojepict";
export const SITE_DESCRIPTION = en["site.description"];
const OG_IMAGE = "/mojepict-logo.png";

type EnKey = keyof typeof en;

function toolCopy(id: string) {
  const name = en[`tool.${id}.name` as EnKey] as string | undefined;
  const description = en[`tool.${id}.description` as EnKey] as
    | string
    | undefined;
  return { name, description };
}

export function getToolMetadata(slug: string): Metadata {
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) return {};

  const { name, description } = toolCopy(tool.id);
  if (!name || !description) return {};

  const url = `${SITE_URL}/${slug}`;
  const title = `${name} — Free Online Tool`;

  return {
    title,
    description,
    alternates: { canonical: url },
    keywords: [
      name,
      `free ${name.toLowerCase()}`,
      `online ${name.toLowerCase()}`,
      tool.category,
      "browser-based tool",
      SITE_NAME,
    ],
    openGraph: {
      title: `${name} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: OG_IMAGE, width: 253, height: 253, alt: name }],
    },
    twitter: {
      card: "summary",
      title: `${name} | ${SITE_NAME}`,
      description,
      images: [OG_IMAGE],
    },
  };
}

export function getToolJsonLd(slug: string) {
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) return null;

  const { name, description } = toolCopy(tool.id);
  if (!name || !description) return null;

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url: `${SITE_URL}/${slug}`,
    applicationCategory: "BrowserApplication",
    operatingSystem: "Any (runs in browser)",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function getWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function getOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}${OG_IMAGE}`,
  };
}
