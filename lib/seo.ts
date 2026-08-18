import type { Metadata } from "next";
import { CATEGORIES, TOOLS } from "@/lib/tools";
import { en } from "@/lib/i18n/en";
import { TOOL_KEYWORDS } from "@/lib/tool-keywords";

export const SITE_URL = "https://mojepict.vercel.app";
export const SITE_NAME = "Mojepict";
export const SITE_DESCRIPTION = en["site.description"];
const OG_LOGO = "/mojepict-logo.png";

type EnKey = keyof typeof en;

function toolOgImage(name: string, category: keyof typeof CATEGORIES, icon: string) {
  const categoryLabel = (en[CATEGORIES[category].labelKey as EnKey] as
    | string
    | undefined) ?? category;
  const params = new URLSearchParams({
    title: name,
    subtitle: "Free Online Tool",
    eyebrow: categoryLabel,
    category,
    icon,
  });
  return `/og?${params.toString()}`;
}

function toolCopy(id: string) {
  const name = en[`tool.${id}.name` as EnKey] as string | undefined;
  const description = en[`tool.${id}.description` as EnKey] as
    | string
    | undefined;
  return { name, description };
}

function getToolKeywords(id: string, name: string, category: string): string[] {
  const baseEn = [
    name,
    `free ${name.toLowerCase()}`,
    `online ${name.toLowerCase()}`,
    category,
    "free online tool",
    SITE_NAME,
  ];
  const { en = [], id: idKeywords = [] } = TOOL_KEYWORDS[id] ?? {};
  // English block first, then Indonesian block — kept separate rather than
  // interleaved so each language reads as its own coherent group.
  return Array.from(new Set([...en, ...baseEn, ...idKeywords]));
}

export function getToolMetadata(slug: string): Metadata {
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) return {};

  const { name, description } = toolCopy(tool.id);
  if (!name || !description) return {};

  const url = `${SITE_URL}/${slug}`;
  const title = `${name} · Free Online Tool`;
  const keywords = getToolKeywords(tool.id, name, tool.category);
  const ogImage = toolOgImage(name, tool.category, tool.icon);

  return {
    title,
    description,
    alternates: { canonical: url },
    keywords,
    openGraph: {
      title: `${name} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | ${SITE_NAME}`,
      description,
      images: [ogImage],
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
    keywords: getToolKeywords(tool.id, name, tool.category).join(", "),
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
    logo: `${SITE_URL}${OG_LOGO}`,
  };
}
