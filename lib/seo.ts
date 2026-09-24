import type { Metadata } from "next";
import { CATEGORIES, TOOLS } from "@/lib/tools";
import { en } from "@/lib/i18n/en";
import { TOOL_KEYWORDS } from "@/lib/tool-keywords";
import { HUB_MODES } from "@/lib/hubs";
import { CONVERTER_EDGES, FORMATS } from "@/lib/converter-formats";
import { id as idDict } from "@/lib/i18n/id";

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

/** Hubs list every mode / conversion pair, so searches for the old tool names still land here. */
const HUB_CAP = 60;

function hubFeatureNames(id: string): { en: string[]; id: string[] } | null {
  if (id === "converter") {
    const pairs = CONVERTER_EDGES.map((e) => [FORMATS[e.from].label, FORMATS[e.to].label]);
    return {
      en: pairs.map(([a, b]) => `${a} to ${b}`),
      id: pairs.map(([a, b]) => `ubah ${a} ke ${b}`),
    };
  }
  const modes = HUB_MODES[id]?.filter((m) => m !== id);
  if (!modes) return null;
  return {
    en: modes.map((m) => en[`tool.${m}.name` as EnKey] as string).filter(Boolean),
    id: modes.map((m) => (idDict as Record<string, string>)[`tool.${m}.name`]).filter(Boolean),
  };
}

function getToolKeywords(id: string, name: string, category: string): string[] {
  const features = hubFeatureNames(id);
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
  if (features) {
    return Array.from(
      new Set([
        ...[...features.en, ...en].slice(0, HUB_CAP),
        ...baseEn,
        ...[...features.id, ...idKeywords].slice(0, HUB_CAP),
      ]),
    );
  }
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

  const features = hubFeatureNames(tool.id);

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url: `${SITE_URL}/${slug}`,
    applicationCategory: "BrowserApplication",
    operatingSystem: "Any (runs in browser)",
    keywords: getToolKeywords(tool.id, name, tool.category).join(", "),
    ...(features && { featureList: features.en }),
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
